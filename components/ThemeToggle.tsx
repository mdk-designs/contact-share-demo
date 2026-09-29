'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  floating?: boolean
  className?: string
}

export default function ThemeToggle({ floating = false, className = '' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const pref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const activeTheme = (saved as 'light' | 'dark') || pref
    document.documentElement.setAttribute('data-theme', activeTheme)
    document.documentElement.classList.toggle('dark', activeTheme === 'dark')
    setTheme(activeTheme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const next = e.matches ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', next)
        document.documentElement.classList.toggle('dark', next === 'dark')
        setTheme(next)
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    try {
      localStorage.setItem('theme', nextTheme)
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e)
    }
  }

  const wrapClasses = `theme-toggle-wrap ${floating ? 'floating' : ''} ${className}`.trim()

  // Prevent layout jump before mount
  if (!mounted) {
    return (
      <div className={wrapClasses}>
        <button
          className="theme-toggle-btn"
          aria-label="Toggle theme"
          type="button"
          disabled
        >
          <Sun size={17} style={{ opacity: 0 }} />
        </button>
      </div>
    )
  }

  return (
    <div className={wrapClasses}>
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        type="button"
        id="theme-toggle-btn"
      >
        {theme === 'dark' ? (
          <Sun size={17} className="transition-transform duration-200 rotate-0 hover:rotate-45" />
        ) : (
          <Moon size={17} className="transition-transform duration-200 rotate-0 hover:-rotate-12" />
        )}
      </button>
    </div>
  )
}
