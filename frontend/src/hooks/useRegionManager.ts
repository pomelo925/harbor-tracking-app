'use client'

import { useState, useEffect, useCallback } from 'react'
import { Region, Point } from '@/types'
import { regionColors } from '@/constants'

export function useRegionManager() {
  const [staticImage, setStaticImage] = useState<string | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [currentRegion, setCurrentRegion] = useState<Point[]>([])
  const [isAddingRegion, setIsAddingRegion] = useState(false)
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)
  const [regionCounter, setRegionCounter] = useState(1)
  
  // Dragging states
  const [isDragging, setIsDragging] = useState(false)
  const [dragRegionId, setDragRegionId] = useState<number | null>(null)
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null)

  const captureStaticImage = useCallback(() => {
    setStaticImage("http://localhost:8000/video_feed")
  }, [])

  const startAddingRegion = useCallback(() => {
    captureStaticImage()
    setIsAddingRegion(true)
    setCurrentRegion([])
  }, [captureStaticImage])

  const cancelAddingRegion = useCallback(() => {
    setIsAddingRegion(false)
    setCurrentRegion([])
  }, [])

  const completeRegion = useCallback(() => {
    if (currentRegion.length < 3) {
      alert("A region must have at least 3 points")
      return
    }

    const colorIndex = (regionCounter - 1) % regionColors.length
    const newRegion: Region = {
      id: regionCounter,
      name: `Region ${regionCounter}`,
      points: [...currentRegion],
      completed: true,
      color: regionColors[colorIndex]
    }

    setRegions(prev => [...prev, newRegion])
    setRegionCounter(prev => prev + 1)
    setCurrentRegion([])
    setIsAddingRegion(false)
  }, [currentRegion, regionCounter])

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingRegion || isDragging) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const newPoint = { x, y }
    
    if (currentRegion.length > 2) {
      const firstPoint = currentRegion[0]
      const distance = Math.sqrt((x - firstPoint.x) ** 2 + (y - firstPoint.y) ** 2)
      
      if (distance < 20) {
        completeRegion()
        return
      }
    }
    
    setCurrentRegion(prev => [...prev, newPoint])
  }, [isAddingRegion, isDragging, currentRegion, completeRegion])

  const deleteRegion = useCallback((regionId: number) => {
    setRegions(prev => prev.filter(region => region.id !== regionId))
    if (selectedRegionId === regionId) {
      setSelectedRegionId(null)
    }
  }, [selectedRegionId])

  const updateRegionName = useCallback((regionId: number, newName: string) => {
    setRegions(prev => prev.map(region => 
      region.id === regionId ? { ...region, name: newName } : region
    ))
  }, [])

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGCircleElement>, regionId: number, pointIndex: number) => {
    event.stopPropagation()
    setIsDragging(true)
    setDragRegionId(regionId)
    setDragPointIndex(pointIndex)
  }, [])

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || dragRegionId === null || dragPointIndex === null) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setRegions(prev => prev.map(region => {
      if (region.id === dragRegionId) {
        const newPoints = [...region.points]
        newPoints[dragPointIndex] = { x, y }
        return { ...region, points: newPoints }
      }
      return region
    }))
  }, [isDragging, dragRegionId, dragPointIndex])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragRegionId(null)
    setDragPointIndex(null)
  }, [])

  const clearAllRegions = useCallback(() => {
    if (regions.length > 0 && confirm("Are you sure you want to clear all regions?")) {
      setRegions([])
      setRegionCounter(1)
      cancelAddingRegion()
      localStorage.removeItem('harborTrackingRegions')
    }
  }, [regions, cancelAddingRegion])

  // Effect to auto-save current regions to localStorage
  useEffect(() => {
    if (regions.length > 0) {
      localStorage.setItem('harborTrackingRegions', JSON.stringify({
        regions,
        regionCounter
      }))
    }
  }, [regions, regionCounter])

  // Effect to load current regions from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('harborTrackingRegions')
    if (savedData) {
      try {
        const { regions: savedRegions, regionCounter: savedCounter } = JSON.parse(savedData)
        if (savedRegions && savedRegions.length > 0) {
          setRegions(savedRegions)
          setRegionCounter(savedCounter || 1)
        }
      } catch (error) {
        console.error('Failed to parse saved regions:', error)
      }
    }
  }, [])

  return {
    staticImage,
    regions,
    currentRegion,
    isAddingRegion,
    selectedRegionId,
    regionCounter,
    isDragging,
    dragRegionId,
    dragPointIndex,
    captureStaticImage,
    startAddingRegion,
    cancelAddingRegion,
    handleImageClick,
    completeRegion,
    deleteRegion,
    updateRegionName,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearAllRegions,
    setStaticImage
  }
}
