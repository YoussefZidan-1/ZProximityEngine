import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // If we run 'vite build --mode lib', this will be true
  const isLib = mode === 'lib';

  return {
    plugins: [
      react(),
      // Only generate .d.ts files when building the library
      isLib && dts({ 
        insertTypesEntry: true, 
        include: ['src/lib'],
        copyDtsFiles: true 
      })
    ].filter(Boolean),

    // Use 'public' folder for the website, but hide it for the library
    publicDir: isLib ? false : 'public',

    build: isLib ? {
      // --- LIBRARY CONFIG ---
      outDir: 'dist',
      lib: {
        entry: resolve(__dirname, 'src/lib/index.ts'),
        name: 'ZProximityEngine',
        formats: ['es', 'umd'],
        fileName: (format) => `index.${format}.js`,
      },
      rollupOptions: {
        // Don't bundle React or GSAP into the library
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
      // --- WEBSITE CONFIG (For Vercel/Playground) ---
      outDir: 'dist-demo', // Build the website into a different folder to avoid confusion
    },
  };
});