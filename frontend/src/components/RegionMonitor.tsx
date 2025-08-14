'use client'

import React, { useState } from 'react'
import { Region, DetectionItem, CapturedImage, RegionTriggerSettings } from '@/types'
import { classOptions } from '@/constants'
import { ScreenshotService } from '@/utils/screenshotService'

interface RegionMonitorProps {
  regions: Region[]
  detectionResult: DetectionItem[]
  capturedImages: CapturedImage[]
  triggerSettings: RegionTriggerSettings[]
  isMonitoring: boolean
  setIsMonitoring: (value: boolean) => void
  selectedRegionId: number | null
  setSelectedRegionId: (id: number | null) => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  updateTriggerSetting: (regionId: number, updates: Partial<RegionTriggerSettings>) => void
  deleteImage: (imageId: string) => void
  deleteRegionImages: (regionId: number) => void
  deleteAllImages: () => void
  getRegionImages: (regionId: number) => CapturedImage[]
}

export default function RegionMonitor({
  regions,
  detectionResult,
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
}: RegionMonitorProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'gallery'>('overview')

  const selectedRegion = regions.find(r => r.id === selectedRegionId)
  const selectedRegionImages = selectedRegionId ? getRegionImages(selectedRegionId) : []
  const totalImages = capturedImages.length
  const screenshotService = ScreenshotService.getInstance()

  const handleDownloadImage = (image: CapturedImage) => {
    screenshotService.downloadImage(image.imageData, image.filename)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Monitoring Status */}
      <section className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#00ffff]">Monitoring Status</h3>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              isMonitoring
                ? 'bg-[#ff4444] text-white hover:bg-[#cc3333]'
                : 'bg-[#00ffff] text-black hover:bg-[#00cccc]'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-[#333] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[#00ffff]">{regions.length}</div>
            <div className="text-sm text-[#888]">Total Regions</div>
          </div>
          <div className="bg-[#333] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[#00ff00]">{triggerSettings.filter(s => s.enabled).length}</div>
            <div className="text-sm text-[#888]">Active Monitors</div>
          </div>
          <div className="bg-[#333] p-4 rounded-lg">
            <div className="text-2xl font-bold text-[#ffff00]">{totalImages}</div>
            <div className="text-sm text-[#888]">Captured Images</div>
          </div>
        </div>
      </section>

      {/* Regions List */}
      <section className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        <h3 className="text-xl font-semibold text-[#00ffff] mb-4">Region Status</h3>
        <div className="space-y-3">
          {regions.length === 0 ? (
            <p className="text-[#888] text-center py-8">No regions defined. Please create regions in Region Mapper first.</p>
          ) : (
            regions.map(region => {
              const setting = triggerSettings.find(s => s.regionId === region.id)
              const imageCount = getRegionImages(region.id).length
              
              return (
                <div
                  key={region.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedRegionId === region.id
                      ? 'bg-[#444] border-[#00ffff]'
                      : 'bg-[#333] border-[#555] hover:bg-[#3a3a3a]'
                  }`}
                  onClick={() => setSelectedRegionId(selectedRegionId === region.id ? null : region.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: region.color }}
                      />
                      <span className="font-semibold">{region.name}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        setting?.enabled ? 'bg-[#00ff00] text-black' : 'bg-[#666] text-white'
                      }`}>
                        {setting?.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-[#888]">{imageCount} images</span>
                      <span className="text-[#888]">{region.points.length} points</span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6 h-full">
      {selectedRegion ? (
        <section className="bg-[#1a1a1a] rounded-xl border border-[#333] flex flex-col h-full">
          <div className="flex items-center gap-3 p-6 pb-4 flex-shrink-0">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: selectedRegion.color }}
            />
            <h3 className="text-xl font-semibold text-[#00ffff]">
              Settings for {selectedRegion.name}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ 
            scrollbarWidth: 'thin', 
            scrollbarColor: '#666 #1a1a1a' 
          }}>
            {(() => {
              const setting = triggerSettings.find(s => s.regionId === selectedRegion.id)
              if (!setting) return null

              return (
                <div className="space-y-6 pr-2">
                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <label className="text-base">Enable Auto-Screenshot</label>
                    <button
                      onClick={() => updateTriggerSetting(selectedRegion.id, { enabled: !setting.enabled })}
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        setting.enabled ? 'bg-[#00ffff]' : 'bg-[#333]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          setting.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Trigger Classes */}
                  <div className="space-y-3">
                    <label className="text-base">Trigger Objects</label>
                    <div className="space-y-2 max-h-64 overflow-y-auto" style={{ 
                      scrollbarWidth: 'thin', 
                      scrollbarColor: '#666 #1a1a1a' 
                    }}>
                      {classOptions.map(classOption => (
                        <label key={classOption.id} className="flex items-center text-sm cursor-pointer hover:bg-[#333] p-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={setting.triggerClasses.includes(classOption.id)}
                            onChange={(e) => {
                              const newTriggerClasses = e.target.checked
                                ? [...setting.triggerClasses, classOption.id]
                                : setting.triggerClasses.filter(id => id !== classOption.id)
                              updateTriggerSetting(selectedRegion.id, { triggerClasses: newTriggerClasses })
                            }}
                            className="mr-3 scale-105"
                          />
                          <span className="text-base mr-2">{classOption.icon}</span>
                          <span>{classOption.display}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-[#888]">
                      {setting.triggerClasses.length === 0 
                        ? 'All object types will trigger screenshot'
                        : `${setting.triggerClasses.length} object type(s) selected`
                      }
                    </p>
                  </div>

                  {/* Max Images */}
                  <div className="space-y-2">
                    <label className="text-base">Max Images: {setting.maxImages}</label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={setting.maxImages}
                      onChange={(e) => updateTriggerSetting(selectedRegion.id, { maxImages: parseInt(e.target.value) })}
                      className="w-full h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-[#888]">
                      <span>10</span>
                      <span>500</span>
                    </div>
                  </div>

                  {/* Delete Region Images */}
                  {getRegionImages(selectedRegion.id).length > 0 && (
                    <div className="pt-4 border-t border-[#333]">
                      <button
                        onClick={() => {
                          if (confirm(`Delete all ${getRegionImages(selectedRegion.id).length} images for ${selectedRegion.name}?`)) {
                            deleteRegionImages(selectedRegion.id)
                          }
                        }}
                        className="w-full px-4 py-2 bg-[#ff4444] text-white rounded-lg hover:bg-[#cc3333] transition-colors"
                      >
                        Delete All Images for This Region
                      </button>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </section>
      ) : (
        <section className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333] h-full flex items-center justify-center">
          <p className="text-[#888] text-center">Select a region from the Overview tab to configure its settings.</p>
        </section>
      )}
    </div>
  )

  const renderGallery = () => (
    <div className="space-y-6">
      {/* Gallery Controls */}
      <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#888]">View Mode:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-[#00ffff] text-black' : 'bg-[#333] text-white hover:bg-[#444]'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === 'list' ? 'bg-[#00ffff] text-black' : 'bg-[#333] text-white hover:bg-[#444]'
                }`}
              >
                List
              </button>
            </div>
          </div>
          
          {totalImages > 0 && (
            <button
              onClick={deleteAllImages}
              className="px-4 py-2 bg-[#ff4444] text-white text-sm rounded-lg hover:bg-[#cc3333] transition-colors"
            >
              Delete All Images
            </button>
          )}
        </div>
      </section>

      {/* Images Display */}
      <section className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]">
        {capturedImages.length === 0 ? (
          <p className="text-[#888] text-center py-8">No images captured yet. Enable monitoring and configure region settings to start capturing.</p>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-4'}>
            {capturedImages
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(image => (
                <div
                  key={image.id}
                  className={`border border-[#555] rounded-lg overflow-hidden hover:border-[#00ffff] transition-colors ${
                    viewMode === 'list' ? 'flex gap-4' : ''
                  }`}
                >
                  <div className={viewMode === 'list' ? 'w-32 h-24 flex-shrink-0' : 'aspect-video'}>
                    <img
                      src={image.imageData}
                      alt={`Captured from ${image.regionName}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className={`p-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-[#00ffff]">{image.regionName}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownloadImage(image)}
                          className="text-[#00ffff] hover:text-[#00cccc] text-xs"
                          title="Download"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => deleteImage(image.id)}
                          className="text-[#ff4444] hover:text-[#ff6666] text-xs"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-[#888] space-y-1">
                      <div>{new Date(image.timestamp).toLocaleString()}</div>
                      <div>{image.detectedObjects.length} objects detected</div>
                      {image.hasBbox && <div className="text-[#00ff00]">✓ With bounding boxes</div>}
                    </div>
                    
                    {image.detectedObjects.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {image.detectedObjects.map((obj, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-[#333] text-xs rounded"
                          >
                            {obj.label} ({(obj.confidence * 100).toFixed(1)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  )

  return (
    <div className="w-full flex justify-center">
      <div className="w-[1400px] h-[540px] flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          {/* Tab Navigation */}
          <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333]">
            <div className="space-y-2">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'settings', name: 'Settings', icon: '⚙️' },
                { id: 'gallery', name: 'Gallery', icon: '🖼️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-[#00ffff] text-black font-semibold'
                      : 'text-[#ccc] hover:bg-[#333] hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="text-sm">{tab.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Quick Stats */}
          <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] flex-1">
            <h3 className="text-lg font-semibold text-[#00ffff] mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#888]">Status:</span>
                <span className={isMonitoring ? 'text-[#00ff00]' : 'text-[#ff4444]'}>
                  {isMonitoring ? 'Monitoring' : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Total Regions:</span>
                <span>{regions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Active Monitors:</span>
                <span>{triggerSettings.filter(s => s.enabled).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Images Captured:</span>
                <span>{totalImages}</span>
              </div>
              {selectedRegionId && (
                <div className="flex justify-between border-t border-[#333] pt-2 mt-2">
                  <span className="text-[#888]">Selected Region:</span>
                  <span className="text-[#00ffff]">{selectedRegionImages.length}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'gallery' && renderGallery()}
        </div>
      </div>
    </div>
  )
}
