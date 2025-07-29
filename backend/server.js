// backend/server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // Choose a port different from your frontend

// Middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Allows server to accept JSON data in request bodies

// --- API Routes ---
// A simple test route to make sure the server is working
app.get('/api/campaigns', (req, res) => {
  // In the future, you'll get this data from your database
  const sampleCampaigns = [
    { id: 1, name: 'tests', client: 'Nike' },
    { id: 2, name: 'Back to School', client: 'Adidas' },
  ];
  res.json(sampleCampaigns);
});


// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});