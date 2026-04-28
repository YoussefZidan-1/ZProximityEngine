import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [
      react(),
      isLib && dts({ 
        insertTypesEntry: true, 
        include: ['src/lib']
      })
    ].filter(Boolean),

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      ...(isLib ? {
        // --- LIBRARY CONFIG ---
        lib: {
          entry: resolve(__dirname, 'src/lib/index.ts'),
          name: 'ZProximityEngine',
          formats: ['es', 'umd'],
          fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'gsap', '@gsap/react'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              gsap: 'gsap',
              '@gsap/react': 'gsapReact'
            },
          },
        },
      } : {
      })
    },
  };
});