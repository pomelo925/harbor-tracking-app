'use client'

import React from 'react'
import { navItems } from '@/constants'

interface NavigationProps {
  activeNavItem: string
  setActiveNavItem: (item: string) => void
}

export default function Navigation({ activeNavItem, setActiveNavItem }: NavigationProps) {
  return (
    <aside className="fixed left-8 top-1/2 transform -translate-y-1/2 w-56 h-[540px] bg-[#1a1a1a] rounded-xl border border-[#333] flex flex-col z-10">
      <h2 className="text-lg font-semibold text-[#00ffff] p-4 text-center border-b border-[#333]">
        Menu
      </h2>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveNavItem(item.name)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                  activeNavItem === item.name
                    ? 'bg-[#00ffff] text-black font-semibold'
                    : 'text-[#ccc] hover:bg-[#333] hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
