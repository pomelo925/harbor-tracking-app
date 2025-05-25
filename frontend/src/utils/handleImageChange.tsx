'use client'

import React from 'react'

type DetectionItem = {
  label: string
  confidence: number
}

type YoloSettings = {
  confidence_threshold: number
  classes?: number[]
  max_det: number
}

export const handleImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  setPreviewURL: (url: string) => void,
  setSelectedImage: (file: File) => void,
  setLog: (logUpdater: (prev: string) => string) => void,
  setDetectionResult: (result: DetectionItem[]) => void,
  yoloSettings: YoloSettings
) => {
  const file = e.target.files?.[0]

  if (!file) {
    setLog(prev => prev + '\n[HandleImageChange] No file selected.')
    return
  }

  // Log file info
  const fileSizeKB = (file.size / 1024).toFixed(2)
  setLog(prev => prev + `\n[HandleImageChange] File selected: ${file.name} (${fileSizeKB} KB)`)

  const reader = new FileReader()

  reader.onload = async (event) => {
    if (!event.target?.result || typeof event.target.result !== 'string') return

    setPreviewURL(event.target.result)  // Show original image
    setSelectedImage(file)

    // Create an Image object to get width and height
    const img = new Image()
    img.onload = () => {
      setLog(prev => prev + `\n[HandleImageChange] Image dimensions: ${img.width}x${img.height} px`)
    }
    img.src = event.target.result

    const formData = new FormData()
    formData.append('file', file)
    
    // Add YOLO settings to form data
    formData.append('confidence_threshold', yoloSettings.confidence_threshold.toString())
    formData.append('max_det', yoloSettings.max_det.toString())
    
    if (yoloSettings.classes && yoloSettings.classes.length > 0) {
      formData.append('classes', JSON.stringify(yoloSettings.classes))
    }

    try {
      setLog(prev => prev + '\n[Client] Uploading image...')
      setLog(prev => prev + `\n[Client] Settings: conf=${yoloSettings.confidence_threshold}, max_det=${yoloSettings.max_det}${yoloSettings.classes ? `, classes=${yoloSettings.classes.join(',')}` : ''}`)
      
      const response = await fetch('http://localhost:8000/predict/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const json = await response.json()
      setLog(prev => prev + '\n[Client] Inference completed\n')
      setDetectionResult(json.results)

      // Show image with bounding boxes (Base64)
      setPreviewURL(`data:image/jpeg;base64,${json.image_base64}`)

    } catch (err) {
      setLog(prev => prev + `\n[Client] Inference failed ❌: ${err}\n`)
    }
  }

  reader.readAsDataURL(file)
}