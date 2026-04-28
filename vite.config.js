import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [
      react(),
      // Only generate types when building the library
      isLib && dts({ insertTypesEntry: true, include: ['src/lib'] })
    ].filter(Boolean),
    
    // In lib mode, don't copy the public folder. In app mode, do copy it.
    publicDir: isLib ? false : 'public',

    build: isLib ? {
      // --- LIBRARY BUILD CONFIG ---
      lib: {
        entry: resolve(__dirname, 'src/lib/index.ts'),
        name: 'ZProximityEngine',
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
      // --- WEBSITE/APP BUILD CONFIG (For Vercel) ---
      outDir: 'dist',
    },
  };
});