import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    define: {
        global: 'globalThis',
    },
    plugins: [react(), basicSsl()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    base: process.env.VITE_BASE_PATH || '/',
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // @react-pdf y sus dependencias pesadas (fontkit, linebreak, unicode-trie)
                    // se separan en su propio chunk para NO contaminar vendor-react
                    if (id.includes('@react-pdf') || id.includes('fontkit') || id.includes('linebreak') || id.includes('unicode-properties') || id.includes('unicode-trie') || id.includes('restructure')) {
                        return 'vendor-pdf';
                    }
                    // Librería de iconos personalizada reicon-react
                    if (id.includes('reicon-react')) {
                        return 'vendor-icons-reicon';
                    }
                    if (id.includes('node_modules')) {
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('@tanstack')) {
                            return 'vendor-query';
                        }
                        if (id.includes('@supabase')) {
                            return 'vendor-supabase';
                        }
                        // Solo react, react-dom y react-router (NO @react-pdf)
                        if (
                            id.includes('/node_modules/react/') ||
                            id.includes('/node_modules/react-dom/') ||
                            id.includes('/node_modules/react-router/') ||
                            id.includes('/node_modules/scheduler/')
                        ) {
                            return 'vendor-react';
                        }
                    }
                }
            }
        }
    }
})