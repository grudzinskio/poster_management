// controllers/companyController.js
// Company management controller - CRUD operations for companies

const { pool } = require('../config/database');

/**
 * GET /api/companies - Retrieve all companies
 * Returns: List of companies with id and name
 */
async function getAllCompanies(req, res) {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute('SELECT id, name FROM companies ORDER BY name');
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
}

/**
 * POST /api/companies - Create a new company
 * Body: { name: string }
 * Handles: Duplicate name validation
 */
async function createCompany(req, res) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'INSERT INTO companies (name) VALUES (?)',
      [name] 
    );
    conn.release();
    
    res.status(201).json({ 
      id: result.insertId, 
      name
    });
  } catch (error) {
    // Handle MySQL duplicate entry error
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Company name already exists' });
    }
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
}

/**
 * PUT /api/companies/:id - Update an existing company
 * Params: id (company ID)
 * Body: { name: string }
 */
async function updateCompany(req, res) {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Company name is required' });
  }
  
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'UPDATE companies SET name = ? WHERE id = ?',
      [name, id]
    );
    conn.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ id: parseInt(id), name });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Company name already exists' });
    }
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Failed to update company' });
  }
}

/**
 * DELETE /api/companies/:id - Delete a company
 * Params: id (company ID)
 * Constraint: Cannot delete companies with associated users
 */
async function deleteCompany(req, res) {
  const { id } = req.params;
  
  try {
    const conn = await pool.getConnection();
    
    // Check for foreign key constraints before deletion
    const [userCheck] = await conn.execute('SELECT COUNT(*) as count FROM users WHERE company_id = ?', [id]);
    if (userCheck[0].count > 0) {
      conn.release();
      return res.status(400).json({ error: 'Cannot delete company with associated users. Please reassign users first.' });
    }
    
    const [result] = await conn.execute('DELETE FROM companies WHERE id = ?', [id]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
}

module.exports = {
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany
};
