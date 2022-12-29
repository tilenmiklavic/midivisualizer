import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, './midi_player') + '/[!.]*',
          dest: './midi_player'
        }
      ]
    })
  ]
})