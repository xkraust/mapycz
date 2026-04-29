import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.MAPY_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!API_KEY) {
  console.error('ERROR: MAPY_API_KEY is not set in .env file');
  process.exit(1);
}

// Serve static files
app.use(express.static(__dirname));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy: GET /api/routing/route
app.get('/api/routing/route', async (req, res) => {
  try {
    const params = new URLSearchParams({
      apikey: API_KEY,
      ...req.query,
    });
    const url = `https://api.mapy.cz/v1/routing/route?${params}`;
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    console.error('Routing error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy: GET /api/elevation
app.get('/api/elevation', async (req, res) => {
  try {
    const params = new URLSearchParams({
      apikey: API_KEY,
    });
    // Handle array of positions
    if (req.query.positions) {
      const positions = Array.isArray(req.query.positions)
        ? req.query.positions
        : [req.query.positions];
      positions.forEach(pos => params.append('positions', pos));
    }
    const url = `https://api.mapy.cz/v1/elevation?${params}`;
    const response = await fetch(url);
    const json = await response.json();
    res.json(json);
  } catch (error) {
    console.error('Elevation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy: Map tiles
app.get('/api/maptiles/:type/:z/:x/:y', async (req, res) => {
  try {
    const { type, z, x, y } = req.params;
    const url = `https://api.mapy.cz/v1/maptiles/${type}/256/${z}/${x}/${y}?apikey=${API_KEY}`;
    const response = await fetch(url);
    const buffer = await response.buffer();
    res.set('Content-Type', response.headers.get('content-type'));
    res.send(buffer);
  } catch (error) {
    console.error('Tile error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
  console.log(`  Map app: http://localhost:${PORT}`);
});
