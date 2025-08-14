import { DetectionItem, Region, Point } from '@/types'

export class ScreenshotService {
  private static instance: ScreenshotService
  
  static getInstance(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService()
    }
    return ScreenshotService.instance
  }

  // Check if a point is inside a polygon (region)
  isPointInRegion(point: Point, region: Region): boolean {
    const { x, y } = point
    const points = region.points
    let inside = false

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x
      const yi = points[i].y
      const xj = points[j].x
      const yj = points[j].y

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }

    return inside
  }

  // Get the center point of a region
  getRegionCenter(region: Region): Point {
    return {
      x: region.points.reduce((sum, p) => sum + p.x, 0) / region.points.length,
      y: region.points.reduce((sum, p) => sum + p.y, 0) / region.points.length
    }
  }

  // Simulate object detection within regions
  // In a real implementation, this would use actual bounding box coordinates
  getObjectsInRegion(region: Region, detectionResult: DetectionItem[]): DetectionItem[] {
    // For demo purposes, we'll assume objects are randomly distributed
    // In production, you'd have actual bounding box coordinates to check
    const regionCenter = this.getRegionCenter(region)
    
    // Simulate some objects being in the region
    return detectionResult.filter(() => Math.random() > 0.5) // 50% chance object is in region
  }

  // Capture screenshot with optional bounding boxes
  async captureScreenshot(
    includeBbox: boolean = false,
    detectedObjects: DetectionItem[] = [],
    region?: Region
  ): Promise<string> {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Try to find existing live stream image element first
      let streamImg = document.querySelector('img[alt="Live Stream"]') as HTMLImageElement
      
      // Fallback selectors if the main one doesn't work
      if (!streamImg) {
        streamImg = document.querySelector('img[src*="video_feed"]') as HTMLImageElement
      }
      if (!streamImg) {
        streamImg = document.querySelector('img[src*="localhost:8000"]') as HTMLImageElement
      }
      if (!streamImg) {
        // Look for any img element in the stream container
        streamImg = document.querySelector('section img') as HTMLImageElement
      }

      // If no existing image found, create one from the stream URL
      if (!streamImg) {
        console.log('No existing stream image found, creating one from URL')
        
        // Create a new image element from the stream URL
        const tempImg = new Image()
        tempImg.crossOrigin = 'anonymous'
        
        return new Promise((resolve, reject) => {
          tempImg.onload = () => {
            try {
              // Set canvas dimensions
              canvas.width = tempImg.naturalWidth || tempImg.width || 1920
              canvas.height = tempImg.naturalHeight || tempImg.height || 1080

              // Draw the image
              ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height)

              // No region outline or bounding boxes - clean screenshot only
              resolve(canvas.toDataURL('image/png'))
            } catch (error) {
              reject(error)
            }
          }

          tempImg.onerror = () => {
            reject(new Error('Failed to load stream image from URL'))
          }

          // Use the video feed URL
          tempImg.src = 'http://localhost:8000/video_feed'
        })
      }

      // If we found an existing image, use the original logic
      // Set canvas dimensions
      canvas.width = streamImg.naturalWidth || streamImg.width || 1920
      canvas.height = streamImg.naturalHeight || streamImg.height || 1080

      // Create a new image to ensure it's fully loaded
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Draw the original image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            // No region outline or bounding boxes - clean screenshot only
            // Convert canvas to base64
            const dataURL = canvas.toDataURL('image/png', 0.9)
            resolve(dataURL)
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }
        
        // Set the image source to trigger loading
        img.src = streamImg.src
      })
    } catch (error) {
      console.error('Screenshot capture failed:', error)
      throw error
    }
  }

  // Download image as file
  downloadImage(dataURL: string, filename: string): void {
    const link = document.createElement('a')
    link.download = filename
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Convert data URL to blob for storage
  dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)![1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new Blob([u8arr], { type: mime })
  }

  // Get image size from data URL
  getImageDimensions(dataURL: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = reject
      img.src = dataURL
    })
  }
}
