import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['papaparse', 'chart.js', 'date-fns'],
                    export: ['jspdf', 'html2canvas-pro'],
                },
            },
        },
    },
    server: {
        open: true,
    },
});
