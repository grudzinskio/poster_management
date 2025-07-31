// routes/campaigns.js
// Campaign management routes - CRUD operations for campaigns

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getAllCampaigns, createCampaign, updateCampaign, updateCampaignStatus } = require('../controllers/campaignController');

/**
 * GET /api/campaigns - Retrieve campaigns based on user role
 * Requires: Authentication
 * Role-based filtering:
 * - Clients: Only see campaigns for their company
 * - Employees: See all campaigns across all companies
 */
router.get('/', authenticateToken, getAllCampaigns);

/**
 * POST /api/campaigns - Create a new campaign
 * Requires: Authentication (client or employee role)
 * Body: { name, description, start_date?, end_date?, company_id? }
 * Role-based logic:
 * - Clients: Automatically use their company_id
 * - Employees: Must specify company_id in request body
 */
router.post('/', authenticateToken, createCampaign);

/**
 * PUT /api/campaigns/:id - Update campaign details
 * Requires: Authentication + Employee role
 * Params: id (campaign ID)
 * Body: { name?, description?, start_date?, end_date?, company_id? }
 * Only employees can update campaign details
 */
router.put('/:id', authenticateToken, authorizeRole('employee'), updateCampaign);

/**
 * PUT /api/campaigns/:id/status - Update campaign status
 * Requires: Authentication + Employee role
 * Params: id (campaign ID)
 * Body: { status: enum('pending', 'approved', 'in_progress', 'completed', 'cancelled') }
 * Only employees can change campaign status
 */
router.put('/:id/status', authenticateToken, authorizeRole('employee'), updateCampaignStatus);

module.exports = router;
