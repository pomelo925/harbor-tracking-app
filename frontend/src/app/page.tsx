'use client'

import Image from 'next/image'
import { useState } from 'react'
import { handleImageChange } from '@/utils/handleImageChange'
import React from 'react'

type DetectionItem = {
  label: string
  confidence: number
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0.5)
  const [maxDetections, setMaxDetections] = useState(100)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [log, setLog] = useState('')
  const [detectionResult, setDetectionResult] = useState<DetectionItem[]>([])

  // Class mapping for your model
  const classOptions = [
    { id: 0, name: 'human', display: 'Human', icon: '👤' },
    { id: 1, name: 'vehicle', display: 'Vehicle', icon: '🚗' },
    { id: 2, name: 'vessel', display: 'Vessel', icon: '🚢' },
    { id: 3, name: 'mooring-rope', display: 'Mooring-Ropes', icon: '⚓' },
    { id: 4, name: 'bollard', display: 'Bollard', icon: '🪨' }
  ]

  const handleClassToggle = (classId: number) => {
    setSelectedClasses(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  return (
    <main className="font-sans flex flex-col h-screen bg-[#0f0f0f] text-[#fefefe] overflow-hidden pt-6">
      {/* Header */}
      <header className="flex justify-center items-center shrink-0">
        <Image src="/logo.svg" alt="Logo" width={100} height={100} />
        <h1 className="text-4xl font-bold text-[#ff0eff] ml-6 mr-6">Harbor Tracking App</h1>
        <Image src="/logo.svg" alt="Logo" width={100} height={100} />
      </header>

      <div className="flex justify-center items-center h-screen bg-black">
        {/* Body */}
        <div className="flex gap-4 px-4 pb-2 justify-center items-start h-[540px]">
          {/* Upload */}
          <section className="w-[540px] h-[540px] flex justify-center items-center bg-[#1a1a1a] rounded-xl border border-[#333] order-0">
            <label
              htmlFor="image-upload"
              className="w-[540px] h-[540px] bg-[#1a1a1a] border-1 border-dashed border-[#333] rounded-2xl flex justify-center items-center cursor-pointer overflow-hidden"
            >
              {previewURL ? (
                <Image
                  src={previewURL}
                  alt="Uploaded"
                  width={540}
                  height={540}
                  className="object-cover"
                />
              ) : (
                <span className="text-[#777] text-center px-4">Click or drag to upload an image</span>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageChange(
                    e,
                    setPreviewURL,
                    setSelectedImage,
                    setLog,
                    setDetectionResult,
                    {
                      confidence_threshold: confidence,
                      classes: selectedClasses.length > 0 ? selectedClasses : undefined,
                      max_det: maxDetections
                    }
                  )
                }
                className="hidden"
              />
            </label>
          </section>

          {/* Center */}
          <div className="flex flex-col gap-4 w-1/3 h-[540px] order-1">
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
                <pre className="whitespace-pre-wrap w-full">
                  {log || '[Harbor Tracking App] Initialized: Waiting for image upload...'}
                </pre>
              </div>
            </section>
          </div>

          {/* Settings */}
          <section className="w-1/5 h-[540px] bg-[#1a1a1a] p-4 rounded-xl border border-[#333] overflow-auto flex flex-col order-2">
            <h2 className="text-lg font-semibold text-[#00ffff] mb-4 text-center">Settings</h2>
            
            {/* Confidence Threshold */}
            <div className="mb-4">
              <label className="block mb-2">Confidence Threshold: {confidence.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Max Detections */}
            <div className="mb-4">
              <label className="block mb-2">Max Detections: {maxDetections}</label>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={maxDetections}
                onChange={(e) => setMaxDetections(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Class Filter */}
            <div className="mb-4">
              <label className="block mb-2 text-sm">Filter Classes:</label>
              <div className="space-y-1">
                {classOptions.map(({ id, display, icon }) => (
                  <label key={id} className="flex items-center text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(id)}
                      onChange={() => handleClassToggle(id)}
                      className="mr-2 scale-75"
                    />
                    <span>{icon} {display}</span>
                  </label>
                ))}
              </div>
              {selectedClasses.length === 0 && (
                <p className="text-xs text-[#888] mt-1">All classes will be detected</p>
              )}
            </div>

            <p className="text-sm text-[#aaa] mt-auto">Advanced YOLO settings enabled</p>
          </section>
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