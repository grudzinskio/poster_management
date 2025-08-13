// routes/index.js
// Main router that aggregates all route modules

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const companyRoutes = require('./companies');
const userRoutes = require('./users');
const campaignRoutes = require('./campaigns');
const roleRoutes = require('./roles');
const permissionRoutes = require('./permissions');
const rbacRoutes = require('./rbac');

// Mount routes with appropriate prefixes
router.use('/api', authRoutes);           // Auth routes: /api/login, /api/migrate-passwords
router.use('/api/rbac', rbacRoutes);      // RBAC demo routes: /api/rbac/*
router.use('/api/companies', companyRoutes);  // Company routes: /api/companies/*
router.use('/api/users', userRoutes);         // User routes: /api/users/*
router.use('/api/campaigns', campaignRoutes); // Campaign routes: /api/campaigns/*
router.use('/api/roles', roleRoutes);         // Role routes: /api/roles/*
router.use('/api/permissions', permissionRoutes); // Permission routes: /api/permissions/*

module.exports = router;
