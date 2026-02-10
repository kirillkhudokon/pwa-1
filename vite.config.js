import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sw: resolve(__dirname, 'sw.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if(chunkInfo.name === 'sw'){
            return `[name].js`; 
          }

          return `assets/[name]-[hash].js`;
        }
      }
    }
  }
})