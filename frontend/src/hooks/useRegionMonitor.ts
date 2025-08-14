'use client'

import { useState, useEffect, useCallback } from 'react'
import { Region, DetectionItem, CapturedImage, RegionTriggerSettings, RegionMonitorState } from '@/types'
import { classOptions } from '@/constants'
import { ScreenshotService } from '@/utils/screenshotService'

export function useRegionMonitor(regions: Region[], detectionResult: DetectionItem[]) {
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([])
  const [triggerSettings, setTriggerSettings] = useState<RegionTriggerSettings[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const screenshotService = ScreenshotService.getInstance()

  // Initialize trigger settings when regions change
  useEffect(() => {
    const newSettings = regions.map(region => {
      const existingSetting = triggerSettings.find(s => s.regionId === region.id)
      return existingSetting || {
        regionId: region.id,
        enabled: false,
        triggerClasses: [],
        includeBbox: false,
        maxImages: 100
      }
    })
    setTriggerSettings(newSettings)
  }, [regions])

  // Function to check if a point is inside a polygon (region)
  const isPointInRegion = useCallback((point: { x: number; y: number }, region: Region): boolean => {
    return screenshotService.isPointInRegion(point, region)
  }, [screenshotService])

  // Function to capture screenshot
  const captureScreenshot = useCallback(async (
    regionId: number,
    regionName: string,
    detectedObjects: DetectionItem[],
    includeBbox: boolean
  ): Promise<void> => {
    try {
      const region = regions.find(r => r.id === regionId)
      const imageData = await screenshotService.captureScreenshot(includeBbox, detectedObjects, region)

      const newImage: CapturedImage = {
        id: `${regionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        regionId,
        regionName,
        timestamp: Date.now(),
        filename: `${regionName}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
        detectedObjects,
        imageData,
        hasBbox: includeBbox
      }

      setCapturedImages(prev => {
        const regionImages = prev.filter(img => img.regionId === regionId)
        const maxImages = triggerSettings.find(s => s.regionId === regionId)?.maxImages || 100
        
        // Remove oldest images if we exceed the limit
        const updatedRegionImages = [...regionImages, newImage].slice(-maxImages)
        const otherImages = prev.filter(img => img.regionId !== regionId)
        
        const newState = [...otherImages, ...updatedRegionImages]
        
        // Global limit: keep only the most recent 200 images across all regions
        const globalLimit = 200
        if (newState.length > globalLimit) {
          return newState
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, globalLimit)
        }
        
        return newState
      })

      console.log(`Screenshot captured for region ${regionName}`)
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
    }
  }, [regions, triggerSettings, screenshotService])

  // Monitor detection results and trigger screenshots
  useEffect(() => {
    if (!isMonitoring || detectionResult.length === 0) return

    regions.forEach(region => {
      const setting = triggerSettings.find(s => s.regionId === region.id)
      if (!setting || !setting.enabled) return

      // Check if any detected objects are in this region and match trigger criteria
      const objectsInRegion = detectionResult.filter(detection => {
        // For this demo, we'll assume objects are detected at the center of the region
        // In a real implementation, you'd have bounding box coordinates
        const regionCenter = {
          x: region.points.reduce((sum, p) => sum + p.x, 0) / region.points.length,
          y: region.points.reduce((sum, p) => sum + p.y, 0) / region.points.length
        }

        // Check if the object type is in the trigger classes
        const classOption = classOptions.find(c => c.name === detection.label)
        const shouldTrigger = setting.triggerClasses.length === 0 || 
                             (classOption && setting.triggerClasses.includes(classOption.id))

        return shouldTrigger && isPointInRegion(regionCenter, region)
      })

      if (objectsInRegion.length > 0) {
        // Check if we haven't captured a screenshot for this region recently (throttling)
        const recentImages = capturedImages.filter(
          img => img.regionId === region.id && Date.now() - img.timestamp < 5000 // 5 second throttle
        )

        if (recentImages.length === 0) {
          captureScreenshot(region.id, region.name, objectsInRegion, false) // Always disable bbox
        }
      }
    })
  }, [detectionResult, isMonitoring, regions, triggerSettings, capturedImages, captureScreenshot, isPointInRegion])

  // Update trigger setting for a specific region
  const updateTriggerSetting = useCallback((regionId: number, updates: Partial<RegionTriggerSettings>) => {
    setTriggerSettings(prev => prev.map(setting => 
      setting.regionId === regionId ? { ...setting, ...updates } : setting
    ))
  }, [])

  // Delete a specific image
  const deleteImage = useCallback((imageId: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId))
  }, [])

  // Delete all images for a specific region
  const deleteRegionImages = useCallback((regionId: number) => {
    setCapturedImages(prev => prev.filter(img => img.regionId !== regionId))
  }, [])

  // Delete all images
  const deleteAllImages = useCallback(() => {
    if (confirm('Are you sure you want to delete all captured images?')) {
      setCapturedImages([])
    }
  }, [])

  // Get images for a specific region
  const getRegionImages = useCallback((regionId: number) => {
    return capturedImages.filter(img => img.regionId === regionId)
  }, [capturedImages])

  // Load saved data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('harborTrackingMonitor')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        
        // Handle both old and new format
        if (data.capturedImages) {
          // Old format - has full image data
          setCapturedImages(data.capturedImages || [])
        } else if (data.imageMetadata) {
          // New format - only metadata, images will be empty
          // Note: We don't restore images from metadata since we don't store imageData
          setCapturedImages([])
        }
        
        setTriggerSettings(data.triggerSettings || [])
        setIsMonitoring(data.isMonitoring || false)
      } catch (error) {
        console.error('Failed to load monitor data:', error)
      }
    }
  }, [])

  // Save data to localStorage (metadata only, not images)
  useEffect(() => {
    try {
      const data = {
        triggerSettings,
        isMonitoring,
        // Only save metadata about images, not the actual image data
        imageMetadata: capturedImages.map(img => ({
          id: img.id,
          regionId: img.regionId,
          regionName: img.regionName,
          timestamp: img.timestamp,
          detectedObjects: img.detectedObjects
          // Exclude imageData to save space
        }))
      }
      localStorage.setItem('harborTrackingMonitor', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save monitor data to localStorage:', error)
      
      // If quota exceeded, clean up old data and try again
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        try {
          // Clear some old keys that might be taking up space
          const keysToCheck = ['harborTrackingMonitor', 'harborTrackingRegions']
          keysToCheck.forEach(key => {
            try {
              localStorage.removeItem(key)
            } catch (e) {
              // Ignore errors when removing
            }
          })
          
          // Try to save minimal data again
          const minimalData = {
            triggerSettings,
            isMonitoring
          }
          localStorage.setItem('harborTrackingMonitor', JSON.stringify(minimalData))
          console.log('Saved minimal monitor data after quota cleanup')
        } catch (secondError) {
          console.error('Failed to save even minimal monitor data:', secondError)
        }
      }
    }
  }, [capturedImages, triggerSettings, isMonitoring])

  return {
    capturedImages,
    triggerSettings,
    isMonitoring,
    setIsMonitoring,
    selectedRegionId,
    setSelectedRegionId,
    viewMode,
    setViewMode,
    updateTriggerSetting,
    deleteImage,
    deleteRegionImages,
    deleteAllImages,
    getRegionImages
  }
}
