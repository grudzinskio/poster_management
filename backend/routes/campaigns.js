// routes/campaigns.js
// Campaign management routes - CRUD operations for campaigns

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole, authorizePermission } = require('../middleware/auth');
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
router.get('/', authenticateToken, authorizePermission('view_campaign_list'), getAllCampaigns);

/**
 * GET /api/campaigns/contractor - Get campaigns assigned to contractor
 */
router.get('/contractor', authenticateToken, authorizeRole('contractor'), getContractorCampaigns);

/**
 * GET /api/campaigns/completed - Get completed campaigns for contractors
 */
router.get('/completed', authenticateToken, authorizeRole('contractor'), getCompletedCampaigns);

/**
 * POST /api/campaigns - Create a new campaign
 */
router.post('/', authenticateToken, authorizePermission('save_new_campaign'), createCampaign);

/**
 * POST /api/campaigns/:id/assign - Assign contractors to a campaign
 */
router.post('/:id/assign', authenticateToken, authorizePermission('assign_contractor_to_campaign'), assignContractors);

/**
 * PUT /api/campaigns/:id - Update campaign details
 */
router.put('/:id', authenticateToken, authorizePermission('update_campaign_data'), updateCampaign);

/**
 * PUT /api/campaigns/:id/status - Update campaign status (employee)
 */
router.put('/:id/status', authenticateToken, authorizePermission('update_campaign_data'), updateCampaignStatus);

/**
 * PUT /api/campaigns/:id/contractor-status - Update campaign status (contractor)
 */
router.put('/:id/contractor-status', authenticateToken, authorizeRole('contractor'), updateCampaignStatusByContractor);

module.exports = router;
