import { defineConfig } from '@apps-in-toss/web-framework/config';
export default defineConfig({
  appName: 'jinju',
  brand: { displayName: '진주', primaryColor: '#A87954', icon: '' },
  web: { host: 'localhost', port: 5173, commands: { dev: 'vite --host 0.0.0.0', build: 'npm run build' } },
  permissions: [],
  outdir: 'dist',
});
