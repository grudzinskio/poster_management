// controllers/companyController.js
// Company management controller - CRUD operations for companies

const knex = require('../config/knex');

/**
 * GET /api/companies - Retrieve all companies
 * Returns: List of companies with id and name
 */
async function getAllCompanies(req, res) {
  try {
    const companies = await knex('companies')
      .select('id', 'name')
      .orderBy('name');
    
    res.json(companies);
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
    const [insertId] = await knex('companies').insert({ name });
    
    res.status(201).json({ 
      id: insertId, 
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
    const affectedRows = await knex('companies')
      .where('id', id)
      .update({ name });
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ id: parseInt(id), name });
  } catch (error) {
    // Handle MySQL duplicate entry error
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
    // Check if company has associated users
    const userCount = await knex('users')
      .where('company_id', id)
      .count('id as count')
      .first();
    
    if (userCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete company with associated users. Please reassign or delete users first.' 
      });
    }
    
    const affectedRows = await knex('companies')
      .where('id', id)
      .del();
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ message: 'Company deleted successfully' });
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
