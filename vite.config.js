import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        order: resolve(__dirname, 'order_page.html'), // 加入你的第二個頁面
        // 如果還有其他頁面，依此類推...
      },
    },
  },
});