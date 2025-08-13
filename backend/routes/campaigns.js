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

module.exports = router;
