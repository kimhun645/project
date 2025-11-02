import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  // Fix for esbuild not reading parent tsconfig.json
  // Set root to current directory to prevent reading parent tsconfig
  root: __dirname,
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        skipLibCheck: true,
        baseUrl: __dirname,
        paths: {
          '@/*': ['./src/*']
        }
      }
    }),
  },
  plugins: [
    react({
      // Ensure React is always available
      jsxRuntime: 'automatic',
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Force single React instance - critical fix
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime.js'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimized bundle configuration
    rollupOptions: {
        output: {
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/[name]-[hash].js',
        // Optimized code splitting strategy
        manualChunks: (id) => {
          // Normalize path separators - CRITICAL for Windows paths
          const normalizedId = id.replace(/\\/g, '/');
          
          // Debug: Log all React-related IDs to catch any missed
          // (Uncomment for debugging)
          // if (normalizedId.includes('react') || normalizedId.includes('useLayoutEffect')) {
          //   console.log('React-related ID:', normalizedId);
          // }
          
          // Vendor chunks - CRITICAL: React must be in single chunk
          if (normalizedId.includes('node_modules')) {
            // Check for React FIRST - be very aggressive
            const isReact = 
              normalizedId.includes('/react/') ||
              normalizedId.includes('/react-dom/') ||
              normalizedId.includes('/react/jsx-runtime') ||
              normalizedId.includes('react/index') ||
              normalizedId.includes('react/cjs/') ||
              normalizedId.includes('react/umd/') ||
              normalizedId.endsWith('/react') ||
              normalizedId.endsWith('/react-dom') ||
              normalizedId.endsWith('/react/jsx-runtime') ||
              id === 'react' ||
              id === 'react-dom' ||
              id === 'react/jsx-runtime';
            
            // All React-related packages that MUST use same React instance
            // Be exhaustive - include ALL possible React dependencies
            const isReactRelated = 
              normalizedId.includes('react-router') ||
              normalizedId.includes('react-hook-form') ||
              normalizedId.includes('@hookform') ||
              normalizedId.includes('react-is') ||
              normalizedId.includes('@radix-ui') ||
              normalizedId.includes('recharts') ||
              normalizedId.includes('scheduler') ||
              normalizedId.includes('react-day-picker') ||
              normalizedId.includes('@tanstack/react-query') ||
              normalizedId.includes('@tanstack/react-query-devtools') ||
              normalizedId.includes('use-sync-external-store') ||
              normalizedId.includes('use-subscription') ||
              normalizedId.includes('object-assign') ||
              // Additional React dependencies
              normalizedId.includes('hoist-non-react-statics') ||
              normalizedId.includes('prop-types') ||
              normalizedId.includes('@babel/runtime') ||
              // @radix-ui packages that use useLayoutEffect
              normalizedId.includes('@radix-ui/react-use-layout-effect') ||
              // Ensure no React code in vendor-other - catch all
              (normalizedId.includes('useLayoutEffect') && normalizedId.includes('node_modules')) ||
              (normalizedId.includes('useEffect') && normalizedId.includes('node_modules') && normalizedId.includes('@radix-ui'));
            
            // React and React-related MUST go to vendor-react - NO EXCEPTIONS
            if (isReact || isReactRelated) {
              return 'vendor-react';
            }
            
            // Firebase
            if (normalizedId.includes('firebase')) {
              return 'vendor-firebase';
            }
            
            // UI libraries (non-React)
            if (normalizedId.includes('lucide-react')) {
              return 'vendor-ui';
            }
            
            // Form libraries (zod doesn't use React)
            if (normalizedId.includes('zod')) {
              return 'vendor-forms';
            }
            
            // CRITICAL FIX: Most packages might indirectly reference React
            // Only put truly standalone packages in vendor-other
            const packageName = normalizedId.split('node_modules/')[1]?.split('/')[0] || '';
            
            // Safe packages that definitely don't use React
            const safePackages = [
              'firebase',  // Already handled above
              'express',
              'cors',
              'nodemailer',
              'firebase-admin'
            ];
            
            // If not a safe package, put in vendor-react to be safe
            if (!safePackages.includes(packageName) && packageName) {
              // Better safe than sorry - most packages might reference React indirectly
              return 'vendor-react';
            }
            
            // Only truly standalone server-side packages in vendor-other
            return 'vendor-other';
          }
          // Split large page components
          if (normalizedId.includes('/pages/')) {
            const pageName = normalizedId.split('/pages/')[1]?.split('/')[0];
            if (pageName && ['Products', 'Movements', 'Reports', 'Dashboard'].includes(pageName)) {
              return `page-${pageName.toLowerCase()}`;
            }
          }
          // Default: no chunk (will be in main bundle)
          return undefined;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'fonts/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return 'images/[name]-[hash].[ext]';
          }
          if (ext === 'css') {
            return 'css/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    // Target modern browsers for better optimization
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Minimize CSS
    cssCodeSplit: true,
    // Minimize JS
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    // Asset size warning limit (increased for better chunks)
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies - Force single React instance
  optimizeDeps: {
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'react-hook-form',
      '@hookform/resolvers',
      'react-is',
      'react-day-picker',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'recharts',
      'zod',
      'date-fns',
      'lucide-react',
      'clsx',
      'tailwind-merge'
    ],
    // Force React to be a single instance
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    // Force all React dependencies to use the same instance
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    // Force pre-bundling of all React deps
    force: true,
  },
  // Performance hints
  define: {
    // Enable production optimizations
    __DEV__: process.env.NODE_ENV === 'development',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
})

