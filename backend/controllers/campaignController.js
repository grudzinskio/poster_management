// controllers/campaignController.js
// Campaign management controller - CRUD operations for campaigns

const { pool } = require('../config/database');

/**
 * GET /api/campaigns - Retrieve campaigns based on user role
 * Role-based filtering:
 * - Clients: Only see campaigns for their company
 * - Employees: See all campaigns across all companies
 * - Contractors: Only see campaigns assigned to them that are in progress
 */
async function getAllCampaigns(req, res) {
  try {
    const conn = await pool.getConnection();
    let query, params;
    
    if (req.user.role === 'client') {
      // Role-based query: Clients can only see campaigns for their company
      query = `
        SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
        FROM campaigns c
        JOIN companies co ON c.company_id = co.id
        WHERE c.company_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [req.user.company_id];
    } else if (req.user.role === 'contractor') {
      // Contractors only see campaigns assigned to them that are in progress
      query = `
        SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
        FROM campaigns c
        JOIN companies co ON c.company_id = co.id
        JOIN campaign_assignments ca ON c.id = ca.campaign_id
        WHERE ca.contractor_id = ? AND c.status IN ('approved', 'in_progress')
        ORDER BY c.created_at DESC
      `;
      params = [req.user.id];
    } else {
      // Employees can see all campaigns across companies
      query = `
        SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
        FROM campaigns c
        JOIN companies co ON c.company_id = co.id
        ORDER BY c.created_at DESC
      `;
      params = [];
    }
    
    const [rows] = await conn.execute(query, params);
    conn.release();
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
  if (req.user.role !== 'contractor') {
    return res.status(403).json({ error: 'Only contractors can view completed campaigns' });
  }

  try {
    const conn = await pool.getConnection();
    const query = `
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name,
             COUNT(ci.id) as total_images,
             COUNT(CASE WHEN ci.status = 'approved' THEN 1 END) as approved_images
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      JOIN campaign_assignments ca ON c.id = ca.campaign_id
      LEFT JOIN campaign_images ci ON c.id = ci.campaign_id AND ci.uploaded_by = ?
      WHERE ca.contractor_id = ? AND c.status = 'completed'
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    const [rows] = await conn.execute(query, [req.user.id, req.user.id]);
    conn.release();
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
  const { name, description, start_date, end_date } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Campaign name and description are required' });
  }
  
  // Only clients and employees can create campaigns
  if (req.user.role !== 'client' && req.user.role !== 'employee') {
    return res.status(403).json({ error: 'Not authorized to create campaigns' });
  }
  
  try {
    const conn = await pool.getConnection();
    
    // Role-based company assignment
    // For clients, use their company_id; for employees, company_id should be provided in request
    const company_id = req.user.role === 'client' ? req.user.company_id : req.body.company_id;
    
    if (!company_id) {
      conn.release();
      return res.status(400).json({ error: 'Company ID is required' });
    }
    
    // Insert campaign with default 'pending' status
    const [result] = await conn.execute(
      'INSERT INTO campaigns (name, description, company_id, status, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, company_id, 'pending', start_date || null, end_date || null, req.user.id]
    );
    
    // Retrieve the created campaign with company information
    const [campaignRows] = await conn.execute(`
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    conn.release();
    res.status(201).json(campaignRows[0]);
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
  const { id } = req.params;
  const { name, description, start_date, end_date, company_id } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Campaign name and description are required' });
  }
  
  try {
    const conn = await pool.getConnection();
    
    // Verify campaign exists
    const [existingCampaign] = await conn.execute('SELECT id FROM campaigns WHERE id = ?', [id]);
    if (existingCampaign.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Update campaign
    const [result] = await conn.execute(
      'UPDATE campaigns SET name = ?, description = ?, start_date = ?, end_date = ?, company_id = ? WHERE id = ?',
      [name, description, start_date || null, end_date || null, company_id, id]
    );
    
    // Retrieve the updated campaign with company information
    const [campaignRows] = await conn.execute(`
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, c.company_id, co.name as company_name
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `, [id]);
    
    conn.release();
    res.json(campaignRows[0]);
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
  const { id } = req.params;
  const { status } = req.body;
  
  // Validate status enum values
  if (!status || !['pending', 'approved', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (pending, approved, in_progress, completed, cancelled)' });
  }
  
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'UPDATE campaigns SET status = ? WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      conn.release();
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Retrieve the updated campaign with company information
    const [campaignRows] = await conn.execute(`
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `, [id]);
    
    conn.release();
    res.json(campaignRows[0]);
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
  const { id } = req.params;
  const { contractor_ids } = req.body;

  if (!Array.isArray(contractor_ids) || contractor_ids.length === 0) {
    return res.status(400).json({ error: 'Contractor IDs array is required' });
  }

  try {
    const conn = await pool.getConnection();
    
    // Verify campaign exists
    const [campaign] = await conn.execute('SELECT id FROM campaigns WHERE id = ?', [id]);
    if (campaign.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Delete existing assignments for this campaign
    await conn.execute('DELETE FROM campaign_assignments WHERE campaign_id = ?', [id]);

    // Insert new assignments
    const insertPromises = contractor_ids.map(contractor_id =>
      conn.execute('INSERT INTO campaign_assignments (campaign_id, contractor_id) VALUES (?, ?)', [id, contractor_id])
    );
    
    await Promise.all(insertPromises);
    conn.release();
    
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
  const { id } = req.params;
  const { status } = req.body;
  
  // Contractors can only update to these statuses
  const allowedStatusUpdates = {
    'approved': ['in_progress'],
    'in_progress': ['completed']
  };

  try {
    const conn = await pool.getConnection();
    
    // Verify contractor is assigned to this campaign
    const [assignment] = await conn.execute(`
      SELECT c.status as current_status 
      FROM campaigns c
      JOIN campaign_assignments ca ON c.id = ca.campaign_id
      WHERE c.id = ? AND ca.contractor_id = ?
    `, [id, req.user.id]);

    if (assignment.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Campaign not found or not assigned to you' });
    }

    const currentStatus = assignment[0].current_status;
    
    // Check if the status update is allowed
    if (!allowedStatusUpdates[currentStatus] || !allowedStatusUpdates[currentStatus].includes(status)) {
      conn.release();
      return res.status(400).json({ 
        error: `Cannot update status from ${currentStatus} to ${status}` 
      });
    }

    // Update campaign status
    const [result] = await conn.execute(
      'UPDATE campaigns SET status = ? WHERE id = ?',
      [status, id]
    );
    
    // Retrieve the updated campaign with company information
    const [campaignRows] = await conn.execute(`
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `, [id]);
    
    conn.release();
    res.json(campaignRows[0]);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
}

module.exports = {
  getAllCampaigns,
  getCompletedCampaigns,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  assignContractors,
  updateCampaignStatusByContractor
};
