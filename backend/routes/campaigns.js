// routes/campaigns.js
// Campaign management routes - CRUD operations for campaigns

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requirePermission } = require('../middleware');
const { 
  getAllCampaigns, 
  getCompletedCampaigns,
  createCampaign, 
  updateCampaign, 
  updateCampaignStatus,
  assignContractors,
  updateCampaignStatusByContractor,
  getContractorCampaigns
} = require('../controllers/campaignController');
const multer = require('multer');
const path = require('path');

// Configure multer for local disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/campaign_images'));
  },
  filename: function (req, file, cb) {
    // Save with campaignId and timestamp for uniqueness
    const campaignId = req.params.id;
    const ext = path.extname(file.originalname);
    cb(null, `campaign_${campaignId}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

/**
 * GET /api/campaigns - Retrieve campaigns based on user role
 */
router.get('/', authenticateToken, requirePermission('view_campaigns'), getAllCampaigns);

/**
 * GET /api/campaigns/contractor - Get campaigns assigned to contractor
 */
router.get('/contractor', authenticateToken, requireRole('contractor'), getContractorCampaigns);

/**
 * GET /api/campaigns/completed - Get completed campaigns for contractors
 */
router.get('/completed', authenticateToken, requireRole('contractor'), getCompletedCampaigns);

/**
 * POST /api/campaigns - Create a new campaign
 */
router.post('/', authenticateToken, requirePermission('create_campaign'), createCampaign);

/**
 * POST /api/campaigns/:id/assign - Assign contractors to a campaign
 */
router.post('/:id/assign', authenticateToken, requirePermission('assign_campaign'), assignContractors);

/**
 * PUT /api/campaigns/:id - Update campaign details
 */
router.put('/:id', authenticateToken, requirePermission('edit_campaign'), updateCampaign);

/**
 * PUT /api/campaigns/:id/status - Update campaign status (employee)
 */
router.put('/:id/status', authenticateToken, requirePermission('edit_campaign'), updateCampaignStatus);

/**
 * PUT /api/campaigns/:id/contractor-status - Update campaign status (contractor)
 */
router.put('/:id/contractor-status', authenticateToken, requireRole('contractor'), updateCampaignStatusByContractor);

/**
 * POST /api/campaigns/:id/images - Upload campaign images
 */
router.post('/:id/images', authenticateToken, requireRole('contractor'), upload.array('images', 10), async (req, res) => {
  // Debug: Log user info attached to request
  console.log('Upload images route - req.user:', req.user);
  console.log('Upload images route - req.userInstance:', req.userInstance);
  // You can save file info to DB here if needed
  res.json({ message: 'Images uploaded', files: req.files });
});

// Create uploads/campaign_images directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads/campaign_images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

router.get('/:id/images', authenticateToken, requirePermission('view_campaigns'), async (req, res) => {
  const { id } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  try {
    const imagesDir = path.join(__dirname, '../uploads/campaign_images');
    
    // Check if uploads directory exists
    if (!fs.existsSync(imagesDir)) {
      return res.json([]);
    }
    
    // Get all files in the directory
    const files = fs.readdirSync(imagesDir);
    
    // Filter files that belong to this campaign (filename starts with campaign_{id}_)
    const campaignFiles = files.filter(file => 
      file.startsWith(`campaign_${id}_`) && 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    );
    
    // Return the filenames
    res.json(campaignFiles);
  } catch (error) {
    console.error('Error fetching campaign images:', error);
    res.status(500).json({ error: 'Failed to fetch campaign images' });
  }
});

/**
 * GET /api/campaigns/images/:filename - Serve image files
 * Static file serving for campaign images
 */
router.get('/images/:filename', authenticateToken, requirePermission('view_campaigns'), (req, res) => {
  const { filename } = req.params;
  const path = require('path');
  const fs = require('fs');
  
  // Security: Only allow alphanumeric, underscores, dots, and hyphens in filename
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  const filePath = path.join(__dirname, '../uploads/campaign_images', filename);
  
  // Check if file exists and is within the allowed directory
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Serve the file
  res.sendFile(filePath);
});

module.exports = router;

