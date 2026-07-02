import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Object Storage static hosting does not send CORS headers by default. */
function stripCrossOrigin() {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml(html: string) {
      return html.replace(/\s+crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripCrossOrigin()],
});
