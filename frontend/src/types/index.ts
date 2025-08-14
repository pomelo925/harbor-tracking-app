export type DetectionItem = {
  label: string
  confidence: number
}

export type Point = {
  x: number
  y: number
}

export type Region = {
  id: number
  name: string
  points: Point[]
  completed: boolean
  color: string
}

export type ClassOption = {
  id: number
  name: string
  display: string
  icon: string
}

export type NavItem = {
  id: string
  name: string
  icon: string
}

export type CapturedImage = {
  id: string
  regionId: number
  regionName: string
  timestamp: number
  filename: string
  detectedObjects: DetectionItem[]
  imageData: string // base64 or blob URL
  hasBbox: boolean
}

export type RegionTriggerSettings = {
  regionId: number
  enabled: boolean
  triggerClasses: number[] // which object classes trigger screenshot
  includeBbox: boolean
  maxImages: number
}

export type RegionMonitorState = {
  capturedImages: CapturedImage[]
  triggerSettings: RegionTriggerSettings[]
  isMonitoring: boolean
}
