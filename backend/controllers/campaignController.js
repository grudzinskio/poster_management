// controllers/campaignController.js
// Campaign management controller - CRUD operations for campaigns

const knex = require('../config/knex');

/**
 * GET /api/campaigns - Retrieve campaigns based on user role
 * Role-based filtering:
 * - Clients: Only see campaigns for their company
 * - Employees: See all campaigns across all companies
 * - Contractors: Only see campaigns assigned to them that are in progress
 */
async function getAllCampaigns(req, res) {
  console.log('[API] GET /api/campaigns called by user:', req.user?.username || req.user?.id);
  try {
    let query = knex('campaigns as c')
      .join('companies as co', 'c.company_id', 'co.id')
      .select('c.id', 'c.name', 'c.description', 'c.status', 'c.start_date', 'c.end_date', 'co.name as company_name')
      .orderBy('c.id', 'desc');

    // Check user roles for filtering
    const userRoles = req.user.roles || [];
    const hasClientRole = userRoles.some(role => role.name === 'client' || role === 'client');
    const hasContractorRole = userRoles.some(role => role.name === 'contractor' || role === 'contractor');

    if (hasClientRole) {
      // Role-based query: Clients can only see campaigns for their company
      query = query.where('c.company_id', req.user.company_id);
    } else if (hasContractorRole) {
      // Contractors only see campaigns assigned to them that are in progress
      query = query
        .join('campaign_assignments as ca', 'c.id', 'ca.campaign_id')
        .where('ca.contractor_id', req.user.id)
        .whereIn('c.status', ['approved', 'in_progress']);
    }
    // Employees, admins can see all campaigns (no additional filtering)

    const rows = await query;
    res.json(rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}

/**
 * GET /api/campaigns/completed - Get completed campaigns for contractors
 * Only contractors can access this endpoint to see their completed work
 */
async function getCompletedCampaigns(req, res) {
  console.log('[API] GET /api/campaigns/completed called by user:', req.user?.username || req.user?.id);
  // Check if user has contractor role
  const userRoles = req.user.roles || [];
  const hasContractorRole = userRoles.some(role => role.name === 'contractor' || role === 'contractor');
  
  if (!hasContractorRole) {
    return res.status(403).json({ error: 'Only contractors can view completed campaigns' });
  }

  try {
    const rows = await knex('campaigns as c')
      .join('companies as co', 'c.company_id', 'co.id')
      .join('campaign_assignments as ca', 'c.id', 'ca.campaign_id')
      .select(
        'c.id', 'c.name', 'c.description', 'c.status', 'c.start_date', 'c.end_date', 'co.name as company_name'
      )
      .where('ca.contractor_id', req.user.id)
      .where('c.status', 'completed')
      .orderBy('c.id', 'desc');

    res.json(rows);
  } catch (error) {
    console.error('Error fetching completed campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch completed campaigns' });
  }
}

/**
 * POST /api/campaigns - Create a new campaign
 * Body: { name, description, start_date?, end_date?, company_id? }
 * Role-based logic:
 * - Clients: Automatically use their company_id
 * - Employees: Must specify company_id in request body
 */
async function createCampaign(req, res) {
  console.log('[API] POST /api/campaigns called by user:', req.user?.username || req.user?.id, 'body:', req.body);
  const { name, description, start_date, end_date } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Campaign name and description are required' });
  }
  
  try {
    // Determine company_id based on user's company or request body
    // If user has a company, use it; otherwise, require company_id in request
    const company_id = req.user.company_id || req.body.company_id;
    
    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    
    // Insert campaign with default 'pending' status
    const [insertId] = await knex('campaigns').insert({
      name,
      description,
      company_id,
      status: 'pending',
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: req.user.id
    });
    
    // Retrieve the created campaign with company information
    const campaign = await knex('campaigns as c')
      .join('companies as co', 'c.company_id', 'co.id')
      .select('c.id', 'c.name', 'c.description', 'c.status', 'c.start_date', 'c.end_date', 'co.name as company_name')
      .where('c.id', insertId)
      .first();
    
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
}

/**
 * PUT /api/campaigns/:id - Update campaign details
 * Params: id (campaign ID)
 * Body: { name?, description?, start_date?, end_date?, company_id? }
 * Only employees can update campaign details
 */
async function updateCampaign(req, res) {
  console.log('[API] PUT /api/campaigns/:id called by user:', req.user?.username || req.user?.id, 'params:', req.params, 'body:', req.body);
  const { id } = req.params;
  const { name, description, start_date, end_date, company_id } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Campaign name and description are required' });
  }
  
  try {
    // Verify campaign exists and get current company_id if not provided
    const existingCampaign = await knex('campaigns')
      .select('id', 'company_id')
      .where('id', id)
      .first();
      
    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Use existing company_id if not provided in request
    const finalCompanyId = company_id || existingCampaign.company_id;
    
    // Update campaign
    // Build update object, include status if provided
    const updateObj = {
      name,
      description,
      start_date: start_date || null,
      end_date: end_date || null,
      company_id: finalCompanyId
    };
    if (typeof req.body.status !== 'undefined') {
      updateObj.status = req.body.status;
    }

    const affectedRows = await knex('campaigns')
      .where('id', id)
      .update(updateObj);

    console.log('[DB] updateCampaign affectedRows:', affectedRows);

    // Retrieve the updated campaign with company information
    const campaign = await knex('campaigns as c')
      .join('companies as co', 'c.company_id', 'co.id')
      .select('c.id', 'c.name', 'c.description', 'c.status', 'c.start_date', 'c.end_date', 'c.company_id', 'co.name as company_name')
      .where('c.id', id)
      .first();

    console.log('[DB] updateCampaign updated campaign:', campaign);

    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
}

/**
 * PUT /api/campaigns/:id/status - Update campaign status
 * Params: id (campaign ID)
 * Body: { status: enum('pending', 'approved', 'in_progress', 'completed', 'cancelled') }
 * Only employees can change campaign status
 */
async function updateCampaignStatus(req, res) {
  console.log('[API] PUT /api/campaigns/:id/status called by user:', req.user?.username || req.user?.id, 'params:', req.params, 'body:', req.body);
  const { id } = req.params;
  const { status } = req.body;
  
  // Validate status enum values
  if (!status || !['pending', 'approved', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (pending, approved, in_progress, completed, cancelled)' });
  }
  
  try {
    const affectedRows = await knex('campaigns')
      .where('id', id)
      .update({ status });
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Retrieve the updated campaign with company information
    const campaign = await knex('campaigns as c')
      .join('companies as co', 'c.company_id', 'co.id')
      .select('c.id', 'c.name', 'c.description', 'c.status', 'c.start_date', 'c.end_date', 'co.name as company_name')
      .where('c.id', id)
      .first();
    
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
}

/**
 * POST /api/campaigns/:id/assign - Assign contractors to a campaign
 * Only employees can assign contractors
 */
async function assignContractors(req, res) {
  console.log('[API] POST /api/campaigns/:id/assign called by user:', req.user?.username || req.user?.id, 'params:', req.params, 'body:', req.body);
  const { id } = req.params;
  const { contractor_ids } = req.body;

  if (!Array.isArray(contractor_ids) || contractor_ids.length === 0) {
    return res.status(400).json({ error: 'Contractor IDs array is required' });
  }

  try {
    // Verify campaign exists
    const campaign = await knex('campaigns').where('id', id).first();
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Use transaction for atomic operation
    await knex.transaction(async (trx) => {
      // Delete existing assignments for this campaign
      await trx('campaign_assignments').where('campaign_id', id).del();

      // Insert new assignments
      const assignments = contractor_ids.map(contractor_id => ({
        campaign_id: id,
        contractor_id
      }));
      
      await trx('campaign_assignments').insert(assignments);
    });
    
    res.json({ message: 'Contractors assigned successfully' });
  } catch (error) {
    console.error('Error assigning contractors:', error);
    res.status(500).json({ error: 'Failed to assign contractors' });
  }
}

/**
 * PUT /api/campaigns/:id/contractor-status - Update campaign status (contractor specific)
 * Contractors can only update from 'approved' to 'in_progress' and from 'in_progress' to 'completed'
 */
async function updateCampaignStatusByContractor(req, res) {
  console.log('[API] PUT /api/campaigns/:id/contractor-status called by user:', req.user?.username || req.user?.id, 'params:', req.params, 'body:', req.body);
  const { id } = req.params;
  const { status } = req.body;
  
  // Contractors can only update to these statuses
  const allowedStatusUpdates = {
    'approved': ['in_progress'],
    'in_progress': ['completed']
  };

  try {
    // Verify contractor is assigned to this campaign
    const assignment = await knex('campaigns as c')
      .join('campaign_assignments as ca', 'c.id', 'ca.campaign_id')
      .select('c.status as current_status')
      .where('c.id', id)
      .where('ca.contractor_id', req.user.id)
      .first();

    if (!assignment) {
      return res.status(404).json({ error: 'Campaign not found or not assigned to you' });
    }

    const currentStatus = assignment.current_status;
    
    // Check if the status update is allowed
    if (!allowedStatusUpdates[currentStatus] || !allowedStatusUpdates[currentStatus].includes(status)) {
      return res.status(400).json({ 
        error: `Cannot update status from ${currentStatus} to ${status}` 
      });
    }

    // Update campaign status
    await knex('campaigns')
      .where('id', id)
      .update({ status });
    
    // Retrieve the updated campaign with company information
    const campaign = await knex('campaigns as c')
      .join('companies as co', 'c.company_id', 'co.id')
      .select('c.id', 'c.name', 'c.description', 'c.status', 'c.start_date', 'c.end_date', 'co.name as company_name')
      .where('c.id', id)
      .first();
    
    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
}

// Get campaigns assigned to the current contractor
const getContractorCampaigns = async (req, res) => {
  console.log('[API] GET /api/campaigns/contractor called by user:', req.user?.username || req.user?.id);
  try {
    // Check if user has contractor role
    const userRoles = req.user.roles || [];
    const hasContractorRole = userRoles.some(role => role.name === 'contractor' || role === 'contractor');
    
    if (!hasContractorRole) {
      return res.status(403).json({ error: 'Access denied. Contractor role required.' });
    }

    // Get campaigns where this contractor is assigned
    const campaigns = await knex('campaigns as c')
      .leftJoin('companies as co', 'c.company_id', 'co.id')
      .join('campaign_assignments as ca', 'c.id', 'ca.campaign_id')
      .select('c.id', 'c.name', 'c.description', 'c.status', 'c.start_date', 'c.end_date', 'co.name as company_name')
      .where('ca.contractor_id', req.user.id)
      .orderBy('c.id', 'desc');

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching contractor campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

module.exports = {
  getAllCampaigns,
  getCompletedCampaigns,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  assignContractors,
  updateCampaignStatusByContractor,
  getContractorCampaigns,
};
