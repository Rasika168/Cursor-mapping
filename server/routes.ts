import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { neon } from '@neondatabase/serverless';

// Initialize database connection only if a connection string is available.
// This allows the dev server to run without a database during local development.
const hasDatabaseUrl = typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;
const sql = hasDatabaseUrl ? neon(process.env.DATABASE_URL!) : null as unknown as ReturnType<typeof neon>;

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all gradient maps
  app.get('/api/maps', async (req, res) => {
    try {
      if (!hasDatabaseUrl) {
        return res.json([]);
      }
      const maps = await sql`
        SELECT id, title, points, settings, created_at, updated_at
        FROM gradient_maps
        ORDER BY created_at DESC
      `;
      res.json(maps);
    } catch (error) {
      console.error('Error fetching maps:', error);
      res.status(500).json({ message: 'Failed to fetch maps' });
    }
  });

  // Get a single map by ID
  app.get('/api/maps/:id', async (req, res) => {
    try {
      const { id } = req.params;
      if (!hasDatabaseUrl) {
        return res.status(404).json({ message: 'Map not found' });
      }
      const maps = await sql`
        SELECT id, title, points, settings, created_at, updated_at
        FROM gradient_maps
        WHERE id = ${id}
      `;

      if (maps.length === 0) {
        return res.status(404).json({ message: 'Map not found' });
      }

      res.json(maps[0]);
    } catch (error) {
      console.error('Error fetching map:', error);
      res.status(500).json({ message: 'Failed to fetch map' });
    }
  });

  // Create a new map
  app.post('/api/maps', async (req, res) => {
    try {
      if (!hasDatabaseUrl) {
        return res.status(503).json({ message: 'Database not configured' });
      }
      const { title, points, settings } = req.body;
      const maps = await sql`
        INSERT INTO gradient_maps (title, points, settings)
        VALUES (${title || 'Untitled Map'}, ${points}::jsonb, ${settings}::jsonb)
        RETURNING id, title, points, settings, created_at, updated_at
      `;
      res.json(maps[0]);
    } catch (error) {
      console.error('Error creating map:', error);
      res.status(500).json({ message: 'Failed to create map' });
    }
  });

  // Update a map
  app.put('/api/maps/:id', async (req, res) => {
    try {
      if (!hasDatabaseUrl) {
        return res.status(503).json({ message: 'Database not configured' });
      }
      const { id } = req.params;
      const { title, points, settings } = req.body;

      let updateQuery;
      if (title !== undefined && points === undefined && settings === undefined) {
        updateQuery = await sql`
          UPDATE gradient_maps
          SET title = ${title}, updated_at = now()
          WHERE id = ${id}
          RETURNING id, title, points, settings, created_at, updated_at
        `;
      } else if (points !== undefined && settings !== undefined) {
        updateQuery = await sql`
          UPDATE gradient_maps
          SET points = ${points}::jsonb, settings = ${settings}::jsonb, updated_at = now()
          WHERE id = ${id}
          RETURNING id, title, points, settings, created_at, updated_at
        `;
      } else {
        return res.status(400).json({ message: 'Invalid update parameters' });
      }

      if (updateQuery.length === 0) {
        return res.status(404).json({ message: 'Map not found' });
      }

      res.json(updateQuery[0]);
    } catch (error) {
      console.error('Error updating map:', error);
      res.status(500).json({ message: 'Failed to update map' });
    }
  });

  // Delete a map
  app.delete('/api/maps/:id', async (req, res) => {
    try {
      if (!hasDatabaseUrl) {
        return res.status(503).json({ message: 'Database not configured' });
      }
      const { id } = req.params;
      const result = await sql`
        DELETE FROM gradient_maps
        WHERE id = ${id}
        RETURNING id
      `;

      if (result.length === 0) {
        return res.status(404).json({ message: 'Map not found' });
      }

      res.json({ message: 'Map deleted successfully' });
    } catch (error) {
      console.error('Error deleting map:', error);
      res.status(500).json({ message: 'Failed to delete map' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
