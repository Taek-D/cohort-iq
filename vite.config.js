import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/jspdf')) {
            return 'jspdf';
          }

          if (id.includes('node_modules/html2canvas-pro')) {
            return 'html2canvas';
          }

          if (
            id.includes('node_modules/papaparse') ||
            id.includes('node_modules/chart.js') ||
            id.includes('node_modules/chartjs-chart-matrix') ||
            id.includes('node_modules/date-fns')
          ) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    open: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'src/core/analysisWorker.js'],
    },
  },
});
