import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react()
    ],
    define: {
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
      'process.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY),
      'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'process.env.STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.STRIPE_PUBLISHABLE_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/stores': path.resolve(__dirname, './src/stores'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
      }
    },
    server: {
      host: '0.0.0.0',
      port: 12000,
      cors: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'work-1-zfhgrxxtqcbohyzp.prod-runtime.all-hands.dev',
        'work-2-zfhgrxxtqcbohyzp.prod-runtime.all-hands.dev',
        '.prod-runtime.all-hands.dev'
      ],
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // Fixed CSP for Monaco editor with local workers
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net data: blob:; style-src 'self' 'unsafe-inline' https: data:; font-src 'self' https: data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:;",
      }
    },
    preview: {
      host: '0.0.0.0',
      port: 12000,
      cors: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // Fixed CSP for Monaco editor with local workers
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net data: blob:; style-src 'self' 'unsafe-inline' https: data:; font-src 'self' https: data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:;",
      }
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'monaco': ['monaco-editor', '@monaco-editor/react'],
            'ai-models': ['openai', '@anthropic-ai/sdk', '@google/generative-ai'],
            'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
            'utils': ['lodash-es', 'date-fns', 'uuid', 'fuse.js'],
            'webcontainer': ['@webcontainer/api'],
            'terminal': ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links', '@xterm/addon-search']
          }
        }
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'monaco-editor',
        '@monaco-editor/react',
        '@xterm/xterm',
        '@xterm/addon-fit',
        '@xterm/addon-web-links',
        '@xterm/addon-search',
        'socket.io-client',
        'zustand',
        '@webcontainer/api'
      ],
      force: true
    },
    worker: {
      format: 'es'
    }
  }
})
