import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Get repository name from environment variable (set by GitHub Actions)
// Format: owner/repo-name -> repo-name
const getBasePath = () => {
  if (process.env.GITHUB_PAGES === 'true' && process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
    return `/${repoName}/`
  }
  // Default to root for local development
  return '/'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: getBasePath(),
})
