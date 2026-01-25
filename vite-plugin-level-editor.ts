// vite-plugin-level-editor.ts
// Dev-only plugin that allows the Level Editor to save levels to JSON
import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

const LEVELS_JSON = 'src/game/engine/arcade/levels-data.json';

export function levelEditorPlugin(): Plugin {
  return {
    name: 'level-editor-save',
    apply: 'serve', // Only in dev mode
    configureServer(server) {
      server.middlewares.use('/api/save-level', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const newLevel = JSON.parse(body);
            const jsonPath = path.resolve(process.cwd(), LEVELS_JSON);

            // Read current levels
            const content = fs.readFileSync(jsonPath, 'utf-8');
            const levels = JSON.parse(content) as any[];

            // Find existing level or add new
            const existingIndex = levels.findIndex(l => l.id === newLevel.id);
            if (existingIndex >= 0) {
              levels[existingIndex] = newLevel;
            } else {
              levels.push(newLevel);
              // Sort by id
              levels.sort((a, b) => a.id - b.id);
            }

            // Write back
            fs.writeFileSync(jsonPath, JSON.stringify(levels, null, 2), 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, levelId: newLevel.id }));
          } catch (error) {
            console.error('Error saving level:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(error) }));
          }
        });
      });
    },
  };
}

export default levelEditorPlugin;
