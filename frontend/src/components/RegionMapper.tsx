'use client'

import React from 'react'
import { Region, Point } from '@/types'

interface RegionMapperProps {
  staticImage: string | null
  regions: Region[]
  currentRegion: Point[]
  isAddingRegion: boolean
  isDragging: boolean
  dragRegionId: number | null
  dragPointIndex: number | null
  captureStaticImage: () => void
  startAddingRegion: () => void
  cancelAddingRegion: () => void
  clearAllRegions: () => void
  deleteRegion: (regionId: number) => void
  updateRegionName: (regionId: number, newName: string) => void
  handleImageClick: (event: React.MouseEvent<HTMLDivElement>) => void
  handleMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void
  handleMouseUp: () => void
  handleMouseDown: (event: React.MouseEvent<SVGCircleElement>, regionId: number, pointIndex: number) => void
}

export default function RegionMapper({
  staticImage,
  regions,
  currentRegion,
  isAddingRegion,
  isDragging,
  dragRegionId,
  dragPointIndex,
  captureStaticImage,
  startAddingRegion,
  cancelAddingRegion,
  clearAllRegions,
  deleteRegion,
  updateRegionName,
  handleImageClick,
  handleMouseMove,
  handleMouseUp,
  handleMouseDown
}: RegionMapperProps) {
  return (
    <div className="w-full flex justify-center px-4">
      {/* Region Mapper Panel */}
      <div className="flex flex-col xl:flex-row gap-6 max-w-full w-full xl:w-auto">
        {/* Static Image Area */}
        <section className="w-full xl:w-[1050px] h-[400px] sm:h-[500px] xl:h-[580px] bg-black rounded-xl overflow-hidden border border-[#333] relative flex-shrink-0 max-w-[1050px] mx-auto xl:mx-0">
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
        <div className="w-full xl:w-80 xl:min-w-[320px] xl:max-w-[400px] h-auto xl:h-[540px] flex flex-col gap-4 flex-shrink-0">
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
          <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] flex-grow flex flex-col min-h-0 xl:min-h-[300px] h-auto xl:h-auto">
            <h2 className="text-lg font-semibold text-[#00ffff] mb-4 text-center">Regions</h2>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] xl:max-h-none">
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
  )
}
