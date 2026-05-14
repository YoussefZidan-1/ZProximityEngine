import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import Sitemap from "vite-plugin-sitemap";

const useClientPlugin = () => ({
  name: "add-use-client-directive",
  renderChunk(code: string, chunk: any) {
    if (chunk.fileName.endsWith(".es.js") && !code.includes("use client")) {
      return '"use client";\n' + code;
    }
    return null;
  },
});

export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  return {
    publicDir: isLib ? false : "public",
    plugins: [
      react(),
      tailwindcss(),
      isLib &&
        dts({
          insertTypesEntry: true,
          include: ["src/lib"],
          rollupTypes: true,
        }),
      isLib && useClientPlugin(),
      !isLib &&
        Sitemap({
          hostname: "https://z-proximity-engine.vercel.app",
          dynamicRoutes: ["/"],
        }),
    ].filter(Boolean),

    esbuild: {
      drop: isLib ? ["console", "debugger"] : [],
      legalComments: "none",
    },

    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_getters: true,
          dead_code: true,
          passes: 3,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_comps: true,
          unsafe_math: true,
          unsafe_methods: true,
          unsafe_proto: true,
          hoist_funs: true,
          hoist_vars: true,
          unsafe_undefined: true,
          inline: 2,
          comparisons: true,
          evaluate: true,
        },
        mangle: {
          toplevel: true,
          safari10: false,
        },
        format: {
          comments: false,
          wrap_iife: true,
        },
      },
      chunkSizeWarningLimit: 500,

      ...(isLib
        ? {
            lib: {
              entry: resolve(__dirname, "src/lib/index.ts"),
              name: "ZProximityEngine",
            },
            rollupOptions: {
              external: [
                "react",
                "react-dom",
                "react/jsx-runtime",
                "@gsap/react",
                /^gsap(\/.*)?$/,
              ],
              treeshake: {
                  moduleSideEffects: false,
                  propertyReadSideEffects: false,
                  tryCatchDeoptimization: false,
                },
              output: [
                {
                  format: "es",
                  exports: "named",
                  preserveModules: true,
                  preserveModulesRoot: "src/lib",
                  entryFileNames: "[name].es.js",
                  compact: true,
                  minifyInternalExports: true
                },
                {
                  format: "umd",
                  name: "ZProximityEngine",
                  exports: "named",
                  entryFileNames: "index.umd.js",
                  compact: true,
                  minifyInternalExports: true,
                  globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                    "react/jsx-runtime": "jsxRuntime",
                    gsap: "gsap",
                    "gsap/ScrollTrigger": "ScrollTrigger",
                    "@gsap/react": "gsapReact",
                  },
                },
              ],
            },
          }
        : {
            cssCodeSplit: true,
          }),
    },
  };
});
