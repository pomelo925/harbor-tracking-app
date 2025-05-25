'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0.5)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img: HTMLImageElement = new window.Image()
        img.onload = () => {
          // 建立 640x640 Canvas
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = 640
          canvas.height = 640

          if (ctx) {
            // 將圖片拉伸扭曲繪製到 canvas 上
            ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, 640, 640)
            // 取得新的 base64 URL
            const dataUrl = canvas.toDataURL('image/jpeg')
            setPreviewURL(dataUrl)
            setSelectedImage(file)
          }
        }
        if (typeof event.target?.result === 'string') {
          img.src = event.target.result
        }
      }
      reader.readAsDataURL(file)
    }
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
        {/* Upload: 最左邊 */}
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
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </section>

        {/* Center 區塊 */}
        <div className="flex flex-col gap-4 w-1/3 h-[540px] order-1">
          {/* Detected Classes */}
          <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] overflow-auto">
            <h2 className="text-lg font-semibold text-[#00ffff] mb-4 text-center">Detected Classes</h2>
            <div className="text-sm grid grid-cols-2 gap-y-2 mx-auto w-fit">
              <span className="text-[#aaa] text-start">👤 Human</span>
              <span className="text-center">1</span>
              <span className="text-[#aaa] text-start">🚗 Vehicle</span>
              <span className="text-center">0</span>
              <span className="text-[#aaa] text-start">🚢 Vessel</span>
              <span className="text-center">0</span>
              <span className="text-[#aaa] text-start">⚓ Mooring-Ropes</span>
              <span className="text-center">0</span>
              <span className="text-[#aaa] text-start">🪨 Bollard</span>
              <span className="text-center">0</span>
            </div>
          </section>

          {/* Output Log：flex-grow 自動拉滿底部 */}
          <section className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] flex-grow flex flex-col">
            <h2 className="text-lg font-semibold text-[#00ffff] mb-2 text-center">Output Log</h2>
            <div className="bg-[#111111] rounded-md p-3 text-xs text-[#ccc] font-mono overflow-auto flex-grow">
              <pre>
        {`[2025-05-25 14:32:10] System initialized.\n[2025-05-25 14:32:15] Image loaded successfully.\n[2025-05-25 14:32:20] Processing YOLO detection...\n[2025-05-25 14:32:25] Detected 1 human, 0 vehicles.`}
              </pre>
            </div>
          </section>
        </div>



        {/* Settings 區塊 */}
        <section className="w-1/5 h-[540px] bg-[#1a1a1a] p-4 rounded-xl border border-[#333] overflow-auto flex flex-col order-2">
          <h2 className="text-lg font-semibold text-[#00ffff] mb-4 text-center">Settings</h2>
          <label className="block mb-2">Confidence Threshold: {confidence}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="w-full mb-4"
          />
          <p className="text-sm text-[#aaa] mt-auto">* More YOLO settings coming soon</p>
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