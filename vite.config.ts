import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import Sitemap from 'vite-plugin-sitemap';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    publicDir: isLib ? false : 'public',

    plugins: [
      react(),
      tailwindcss(),
      isLib && dts({ 
        insertTypesEntry: true, 
        include: ['src/lib'],
        rollupTypes: true, 
      }),
      !isLib && Sitemap({ 
        hostname: 'https://z-proximity-engine.vercel.app',
        dynamicRoutes: ['/'] 
      })
    ].filter(Boolean),

    esbuild: {
      drop: isLib ? ['console', 'debugger'] : [],
      legalComments: 'none', 
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      minify: 'esbuild',
      chunkSizeWarningLimit: 500,

      ...(isLib ? {
        lib: {
          entry: resolve(__dirname, 'src/lib/index.ts'),
          name: 'ZProximityEngine',
        },
        rollupOptions: {
          external: [
            'react', 
            'react-dom', 
            'react/jsx-runtime', 
            '@gsap/react', 
            /^gsap(\/.*)?$/
          ],
          output: [
            {
              format: 'es',
              exports: 'named',
              preserveModules: true,            
              preserveModulesRoot: 'src/lib',  
              entryFileNames: '[name].es.js',  
            },
            {
              format: 'umd',
              name: 'ZProximityEngine',
              exports: 'named',
              entryFileNames: 'index.umd.js',
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'react/jsx-runtime': 'jsxRuntime',
                gsap: 'gsap',
                'gsap/ScrollTrigger': 'ScrollTrigger',
                '@gsap/react': 'gsapReact'
              },
            }
          ],
        },
      } : {
        cssCodeSplit: true,
      })
    },
  };
});