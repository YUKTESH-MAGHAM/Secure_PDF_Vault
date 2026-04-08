import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/upload': 'http://localhost:5000',
            '/access': 'http://localhost:5000',
            '/files': 'http://localhost:5000',
            '/file': 'http://localhost:5000',
            '/analytics': 'http://localhost:5000',
        }
    }
})
