'use client'

import React from 'react'
import { DetectionItem, Region } from '@/types'
import { classOptions } from '@/constants'

interface LiveStreamProps {
  confidence: number
  maxDetections: number
  selectedClasses: number[]
  showDetectionResults: boolean
  showRegionOverlay: boolean
  overlayMode: 'edges' | 'fill' | 'both'
  fillOpacity: number
  regions: Region[]
  detectionResult: DetectionItem[]
  log: string
}

export default function LiveStream({
  confidence,
  maxDetections,
  selectedClasses,
  showDetectionResults,
  showRegionOverlay,
  overlayMode,
  fillOpacity,
  regions,
  detectionResult,
  log
}: LiveStreamProps) {
  return (
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
  )
}
