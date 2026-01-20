# React + Vite Template

A modern, production-ready template for React applications with TypeScript, Tailwind CSS v4, DaisyUI, and comprehensive testing setup.

## Features

- ⚡ **Vite** - Lightning-fast build tool and dev server
- ⚛️ **React 19** - Latest React with all modern features
- 🎨 **Tailwind CSS v4** - Utility-first CSS framework (configured in CSS)
- 🧩 **DaisyUI** - Beautiful component library built on Tailwind
- 🎭 **TypeScript** - Full type safety with strict mode
- 🧪 **Vitest** - Fast unit testing with React Testing Library
- 📏 **ESLint** - Code linting with TypeScript support
- 🎯 **Lucide React** - Beautiful, customizable icon library
- 🚀 **GitHub Actions** - CI/CD ready for automatic deployment
- 🌙 **Dark Mode** - Theme switching with system preference detection

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn

### Installation

```bash
# Clone or copy this template
git clone <your-repo-url>
cd <your-project>

# Install dependencies
yarn install

# Start development server
yarn dev
```

### Available Scripts

```bash
yarn dev              # Start dev server at http://localhost:5173
yarn build            # Build for production
yarn preview          # Preview production build
yarn lint             # Run ESLint
yarn test             # Run tests in watch mode
yarn test:ui          # Run tests with UI
yarn test:coverage    # Generate coverage report
```

## Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions deployment
├── public/                    # Static assets
├── src/
│   ├── test/
│   │   └── setup.ts          # Vitest setup
│   ├── App.tsx               # Main App component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles + Tailwind config
├── index.html                 # HTML template
├── vite.config.ts            # Vite configuration
├── vitest.config.ts          # Vitest configuration
├── tsconfig.json             # TypeScript base config
├── tsconfig.app.json         # TypeScript app config
├── tsconfig.node.json        # TypeScript node config
└── eslint.config.js          # ESLint configuration
```

## Styling with Tailwind CSS v4

This template uses Tailwind CSS v4, which configures everything in CSS files instead of a separate config file.

### Custom Theme Variables

Edit `src/index.css` to customize your theme:

```css
@theme {
  --color-primary: #yourcolor;
  --text-lg: 20px;
  /* Add your custom design tokens */
}
```

### DaisyUI Components

Use DaisyUI components directly:

```tsx
<button className="btn btn-primary">Click me</button>
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">...</div>
</div>
```

## Testing

Tests are configured with Vitest and React Testing Library.

### Writing Tests

Create test files alongside your components:

```
src/
  components/
    Button.tsx
    Button.test.tsx
```

Example test:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders welcome message', () => {
    render(<App />)
    expect(screen.getByText(/React \+ Vite Template/i)).toBeInTheDocument()
  })
})
```

## Deployment to GitHub Pages

This template includes automatic deployment to GitHub Pages.

### Setup

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Under "Source", select "GitHub Actions"

2. **Update deployment config** in `package.json`:
   - Replace `username/repo-name` in the `build:gh-pages` script with your actual repository

3. **Push to main branch**:
   - The workflow automatically builds and deploys on every push

4. **Access your site**:
   - Your app will be available at `https://username.github.io/repo-name/`

### Manual Deployment

```bash
GITHUB_PAGES=true GITHUB_REPOSITORY=username/repo-name yarn build
```

## Customization

### Update Project Name

1. Edit `package.json` - change `name` field
2. Edit `index.html` - update `<title>`
3. Edit `README.md` - update project description
4. Update `build:gh-pages` script with your repository name

### Add Custom Fonts

1. Add font files to `public/fonts/`
2. Add `@font-face` rules in `src/index.css`
3. Update `body` font-family

### Configure ESLint

Edit `eslint.config.js` to add or modify rules:

```js
rules: {
  'your-rule': 'error',
  // ...
}
```

## Tech Stack

- **React 19** - UI library
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Utility CSS
- **DaisyUI 5** - Component library
- **Vitest 4** - Testing framework
- **Lucide React** - Icons
- **ESLint 9** - Linter

## License

MIT - Feel free to use this template for your projects!

## Contributing

This is a template repository. Fork it and customize it for your needs!

---

**Built with ❤️ using modern web technologies**
