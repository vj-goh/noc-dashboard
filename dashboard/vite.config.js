import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        // Detect if running in Docker by checking if DOCKER_ENV env var is set
        // In Docker, use the service hostname; otherwise use localhost for local dev
        target: process.env.DOCKER_ENV === 'true' ? 'http://api:8000' : 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
});