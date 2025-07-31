// routes/index.js
// Main router that aggregates all route modules

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const companyRoutes = require('./companies');
const userRoutes = require('./users');
const campaignRoutes = require('./campaigns');

// Mount routes with appropriate prefixes
router.use('/api', authRoutes);           // Auth routes: /api/login, /api/migrate-passwords
router.use('/api/companies', companyRoutes);  // Company routes: /api/companies/*
router.use('/api/users', userRoutes);         // User routes: /api/users/*
router.use('/api/campaigns', campaignRoutes); // Campaign routes: /api/campaigns/*

module.exports = router;
