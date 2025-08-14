import { ClassOption, NavItem } from '@/types'

// Class mapping for your model
export const classOptions: ClassOption[] = [
  { id: 0, name: 'human', display: 'Human', icon: '👤' },
  { id: 1, name: 'vehicle', display: 'Vehicle', icon: '🚗' },
  { id: 2, name: 'vessel', display: 'Vessel', icon: '🚢' },
  { id: 3, name: 'mooring-rope', display: 'Mooring-Ropes', icon: '⚓' },
  { id: 4, name: 'bollard', display: 'Bollard', icon: '🪨' }
]

// Navigation items
export const navItems: NavItem[] = [
  { id: 'live-stream', name: 'Live Stream', icon: '📹' },
  { id: 'region-mapper', name: 'Region Mapper', icon: '🗺️' },
  { id: 'region-monitor', name: 'Region Monitor', icon: '📸' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]

// Color palette for regions
export const regionColors = [
  '#00ffff', // Cyan
  '#ff6600', // Orange
  '#00ff00', // Green
  '#ff00ff', // Magenta
  '#ffff00', // Yellow
  '#ff0000', // Red
  '#0066ff', // Blue
  '#66ff00', // Lime
  '#ff0066', // Pink
  '#6600ff'  // Purple
]
