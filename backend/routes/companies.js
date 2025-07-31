// routes/companies.js
// Company management routes - CRUD operations for companies

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getAllCompanies, createCompany, updateCompany, deleteCompany } = require('../controllers/companyController');

/**
 * GET /api/companies - Retrieve all companies
 * Requires: Authentication + Employee role
 * Returns: List of companies with id and name
 */
router.get('/', authenticateToken, authorizeRole('employee'), getAllCompanies);

/**
 * POST /api/companies - Create a new company
 * Requires: Authentication + Employee role
 * Body: { name: string }
 * Handles: Duplicate name validation
 */
router.post('/', authenticateToken, authorizeRole('employee'), createCompany);

/**
 * PUT /api/companies/:id - Update an existing company
 * Requires: Authentication + Employee role
 * Params: id (company ID)
 * Body: { name: string }
 */
router.put('/:id', authenticateToken, authorizeRole('employee'), updateCompany);

/**
 * DELETE /api/companies/:id - Delete a company
 * Requires: Authentication + Employee role
 * Params: id (company ID)
 * Constraint: Cannot delete companies with associated users
 */
router.delete('/:id', authenticateToken, authorizeRole('employee'), deleteCompany);

module.exports = router;
