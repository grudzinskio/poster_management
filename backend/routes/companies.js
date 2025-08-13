// routes/companies.js
// Company management routes - CRUD operations for companies

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/enhancedAuth');
const { getAllCompanies, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');

/**
 * GET /api/companies - Retrieve all companies
 * Requires: Authentication + view_companies permission
 * Returns: List of companies with id and name
 */
router.get('/', authenticateToken, requirePermission('view_companies'), getAllCompanies);

/**
 * POST /api/companies - Create a new company
 * Requires: Authentication + create_company permission
 * Body: { name: string }
 * Handles: Duplicate name validation
 */
router.post('/', authenticateToken, requirePermission('create_company'), createCompany);

/**
 * PUT /api/companies/:id - Update an existing company
 * Requires: Authentication + edit_company permission
 * Params: id (company ID)
 * Body: { name: string }
 */
router.put('/:id', authenticateToken, requirePermission('edit_company'), updateCompany);

/**
 * DELETE /api/companies/:id - Delete a company
 * Requires: Authentication + delete_company permission
 * Params: id (company ID)
 * Constraint: Cannot delete companies with associated users
 */
router.delete('/:id', authenticateToken, requirePermission('delete_company'), deleteCompany);

module.exports = router;
