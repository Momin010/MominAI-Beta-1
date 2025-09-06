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
      }
    },
    preview: {
      host: '0.0.0.0',
      port: 12000,
      cors: true
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
            'utils': ['lodash-es', 'date-fns', 'uuid', 'fuse.js']
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
        'xterm',
        '@xterm/addon-fit',
        'socket.io-client',
        'zustand'
      ],
      exclude: ['@webcontainer/api']
    }
  }
})
