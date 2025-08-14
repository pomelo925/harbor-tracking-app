'use client'

import React from 'react'
import { Region } from '@/types'
import { classOptions } from '@/constants'

interface SettingsProps {
  confidence: number
  setConfidence: (value: number) => void
  maxDetections: number
  setMaxDetections: (value: number) => void
  selectedClasses: number[]
  showDetectionResults: boolean
  setShowDetectionResults: (value: boolean) => void
  showRegionOverlay: boolean
  setShowRegionOverlay: (value: boolean) => void
  overlayMode: 'edges' | 'fill' | 'both'
  setOverlayMode: (value: 'edges' | 'fill' | 'both') => void
  fillOpacity: number
  setFillOpacity: (value: number) => void
  regions: Region[]
  handleClassToggle: (classId: number) => void
}

export default function Settings({
  confidence,
  setConfidence,
  maxDetections,
  setMaxDetections,
  selectedClasses,
  showDetectionResults,
  setShowDetectionResults,
  showRegionOverlay,
  setShowRegionOverlay,
  overlayMode,
  setOverlayMode,
  fillOpacity,
  setFillOpacity,
  regions,
  handleClassToggle
}: SettingsProps) {
  return (
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
  )
}
