import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: '/index.html',
        login: '/login.html',
        profile: '/profile.html',
        leaderboard: '/leaderboard.html'
      }
    }
  }
});