'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { Navigation, LiveStream, Settings, RegionMapper, RegionMonitor } from '@/components'
import { useDetection, useRegionManager, useRegionMonitor } from '@/hooks'

export default function Home() {
  const [activeNavItem, setActiveNavItem] = useState('Live Stream')
  
  // Region overlay settings
  const [showRegionOverlay, setShowRegionOverlay] = useState(true)
  const [overlayMode, setOverlayMode] = useState<'edges' | 'fill' | 'both'>('both')
  const [fillOpacity, setFillOpacity] = useState(0.2)

  // Use custom hooks
  const detectionHook = useDetection()
  const regionHook = useRegionManager()
  const monitorHook = useRegionMonitor(regionHook.regions, detectionHook.detectionResult)

  // Effect to capture static image when entering Region Mapper
  useEffect(() => {
    if (activeNavItem === 'Region Mapper' && !regionHook.staticImage) {
      regionHook.captureStaticImage()
    }
  }, [activeNavItem, regionHook.staticImage, regionHook.captureStaticImage])

  // Effect to cancel current region when switching pages
  useEffect(() => {
    if (activeNavItem !== 'Region Mapper') {
      regionHook.cancelAddingRegion()
    }
  }, [activeNavItem, regionHook.cancelAddingRegion])
  return (
    <main className="font-sans flex flex-col h-screen bg-[#1f2544] text-[#fefefe] overflow-hidden">
      {/* Header */}
      <header className="flex justify-center items-center shrink-0 h-14 bg-[#1a1a1a] border-b border-[#333]">
        <h1 className="text-xl font-medium text-[#ffffff] tracking-wide">NCHC Harbor Tracking App</h1>
      </header>

      <div className="flex h-screen bg-black items-center justify-center">
        {/* Fixed Navbar */}
        <Navigation 
          activeNavItem={activeNavItem}
          setActiveNavItem={setActiveNavItem}
        />

        {/* Body with left margin for navbar */}
        <div className="flex gap-4 px-4 pb-2 justify-center items-center h-[540px] ml-72 w-full">{/* ml-72 = w-56 + left-8 + gap */}
          {activeNavItem === 'Live Stream' && (
            <LiveStream
              confidence={detectionHook.confidence}
              maxDetections={detectionHook.maxDetections}
              selectedClasses={detectionHook.selectedClasses}
              showDetectionResults={detectionHook.showDetectionResults}
              showRegionOverlay={showRegionOverlay}
              overlayMode={overlayMode}
              fillOpacity={fillOpacity}
              regions={regionHook.regions}
              detectionResult={detectionHook.detectionResult}
              log={detectionHook.log}
            />
          )}

          {activeNavItem === 'Settings' && (
            <Settings
              confidence={detectionHook.confidence}
              setConfidence={detectionHook.setConfidence}
              maxDetections={detectionHook.maxDetections}
              setMaxDetections={detectionHook.setMaxDetections}
              selectedClasses={detectionHook.selectedClasses}
              showDetectionResults={detectionHook.showDetectionResults}
              setShowDetectionResults={detectionHook.setShowDetectionResults}
              showRegionOverlay={showRegionOverlay}
              setShowRegionOverlay={setShowRegionOverlay}
              overlayMode={overlayMode}
              setOverlayMode={setOverlayMode}
              fillOpacity={fillOpacity}
              setFillOpacity={setFillOpacity}
              regions={regionHook.regions}
              handleClassToggle={detectionHook.handleClassToggle}
            />
          )}

          {activeNavItem === 'Region Mapper' && (
            <RegionMapper
              staticImage={regionHook.staticImage}
              regions={regionHook.regions}
              currentRegion={regionHook.currentRegion}
              isAddingRegion={regionHook.isAddingRegion}
              isDragging={regionHook.isDragging}
              dragRegionId={regionHook.dragRegionId}
              dragPointIndex={regionHook.dragPointIndex}
              captureStaticImage={regionHook.captureStaticImage}
              startAddingRegion={regionHook.startAddingRegion}
              cancelAddingRegion={regionHook.cancelAddingRegion}
              clearAllRegions={regionHook.clearAllRegions}
              deleteRegion={regionHook.deleteRegion}
              updateRegionName={regionHook.updateRegionName}
              handleImageClick={regionHook.handleImageClick}
              handleMouseMove={regionHook.handleMouseMove}
              handleMouseUp={regionHook.handleMouseUp}
              handleMouseDown={regionHook.handleMouseDown}
            />
          )}

          {activeNavItem === 'Region Monitor' && (
            <RegionMonitor
              regions={regionHook.regions}
              detectionResult={detectionHook.detectionResult}
              capturedImages={monitorHook.capturedImages}
              triggerSettings={monitorHook.triggerSettings}
              isMonitoring={monitorHook.isMonitoring}
              setIsMonitoring={monitorHook.setIsMonitoring}
              selectedRegionId={monitorHook.selectedRegionId}
              setSelectedRegionId={monitorHook.setSelectedRegionId}
              viewMode={monitorHook.viewMode}
              setViewMode={monitorHook.setViewMode}
              updateTriggerSetting={monitorHook.updateTriggerSetting}
              deleteImage={monitorHook.deleteImage}
              deleteRegionImages={monitorHook.deleteRegionImages}
              deleteAllImages={monitorHook.deleteAllImages}
              getRegionImages={monitorHook.getRegionImages}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black-200 text-gray-400 text-xs px-2 flex justify-between items-center border-t border-gray-700 h-8 shrink-0">
        <div className="text-left">Last updated: {new Date().toISOString().slice(0, 10)}</div>
        <div className="text-right">Copyright © Hsing-Yu Huang. All rights reserved.</div>
      </footer>
    </main>
  )
}
