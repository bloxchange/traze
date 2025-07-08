import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function markdownPlugin(): Plugin {
  return {
    name: 'vite-plugin-markdown',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/src/faq/') && req.url.endsWith('.md')) {
          try {
            const filePath = path.join(process.cwd(), req.url);
            const content = await fs.promises.readFile(filePath, 'utf-8');
            res.setHeader('Content-Type', 'text/markdown');
            return res.end(content);
          } catch (error) {
            console.error('Error serving markdown file:', error);
            return next(error);
          }
        }
        next();
      });
    },
  };
}