// routes/companies.js
// Company management routes - CRUD operations for companies

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePermission } = require('../middleware/auth');
const { getAllCompanies, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');

/**
 * GET /api/companies - Retrieve all companies
 * Requires: Authentication + permission to read companies
 * Returns: List of companies with id and name
 */
router.get('/', authenticateToken, authorizePermission('view_company_list'), getAllCompanies);

/**
 * POST /api/companies - Create a new company
 * Requires: Authentication + permission to create companies
 * Body: { name: string }
 * Handles: Duplicate name validation
 */
router.post('/', authenticateToken, authorizePermission('save_new_company'), createCompany);

/**
 * PUT /api/companies/:id - Update an existing company
 * Requires: Authentication + permission to update companies
 * Params: id (company ID)
 * Body: { name: string }
 */
router.put('/:id', authenticateToken, authorizePermission('update_company_data'), updateCompany);

/**
 * DELETE /api/companies/:id - Delete a company
 * Requires: Authentication + permission to delete companies
 * Params: id (company ID)
 * Constraint: Cannot delete companies with associated users
 */
router.delete('/:id', authenticateToken, authorizePermission('remove_company_record'), deleteCompany);

module.exports = router;
