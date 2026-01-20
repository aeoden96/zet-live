import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText(/React \+ Vite Template/i)).toBeInTheDocument()
  })

  it('toggles theme when button is clicked', () => {
    render(<App />)
    const themeButton = screen.getByLabelText(/toggle theme/i)
    
    // Initial theme
    const initialTheme = document.documentElement.getAttribute('data-theme')
    
    // Click to toggle
    fireEvent.click(themeButton)
    
    // Theme should have changed
    const newTheme = document.documentElement.getAttribute('data-theme')
    expect(newTheme).not.toBe(initialTheme)
  })

  it('displays all features', () => {
    render(<App />)
    expect(screen.getByText(/Lightning fast build tool/i)).toBeInTheDocument()
    expect(screen.getByText(/React 19/i)).toBeInTheDocument()
    expect(screen.getByText(/Tailwind CSS v4/i)).toBeInTheDocument()
    expect(screen.getByText(/DaisyUI/i)).toBeInTheDocument()
  })
})
