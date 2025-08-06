// routes/campaigns.js
// Campaign management routes - CRUD operations for campaigns

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { 
  getAllCampaigns, 
  getCompletedCampaigns,
  createCampaign, 
  updateCampaign, 
  updateCampaignStatus,
  assignContractors,
  updateCampaignStatusByContractor
} = require('../controllers/campaignController');

/**
 * GET /api/campaigns - Retrieve campaigns based on user role
 */
router.get('/', authenticateToken, getAllCampaigns);

/**
 * GET /api/campaigns/completed - Get completed campaigns for contractors
 */
router.get('/completed', authenticateToken, authorizeRole('contractor'), getCompletedCampaigns);

/**
 * POST /api/campaigns - Create a new campaign
 */
router.post('/', authenticateToken, createCampaign);

/**
 * POST /api/campaigns/:id/assign - Assign contractors to a campaign
 */
router.post('/:id/assign', authenticateToken, authorizeRole('employee'), assignContractors);

/**
 * PUT /api/campaigns/:id - Update campaign details
 */
router.put('/:id', authenticateToken, authorizeRole('employee'), updateCampaign);

/**
 * PUT /api/campaigns/:id/status - Update campaign status (employee)
 */
router.put('/:id/status', authenticateToken, authorizeRole('employee'), updateCampaignStatus);

/**
 * PUT /api/campaigns/:id/contractor-status - Update campaign status (contractor)
 */
router.put('/:id/contractor-status', authenticateToken, authorizeRole('contractor'), updateCampaignStatusByContractor);

module.exports = router;
