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
      // Save single level
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

      // Swap two levels (exchange their IDs)
      server.middlewares.use('/api/swap-levels', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { idA, idB } = JSON.parse(body);
            if (!idA || !idB) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing idA or idB' }));
              return;
            }

            const jsonPath = path.resolve(process.cwd(), LEVELS_JSON);
            const content = fs.readFileSync(jsonPath, 'utf-8');
            const levels = JSON.parse(content) as any[];

            const indexA = levels.findIndex(l => l.id === idA);
            const indexB = levels.findIndex(l => l.id === idB);

            if (indexA < 0 || indexB < 0) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'One or both levels not found' }));
              return;
            }

            // Swap the IDs
            levels[indexA].id = idB;
            levels[indexB].id = idA;

            // Re-sort by id
            levels.sort((a, b) => a.id - b.id);

            // Write back
            fs.writeFileSync(jsonPath, JSON.stringify(levels, null, 2), 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, swapped: [idA, idB] }));
          } catch (error) {
            console.error('Error swapping levels:', error);
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
