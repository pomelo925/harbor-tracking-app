'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { handleImageChange } from '@/utils/handleImageChange'
import React from 'react'

type DetectionItem = {
  label: string
  confidence: number
}

type Point = {
  x: number
  y: number
}

type Region = {
  id: number
  name: string
  points: Point[]
  completed: boolean
  color: string
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0.5)
  const [maxDetections, setMaxDetections] = useState(100)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [log, setLog] = useState('')
  const [detectionResult, setDetectionResult] = useState<DetectionItem[]>([])
  const [activeNavItem, setActiveNavItem] = useState('Live Stream')
  
  // Detection display settings
  const [showDetectionResults, setShowDetectionResults] = useState(true)
  
  // Region Mapper states
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
  
  // Region overlay settings
  const [showRegionOverlay, setShowRegionOverlay] = useState(true)
  const [overlayMode, setOverlayMode] = useState<'edges' | 'fill' | 'both'>('both')
  const [fillOpacity, setFillOpacity] = useState(0.2)
  
  // Color palette for regions
  const regionColors = [
    '#00ffff', // Cyan
    '#ff6600', // Orange
    '#00ff00', // Green
    '#ff00ff', // Magenta
    '#ffff00', // Yellow
    '#ff0000', // Red
    '#0066ff', // Blue
    '#66ff00', // Lime
    '#ff0066', // Pink
    '#6600ff'  // Purple
  ]

  // Class mapping for your model
  const classOptions = [
    { id: 0, name: 'human', display: 'Human', icon: '👤' },
    { id: 1, name: 'vehicle', display: 'Vehicle', icon: '🚗' },
    { id: 2, name: 'vessel', display: 'Vessel', icon: '🚢' },
    { id: 3, name: 'mooring-rope', display: 'Mooring-Ropes', icon: '⚓' },
    { id: 4, name: 'bollard', display: 'Bollard', icon: '🪨' }
  ]

  // Navigation items
  const navItems = [
    { id: 'live-stream', name: 'Live Stream', icon: '📹' },
    { id: 'region-mapper', name: 'Region Mapper', icon: '🗺️' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ]

  const handleClassToggle = (classId: number) => {
    setSelectedClasses(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  // Region Mapper functions
  const captureStaticImage = () => {
    // In a real implementation, this would capture the current frame from the live stream
    setStaticImage("http://localhost:8000/video_feed")
  }

  const startAddingRegion = () => {
    // Capture current live stream frame before starting to add region
    captureStaticImage()
    setIsAddingRegion(true)
    setCurrentRegion([])
  }

  const cancelAddingRegion = () => {
    setIsAddingRegion(false)
    setCurrentRegion([])
  }

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Don't add points if we're dragging or not in adding mode
    if (!isAddingRegion || isDragging) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const newPoint = { x, y }
    
    // Check if clicking near the first point to complete the region
    if (currentRegion.length > 2) {
      const firstPoint = currentRegion[0]
      const distance = Math.sqrt((x - firstPoint.x) ** 2 + (y - firstPoint.y) ** 2)
      
      if (distance < 20) { // Within 20px of first point
        completeRegion()
        return
      }
    }
    
    setCurrentRegion(prev => [...prev, newPoint])
  }

  const completeRegion = () => {
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
  }

  const deleteRegion = (regionId: number) => {
    setRegions(prev => prev.filter(region => region.id !== regionId))
    if (selectedRegionId === regionId) {
      setSelectedRegionId(null)
    }
  }

  const updateRegionName = (regionId: number, newName: string) => {
    setRegions(prev => prev.map(region => 
      region.id === regionId ? { ...region, name: newName } : region
    ))
  }

  // Dragging functions
  const handleMouseDown = (event: React.MouseEvent<SVGCircleElement>, regionId: number, pointIndex: number) => {
    event.stopPropagation()
    setIsDragging(true)
    setDragRegionId(regionId)
    setDragPointIndex(pointIndex)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
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
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragRegionId(null)
    setDragPointIndex(null)
  }

  // Check if a point is near the cursor
  const isPointNearCursor = (point: Point, cursorX: number, cursorY: number, threshold = 15) => {
    const distance = Math.sqrt((point.x - cursorX) ** 2 + (point.y - cursorY) ** 2)
    return distance <= threshold
  }

  // Clear all regions function
  const clearAllRegions = () => {
    if (regions.length > 0 && confirm("Are you sure you want to clear all regions?")) {
      setRegions([])
      setRegionCounter(1)
      cancelAddingRegion()
      localStorage.removeItem('harborTrackingRegions')
    }
  }

  // Effect to capture static image when entering Region Mapper
  useEffect(() => {
    if (activeNavItem === 'Region Mapper' && !staticImage) {
      captureStaticImage()
    }
  }, [activeNavItem, staticImage])

  // Effect to cancel current region when switching pages
  useEffect(() => {
    if (activeNavItem !== 'Region Mapper') {
      cancelAddingRegion()
    }
  }, [activeNavItem])

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

// Fetch detection results every second
useEffect(() => {
  const interval = setInterval(() => {
    fetch("http://localhost:8000/predict/stream")
      .then((res) => res.json())
      .then((data) => {
        setDetectionResult(data.results || [])
        setLog(JSON.stringify(data.results, null, 2))
      })
      .catch((err) => {
        setLog("Error fetching prediction: " + err.message)
      })
  }, 1000)
  
  return () => clearInterval(interval)
}, [])

// Handle image change
  return (
    <main className="font-sans flex flex-col h-screen bg-[#1f2544] text-[#fefefe] overflow-hidden">
      {/* Header */}
      <header className="flex justify-center items-center shrink-0 h-14 bg-[#1a1a1a] border-b border-[#333]">
        <h1 className="text-xl font-medium text-[#ffffff] tracking-wide">NCHC Harbor Tracking App</h1>
      </header>

      <div className="flex h-screen bg-black items-center justify-center">
        {/* Fixed Navbar */}
        <aside className="fixed left-8 top-1/2 transform -translate-y-1/2 w-56 h-[540px] bg-[#1a1a1a] rounded-xl border border-[#333] flex flex-col z-10">
          <h2 className="text-lg font-semibold text-[#00ffff] p-4 text-center border-b border-[#333]">
            Menu
          </h2>
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveNavItem(item.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                      activeNavItem === item.name
                        ? 'bg-[#00ffff] text-black font-semibold'
                        : 'text-[#ccc] hover:bg-[#333] hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Body with left margin for navbar */}
        <div className="flex gap-4 px-4 pb-2 justify-center items-center h-[540px] ml-72 w-full">{/* ml-72 = w-56 + left-8 + gap */}
          {activeNavItem === 'Live Stream' && (
            <>
              {/* Live Stream */}
              <section className="w-[1050px] h-[580px] bg-black rounded-xl overflow-hidden border border-[#333] relative">
                <img
                  src={showDetectionResults 
                    ? `http://localhost:8000/video_feed_with_detection?confidence_threshold=${confidence}&max_det=${maxDetections}&classes=${JSON.stringify(selectedClasses.length > 0 ? selectedClasses : null)}`
                    : "http://localhost:8000/video_feed"
                  }
                  alt="Live Stream"
                  className="object-cover w-full h-full"
                />
                
                {/* Render region overlays on live stream */}
                {showRegionOverlay && regions.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {regions.map((region) => (
                      <g key={region.id}>
                        {(overlayMode === 'fill' || overlayMode === 'both') && (
                          <polygon
                            points={region.points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill={`${region.color}${Math.floor(fillOpacity * 255).toString(16).padStart(2, '0')}`}
                            stroke="none"
                          />
                        )}
                        {(overlayMode === 'edges' || overlayMode === 'both') && (
                          <polygon
                            points={region.points.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={region.color}
                            strokeWidth="2"
                            strokeDasharray="3,3"
                          />
                        )}
                        <text
                          x={region.points[0]?.x}
                          y={region.points[0]?.y - 5}
                          fill={region.color}
                          fontSize="10"
                          fontWeight="bold"
                          opacity="0.9"
                        >
                          {region.name}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </section>

              {/* Center - Detected Classes and Output Log */}
              <div className="flex flex-col gap-4 w-80 h-[540px] order-1">
                {/* Detected Classes */}
                <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] h-55 flex flex-col">
                  <h2 className="text-lg font-semibold text-[#00ffff] mb-4 text-center">
                    Detected Classes
                  </h2>
                  <div className="text-sm grid grid-cols-2 gap-y-2 mx-auto w-fit">
                    {classOptions.map(({ name, icon, display, id }) => {
                      const count = detectionResult.filter(item => item.label === name).length;
                      const isSelected = selectedClasses.includes(id);
                      const hasFilter = selectedClasses.length > 0;
                      const shouldHighlight = !hasFilter || isSelected;
                      
                      return (
                        <React.Fragment key={name}>
                          <span className={`text-start ${
                            shouldHighlight ? 'text-white' : 'text-[#666]'
                          }`}>
                            {icon} {display}
                          </span>
                          <span className={`text-center font-semibold ${
                            shouldHighlight 
                              ? (count === 0 ? 'text-red-400' : 'text-green-400')
                              : 'text-[#666]'
                          }`}>
                            {count}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </section>

                {/* Output Log */}
                <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] flex-grow flex flex-col min-h-0">
                  <h2 className="text-lg font-semibold text-[#00ffff] mb-2 text-center">Output Log</h2>
                  <div className="bg-[#111111] rounded-md p-3 text-xs text-[#ccc] font-mono overflow-y-scroll w-full min-w-0 flex-grow">
                    <pre className="whitespace-pre-wrap w-full break-words">
                      {log || '[Harbor Tracking App] Initialized: Waiting for image upload...'}
                    </pre>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeNavItem === 'Settings' && (
            <div className="w-full flex justify-center">
              {/* Settings Panel */}
              <div className="w-[800px] h-[540px] flex gap-6">
                {/* Left Section - Bbox Logic */}
                <section className="flex-1 bg-[#1a1a1a] p-6 rounded-xl border border-[#333] overflow-auto flex flex-col">
                  <h2 className="text-xl font-semibold text-[#00ffff] mb-2 text-center">Bbox Logic</h2>
                  <p className="text-sm text-[#aaa] mb-4 text-center">
                    Adjust detection parameters for better accuracy
                  </p>
                  <hr className="border-[#333] mb-6" />
                  
                  {/* Show Detection Results Toggle */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <label className="text-base">Show Detection Results</label>
                      <button
                        onClick={() => setShowDetectionResults(!showDetectionResults)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          showDetectionResults ? 'bg-[#00ffff]' : 'bg-[#333]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            showDetectionResults ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-[#888] mt-2">
                      {showDetectionResults ? 'Displaying bounding boxes on live stream' : 'Showing raw live stream without detection'}
                    </p>
                  </div>
                  
                  {/* Confidence Threshold */}
                  <div className="mb-6">
                    <label className="block mb-3 text-base">Confidence Threshold: {confidence.toFixed(2)}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={confidence}
                      onChange={(e) => setConfidence(parseFloat(e.target.value))}
                      className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"
                      disabled={!showDetectionResults}
                    />
                    <div className="flex justify-between text-xs text-[#888] mt-1">
                      <span>0.00</span>
                      <span>1.00</span>
                    </div>
                  </div>

                  {/* Max Detections */}
                  <div className="mb-6">
                    <label className="block mb-3 text-base">Max Detections: {maxDetections}</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={maxDetections}
                      onChange={(e) => setMaxDetections(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"
                      disabled={!showDetectionResults}
                    />
                    <div className="flex justify-between text-xs text-[#888] mt-1">
                      <span>1</span>
                      <span>100</span>
                    </div>
                  </div>
                </section>

                {/* Right Section - Filtered Classes */}
                <section className="flex-1 bg-[#1a1a1a] p-6 rounded-xl border border-[#333] flex flex-col">
                  <h2 className="text-xl font-semibold text-[#00ffff] mb-2 text-center">Filtered Classes</h2>
                  <p className="text-sm text-[#aaa] mb-4 text-center">
                    Filter specific object types for focused detection
                  </p>
                  <hr className="border-[#333] mb-4" />
                  
                  {/* Class Filter */}
                  <div className="flex-1 flex flex-col">
                    <label className="block mb-3 text-sm">Select classes to detect:</label>
                    <div className="space-y-2 flex-1">
                      {classOptions.map(({ id, display, icon }) => (
                        <label key={id} className={`flex items-center text-sm cursor-pointer hover:bg-[#333] p-2 rounded-lg transition-colors ${!showDetectionResults ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedClasses.includes(id)}
                            onChange={() => handleClassToggle(id)}
                            className="mr-2 scale-105"
                            disabled={!showDetectionResults}
                          />
                          <span className="text-base">{icon}</span>
                          <span className="ml-2">{display}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Status Messages */}
                    <div className="mt-3">
                      {!showDetectionResults && (
                        <p className="text-xs text-[#888] p-2 bg-[#333] rounded">
                          ⚠️ Class filtering is disabled when detection is off
                        </p>
                      )}
                      {showDetectionResults && selectedClasses.length === 0 && (
                        <p className="text-xs text-[#888] p-2 bg-[#333] rounded">
                          ℹ️ All classes will be detected when none are selected
                        </p>
                      )}
                      {showDetectionResults && selectedClasses.length > 0 && (
                        <p className="text-xs text-[#4ade80] p-2 bg-[#1f2937] rounded">
                          ✅ {selectedClasses.length} class{selectedClasses.length > 1 ? 'es' : ''} selected
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Region Overlay Controls */}
                <section className="flex-1 bg-[#1a1a1a] p-6 rounded-xl border border-[#333] flex flex-col">
                  <h2 className="text-xl font-semibold text-[#00ffff] mb-2 text-center">Region Overlay Settings</h2>
                  <p className="text-sm text-[#aaa] mb-4 text-center">
                    Control region overlay display on live stream
                  </p>
                  <hr className="border-[#333] mb-4" />
                  
                  <div className="space-y-4 flex-1">
                    {/* Enable/Disable Overlay */}
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Show Region Overlay</label>
                      <button
                        onClick={() => setShowRegionOverlay(!showRegionOverlay)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          showRegionOverlay ? 'bg-[#00ffff]' : 'bg-[#333]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            showRegionOverlay ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Overlay Mode */}
                    <div className="space-y-2">
                      <label className="text-sm">Display Mode</label>
                      <div className="flex space-x-2">
                        {[
                          { value: 'edges', label: 'Edges Only' },
                          { value: 'fill', label: 'Fill Only' },
                          { value: 'both', label: 'Both' }
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => setOverlayMode(mode.value as 'edges' | 'fill' | 'both')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              overlayMode === mode.value
                                ? 'bg-[#00ffff] text-black'
                                : 'bg-[#333] text-white hover:bg-[#444]'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fill Opacity */}
                    {(overlayMode === 'fill' || overlayMode === 'both') && (
                      <div className="space-y-2">
                        <label className="text-sm">Fill Opacity: {Math.round(fillOpacity * 100)}%</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={fillOpacity}
                          onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                          className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #00ffff 0%, #00ffff ${fillOpacity * 100}%, #333 ${fillOpacity * 100}%, #333 100%)`
                          }}
                        />
                      </div>
                    )}

                    {/* Region Count Info */}
                    <div className="mt-auto">
                      <p className="text-xs text-[#888] p-2 bg-[#333] rounded">
                        📍 {regions.length} region{regions.length !== 1 ? 's' : ''} defined
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeNavItem === 'Region Mapper' && (
            <div className="w-full flex justify-center">
              {/* Region Mapper Panel */}
              <div className="flex gap-6">
                {/* Static Image Area */}
                <section className="w-[1050px] h-[580px] bg-black rounded-xl overflow-hidden border border-[#333] relative">
                  {staticImage ? (
                    <div 
                      className="relative w-full h-full cursor-crosshair"
                      onClick={handleImageClick}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the area
                    >
                      <img
                        src={staticImage}
                        alt="Static Frame for Region Mapping"
                        className="object-cover w-full h-full"
                        style={{ 
                          opacity: isAddingRegion ? 0.5 : 1,
                          transition: 'opacity 0.3s ease'
                        }}
                      />
                      
                      {/* Render completed regions */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {regions.map((region) => (
                          <g key={region.id}>
                            <polygon
                              points={region.points.map(p => `${p.x},${p.y}`).join(' ')}
                              fill={`${region.color}33`}
                              stroke={region.color}
                              strokeWidth="2"
                            />
                            {region.points.map((point, index) => (
                              <circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r={isDragging && dragRegionId === region.id && dragPointIndex === index ? "6" : "4"}
                                fill={region.color}
                                stroke="white"
                                strokeWidth="1"
                                className="pointer-events-auto cursor-move hover:r-6"
                                style={{ 
                                  filter: isDragging && dragRegionId === region.id && dragPointIndex === index 
                                    ? 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' 
                                    : 'none',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseDown={(e) => handleMouseDown(e, region.id, index)}
                              />
                            ))}
                            <text
                              x={region.points[0]?.x}
                              y={region.points[0]?.y - 10}
                              fill={region.color}
                              fontSize="12"
                              fontWeight="bold"
                            >
                              {region.name}
                            </text>
                          </g>
                        ))}
                        
                        {/* Render current region being drawn */}
                        {currentRegion.length > 0 && (
                          <g>
                            {currentRegion.length > 2 && (
                              <polygon
                                points={currentRegion.map(p => `${p.x},${p.y}`).join(' ')}
                                fill="rgba(0, 255, 0, 0.1)"
                                stroke="#00ff00"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                              />
                            )}
                            {currentRegion.map((point, index) => {
                              const isFirst = index === 0
                              const isNearFirst = currentRegion.length > 2 && index === currentRegion.length - 1
                              let color = "#00ff00"
                              
                              if (isFirst && currentRegion.length > 2) {
                                color = "#ff6600" // Orange when can complete
                              }
                              
                              return (
                                <circle
                                  key={index}
                                  cx={point.x}
                                  cy={point.y}
                                  r={isFirst ? "6" : "4"}
                                  fill={color}
                                />
                              )
                            })}
                            {/* Draw lines between points */}
                            {currentRegion.map((point, index) => {
                              if (index === currentRegion.length - 1) return null
                              const nextPoint = currentRegion[index + 1]
                              return (
                                <line
                                  key={index}
                                  x1={point.x}
                                  y1={point.y}
                                  x2={nextPoint.x}
                                  y2={nextPoint.y}
                                  stroke="#00ff00"
                                  strokeWidth="2"
                                />
                              )
                            })}
                          </g>
                        )}
                      </svg>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[#888]">
                      <p>Loading static frame...</p>
                    </div>
                  )}
                </section>

                {/* Tools Panel */}
                <div className="w-96 h-[540px] flex flex-col gap-4">
                  {/* Tools Section */}
                  <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] flex flex-col">
                    <h2 className="text-lg font-semibold text-[#00ffff] mb-4 text-center">Tools</h2>
                    <div className="space-y-3">
                      <button
                        onClick={startAddingRegion}
                        disabled={isAddingRegion}
                        className={`w-full px-4 py-2 rounded-lg transition-colors ${
                          isAddingRegion 
                            ? 'bg-[#666] text-[#888] cursor-not-allowed'
                            : 'bg-[#00ffff] text-black hover:bg-[#00cccc] font-semibold'
                        }`}
                      >
                        {isAddingRegion ? 'Adding Region...' : 'Add Region'}
                      </button>
                      
                      {isAddingRegion && (
                        <button
                          onClick={cancelAddingRegion}
                          className="w-full px-4 py-2 rounded-lg bg-[#ff4444] text-white hover:bg-[#cc3333] font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      
                      <button
                        onClick={captureStaticImage}
                        className="w-full px-4 py-2 rounded-lg bg-[#333] text-[#ccc] hover:bg-[#444] hover:text-white transition-colors"
                      >
                        Refresh Image
                      </button>

                      {/* Clear All Regions Button */}
                      {regions.length > 0 && (
                        <div className="border-t border-[#333] pt-3 mt-3">
                          <button
                            onClick={clearAllRegions}
                            className="w-full px-4 py-2 rounded-lg bg-[#ff6600] text-white hover:bg-[#cc5500] font-semibold transition-colors"
                          >
                            Clear All Regions
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isAddingRegion && (
                      <div className="mt-4 p-3 bg-[#333] rounded text-xs text-[#ccc]">
                        <p>• Click to add points</p>
                        <p>• Minimum 3 points required</p>
                        <p>• Click first point (orange) to complete</p>
                      </div>
                    )}


                  </section>

                  {/* Regions List */}
                  <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] flex-grow flex flex-col min-h-0">
                    <h2 className="text-lg font-semibold text-[#00ffff] mb-4 text-center">Regions</h2>
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {regions.length === 0 ? (
                        <p className="text-[#888] text-sm text-center">No regions created yet</p>
                      ) : (
                        regions.map((region) => (
                          <div 
                            key={region.id} 
                            className={`p-3 rounded-lg transition-all ${
                              dragRegionId === region.id ? 'bg-[#444] border border-[#00ffff]' : 'bg-[#333]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: region.color }}
                                ></div>
                                <input
                                  type="text"
                                  value={region.name}
                                  onChange={(e) => updateRegionName(region.id, e.target.value)}
                                  className="bg-[#111] text-white px-2 py-1 rounded text-sm flex-1"
                                />
                              </div>
                              <button
                                onClick={() => deleteRegion(region.id)}
                                className="px-2 py-1 bg-[#ff4444] text-white rounded text-xs hover:bg-[#cc3333] transition-colors ml-2"
                              >
                                Delete
                              </button>
                            </div>
                            <div className="flex justify-between text-xs text-[#888]">
                              <span>{region.points.length} points</span>
                              {dragRegionId === region.id && (
                                <span className="text-[#00ffff]">• Editing</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </div>
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
