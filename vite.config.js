import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    base:"/aemo13/",
    plugins: [plugin()],
    server: {
        host:'localhost',
        port: 54968,
        strictport: true,
        cors: true/*,
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }*/
    }
})
