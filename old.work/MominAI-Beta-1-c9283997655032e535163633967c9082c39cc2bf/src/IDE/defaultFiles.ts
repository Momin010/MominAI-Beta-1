
export const files = {
  'package.json': {
    file: {
      contents: `
{
  "name": "vite-react-starter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}`,
    },
  },
  'tailwind.config.js': {
    file: {
      contents: `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
    }
  },
  'postcss.config.js': {
    file: {
      contents: `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`
    }
  },
  'vite.config.js': {
    file: {
      contents: `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
 plugins: [react()],
 server: {
   hmr: false, // Disable hot module replacement to prevent restarts on file changes
 },
});`,
    },
  },
  'index.html': {
    file: {
      contents: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WebContainer App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
    },
  },
  'src': {
    directory: {
        'main.jsx': {
            file: {
                contents: `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
            }
        },
      'App.jsx': {
        file: {
          contents: `
import React, { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center text-center bg-gray-900 text-white p-4">
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Hello from WebContainer!
        </h1>
        <p className="text-gray-400">Your lightning-fast development environment is ready.</p>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-lg shadow-lg">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Count is {count}
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Edit <code className="bg-gray-700 p-1 rounded font-mono">src/App.jsx</code> and save to see HMR in action.
          </p>
        </div>
      </div>
    </main>
  )
}

export default App
`,
        },
      },
      'index.css': {
        file: {
            contents: `
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  background-color: #111827; /* A nice dark gray */
  color: #f3f4f6; /* A light gray for text */
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`
        }
      }
    },
  },
};
