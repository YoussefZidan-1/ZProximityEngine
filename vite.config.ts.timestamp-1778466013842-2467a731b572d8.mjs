// vite.config.ts
import tailwindcss from "file:///D:/z/ZProximityEngine/node_modules/@tailwindcss/vite/dist/index.mjs";
import { defineConfig } from "file:///D:/z/ZProximityEngine/node_modules/vite/dist/node/index.js";
import react from "file:///D:/z/ZProximityEngine/node_modules/@vitejs/plugin-react/dist/index.js";
import dts from "file:///D:/z/ZProximityEngine/node_modules/vite-plugin-dts/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "D:\\z\\ZProximityEngine";
var vite_config_default = defineConfig(({ mode }) => {
  const isLib = mode === "lib";
  return {
    publicDir: isLib ? false : "public",
    plugins: [
      react(),
      tailwindcss(),
      isLib && dts({
        insertTypesEntry: true,
        include: ["src/lib"]
      })
    ].filter(Boolean),
    esbuild: {
      drop: isLib ? ["console", "debugger"] : [],
      legalComments: "none"
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: "esbuild",
      chunkSizeWarningLimit: 500,
      ...isLib ? {
        // --- LIBRARY CONFIG ---
        lib: {
          entry: resolve(__vite_injected_original_dirname, "src/lib/index.ts"),
          name: "ZProximityEngine",
          formats: ["es", "umd"],
          fileName: (format) => `index.${format}.js`
        },
        rollupOptions: {
          external: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "@gsap/react",
            /^gsap(\/.*)?$/
          ],
          output: {
            compact: true,
            format: "es",
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
              "react/jsx-runtime": "jsxRuntime",
              gsap: "gsap",
              "gsap/ScrollTrigger": "ScrollTrigger",
              "@gsap/react": "gsapReact"
            }
          }
        }
      } : {}
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx6XFxcXFpQcm94aW1pdHlFbmdpbmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHpcXFxcWlByb3hpbWl0eUVuZ2luZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovei9aUHJveGltaXR5RW5naW5lL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gJ0B0YWlsd2luZGNzcy92aXRlJztcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IGlzTGliID0gbW9kZSA9PT0gJ2xpYic7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwdWJsaWNEaXI6IGlzTGliID8gZmFsc2UgOiAncHVibGljJyxcclxuXHJcbiAgICBwbHVnaW5zOltcclxuICAgICAgcmVhY3QoKSxcclxuICAgICAgdGFpbHdpbmRjc3MoKSxcclxuICAgICAgaXNMaWIgJiYgZHRzKHsgXHJcbiAgICAgICAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSwgXHJcbiAgICAgICAgaW5jbHVkZTogWydzcmMvbGliJ11cclxuICAgICAgfSlcclxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLFxyXG5cclxuICAgIGVzYnVpbGQ6IHtcclxuICAgICAgZHJvcDogaXNMaWIgP1snY29uc29sZScsICdkZWJ1Z2dlciddIDpbXSxcclxuICAgICAgbGVnYWxDb21tZW50czogJ25vbmUnLCBcclxuICAgIH0sXHJcblxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxyXG4gICAgICBtaW5pZnk6ICdlc2J1aWxkJyxcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAsXHJcblxyXG4gICAgICAuLi4oaXNMaWIgPyB7XHJcbiAgICAgICAgLy8gLS0tIExJQlJBUlkgQ09ORklHIC0tLVxyXG4gICAgICAgIGxpYjoge1xyXG4gICAgICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2xpYi9pbmRleC50cycpLFxyXG4gICAgICAgICAgbmFtZTogJ1pQcm94aW1pdHlFbmdpbmUnLFxyXG4gICAgICAgICAgZm9ybWF0czogWydlcycsICd1bWQnXSxcclxuICAgICAgICAgIGZpbGVOYW1lOiAoZm9ybWF0KSA9PiBgaW5kZXguJHtmb3JtYXR9LmpzYCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgIGV4dGVybmFsOltcclxuICAgICAgICAgICAgJ3JlYWN0JywgXHJcbiAgICAgICAgICAgICdyZWFjdC1kb20nLCBcclxuICAgICAgICAgICAgJ3JlYWN0L2pzeC1ydW50aW1lJywgXHJcbiAgICAgICAgICAgICdAZ3NhcC9yZWFjdCcsIFxyXG4gICAgICAgICAgICAvXmdzYXAoXFwvLiopPyQvXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICAgIGNvbXBhY3Q6IHRydWUsIFxyXG4gICAgICAgICAgICBmb3JtYXQ6ICdlcycsXHJcbiAgICAgICAgICAgIGdsb2JhbHM6IHtcclxuICAgICAgICAgICAgICByZWFjdDogJ1JlYWN0JyxcclxuICAgICAgICAgICAgICAncmVhY3QtZG9tJzogJ1JlYWN0RE9NJyxcclxuICAgICAgICAgICAgICAncmVhY3QvanN4LXJ1bnRpbWUnOiAnanN4UnVudGltZScsXHJcbiAgICAgICAgICAgICAgZ3NhcDogJ2dzYXAnLFxyXG4gICAgICAgICAgICAgICdnc2FwL1Njcm9sbFRyaWdnZXInOiAnU2Nyb2xsVHJpZ2dlcicsXHJcbiAgICAgICAgICAgICAgJ0Bnc2FwL3JlYWN0JzogJ2dzYXBSZWFjdCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSA6IHtcclxuICAgICAgfSlcclxuICAgIH0sXHJcbiAgfTtcclxufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UCxPQUFPLGlCQUFpQjtBQUMvUSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZTtBQUp4QixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLFFBQVEsU0FBUztBQUV2QixTQUFPO0FBQUEsSUFDTCxXQUFXLFFBQVEsUUFBUTtBQUFBLElBRTNCLFNBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFNBQVMsSUFBSTtBQUFBLFFBQ1gsa0JBQWtCO0FBQUEsUUFDbEIsU0FBUyxDQUFDLFNBQVM7QUFBQSxNQUNyQixDQUFDO0FBQUEsSUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLElBRWhCLFNBQVM7QUFBQSxNQUNQLE1BQU0sUUFBTyxDQUFDLFdBQVcsVUFBVSxJQUFHLENBQUM7QUFBQSxNQUN2QyxlQUFlO0FBQUEsSUFDakI7QUFBQSxJQUVBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLGFBQWE7QUFBQSxNQUNiLFFBQVE7QUFBQSxNQUNSLHVCQUF1QjtBQUFBLE1BRXZCLEdBQUksUUFBUTtBQUFBO0FBQUEsUUFFVixLQUFLO0FBQUEsVUFDSCxPQUFPLFFBQVEsa0NBQVcsa0JBQWtCO0FBQUEsVUFDNUMsTUFBTTtBQUFBLFVBQ04sU0FBUyxDQUFDLE1BQU0sS0FBSztBQUFBLFVBQ3JCLFVBQVUsQ0FBQyxXQUFXLFNBQVMsTUFBTTtBQUFBLFFBQ3ZDO0FBQUEsUUFDQSxlQUFlO0FBQUEsVUFDYixVQUFTO0FBQUEsWUFDUDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxRQUFRO0FBQUEsWUFDTixTQUFTO0FBQUEsWUFDVCxRQUFRO0FBQUEsWUFDUixTQUFTO0FBQUEsY0FDUCxPQUFPO0FBQUEsY0FDUCxhQUFhO0FBQUEsY0FDYixxQkFBcUI7QUFBQSxjQUNyQixNQUFNO0FBQUEsY0FDTixzQkFBc0I7QUFBQSxjQUN0QixlQUFlO0FBQUEsWUFDakI7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0YsSUFBSSxDQUNKO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
