import { Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl max-w-2xl w-full">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h1 className="card-title text-3xl">React + Vite Template</h1>
            <button
              onClick={toggleTheme}
              className="btn btn-circle btn-ghost"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            </button>
          </div>
          
          <div className="prose dark:prose-invert">
            <h2>Features</h2>
            <ul>
              <li>⚡ Vite - Lightning fast build tool</li>
              <li>⚛️ React 19 - Latest React features</li>
              <li>🎨 Tailwind CSS v4 - Utility-first CSS</li>
              <li>🧩 DaisyUI - Beautiful component library</li>
              <li>🎭 TypeScript - Type safety</li>
              <li>🧪 Vitest - Fast unit testing</li>
              <li>📏 ESLint - Code linting</li>
              <li>🎯 Lucide React - Icon library</li>
              <li>🚀 GitHub Actions - CI/CD ready</li>
            </ul>
          </div>

          <div className="card-actions justify-end mt-4">
            <a
              href="https://vitejs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
