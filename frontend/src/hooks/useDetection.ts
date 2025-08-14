'use client'

import { useState, useEffect } from 'react'
import { DetectionItem } from '@/types'

export function useDetection() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewURL, setPreviewURL] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0.5)
  const [maxDetections, setMaxDetections] = useState(100)
  const [selectedClasses, setSelectedClasses] = useState<number[]>([])
  const [log, setLog] = useState('')
  const [detectionResult, setDetectionResult] = useState<DetectionItem[]>([])
  const [showDetectionResults, setShowDetectionResults] = useState(true)

  const handleClassToggle = (classId: number) => {
    setSelectedClasses(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

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

  return {
    selectedImage,
    setSelectedImage,
    previewURL,
    setPreviewURL,
    confidence,
    setConfidence,
    maxDetections,
    setMaxDetections,
    selectedClasses,
    setSelectedClasses,
    log,
    setLog,
    detectionResult,
    setDetectionResult,
    showDetectionResults,
    setShowDetectionResults,
    handleClassToggle
  }
}
