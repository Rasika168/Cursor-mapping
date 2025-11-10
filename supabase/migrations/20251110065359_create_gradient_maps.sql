/*
  # Gradient Maps Management

  1. New Tables
    - `gradient_maps`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `points` (jsonb, gradient points data)
      - `settings` (jsonb, canvas settings like grid, labels, etc.)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `gradient_maps` table
    - Add policy for public access (no auth required for this tool)
*/

CREATE TABLE IF NOT EXISTS gradient_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled Map',
  points jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gradient_maps ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read, create, update, and delete maps (public tool)
CREATE POLICY "Anyone can view gradient maps"
  ON gradient_maps
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create gradient maps"
  ON gradient_maps
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update gradient maps"
  ON gradient_maps
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete gradient maps"
  ON gradient_maps
  FOR DELETE
  TO public
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gradient_maps_created_at ON gradient_maps(created_at DESC);
