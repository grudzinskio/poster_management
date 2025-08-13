// Unified database setup script
// Replaces run-seeds.js, setup-test-data.js complexity
// No hardcoded data - everything defined here as the single source

const knex = require('../config/knex');
const { hashPassword } = require('../services/authService');

async function setupDatabase() {
  console.log('🏗️  Setting up database with unified script...\n');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await knex('user_roles').del();
    await knex('role_permissions').del();
    await knex('users').del();
    await knex('companies').del();
    await knex('permissions').del();
    await knex('roles').del();
    console.log('✅ Cleared existing data\n');

    // 1. Insert Roles
    console.log('👥 Creating roles...');
    const roles = [
      // Employee hierarchy (most powerful to least)
      { name: 'super_admin' },      // Full system control
      { name: 'admin_manager' },    // Limited admin controls
      { name: 'employee' },         // Standard employee
      { name: 'basic_employee' },   // Read-only employee
      
      // External roles
      { name: 'client' },           // Customer role
      { name: 'contractor' }        // External contractor
    ];
    await knex('roles').insert(roles);
    console.log(`✅ Created ${roles.length} roles\n`);

    // 2. Insert Permissions
    console.log('🔐 Creating permissions...');
    const permissions = [
      // User management
      { permission: 'view_users' },
      { permission: 'create_user' },
      { permission: 'edit_user' },
      { permission: 'delete_user' },
      
      // Company management
      { permission: 'view_companies' },
      { permission: 'create_company' },
      { permission: 'edit_company' },
      { permission: 'delete_company' },
      
      // Campaign management
      { permission: 'view_campaigns' },
      { permission: 'create_campaign' },
      { permission: 'edit_campaign' },
      { permission: 'delete_campaign' },
      { permission: 'assign_campaign' },
      
      // Role & System management
      { permission: 'manage_roles' },
      { permission: 'view_roles' },
      { permission: 'system_admin' },
      { permission: 'view_reports' },
      { permission: 'manage_permissions' },
      
      // Advanced admin controls
      { permission: 'database_backup' },
      { permission: 'system_settings' },
      { permission: 'audit_logs' },
      { permission: 'emergency_access' }
    ];
    await knex('permissions').insert(permissions);
    console.log(`✅ Created ${permissions.length} permissions\n`);

    // 3. Get IDs for mapping
    const rolesFromDB = await knex('roles').select('id', 'name');
    const permissionsFromDB = await knex('permissions').select('id', 'permission');
    
    const getRoleId = (name) => rolesFromDB.find(r => r.name === name).id;
    const getPermissionId = (permission) => permissionsFromDB.find(p => p.permission === permission).id;

    // 4. Assign permissions to roles
    console.log('🔗 Assigning permissions to roles...');
    const rolePermissionMappings = [
      // SUPER ADMIN - Complete system control (all permissions)
      { 
        role: 'super_admin', 
        permissions: [
          'view_users', 'create_user', 'edit_user', 'delete_user',
          'view_companies', 'create_company', 'edit_company', 'delete_company',
          'view_campaigns', 'create_campaign', 'edit_campaign', 'delete_campaign', 'assign_campaign',
          'manage_roles', 'view_roles', 'manage_permissions',
          'system_admin', 'view_reports', 'database_backup', 'system_settings', 'audit_logs', 'emergency_access'
        ] 
      },
      
      // ADMIN MANAGER - Limited admin controls (no system-level or destructive operations)
      { 
        role: 'admin_manager', 
        permissions: [
          'view_users', 'create_user', 'edit_user',           // Can manage users but not delete
          'view_companies', 'create_company', 'edit_company', // Can manage companies but not delete
          'view_campaigns', 'create_campaign', 'edit_campaign', 'delete_campaign', 'assign_campaign',
          'view_roles',                                       // Can view roles but not manage
          'view_reports'                                      // Can view reports
        ] 
      },
      
      // EMPLOYEE - Standard business operations (no admin or delete permissions)
      { 
        role: 'employee', 
        permissions: [
          'view_users', 'create_user', 'edit_user',           // Can manage users but not delete
          'view_companies', 'edit_company',                   // Can view and edit companies
          'view_campaigns', 'create_campaign', 'edit_campaign', 'assign_campaign',
          'view_roles'                                        // Can view roles
        ] 
      },
      
      // BASIC EMPLOYEE - Read-only access to most data
      { 
        role: 'basic_employee', 
        permissions: [
          'view_users', 'view_companies', 'view_campaigns'    // Read-only access
        ] 
      },
      
      // CLIENT - Campaign management for their own projects
      { 
        role: 'client', 
        permissions: [
          'view_campaigns', 'create_campaign', 'edit_campaign' // Campaign management only
        ] 
      },
      
      // CONTRACTOR - View-only access to assigned work
      { 
        role: 'contractor', 
        permissions: [
          'view_campaigns'                                    // View campaigns only
        ] 
      }
    ];
    
    const rolePermissionData = [];
    rolePermissionMappings.forEach(mapping => {
      mapping.permissions.forEach(permission => {
        rolePermissionData.push({
          role: getRoleId(mapping.role),
          permission: getPermissionId(permission)
        });
      });
    });
    
    await knex('role_permissions').insert(rolePermissionData);
    console.log(`✅ Created ${rolePermissionData.length} role-permission assignments\n`);

    // 5. Create test companies
    console.log('🏢 Creating test companies...');
    const companies = [
      { name: 'TechCorp Inc' },
      { name: 'Marketing Solutions' },
      { name: 'Creative Agency' }
    ];
    
    await knex('companies').insert(companies);
    
    // Get the actual company IDs that were created
    const companyRecords = await knex('companies').select('*').orderBy('id');
    console.log(`✅ Created ${companies.length} companies\n`);

    // 6. Create test users
    console.log('👤 Creating test users...');
    const hashedPassword = await hashPassword('password123');
    
    // Find companies by name to get correct IDs
    const techCorp = companyRecords.find(c => c.name === 'TechCorp Inc');
    const marketingSolutions = companyRecords.find(c => c.name === 'Marketing Solutions');
    const creativeAgency = companyRecords.find(c => c.name === 'Creative Agency');
    
    const testUsers = [
      {
        username: 'superadmin',
        password: hashedPassword,
        company_id: techCorp.id,
        user_type: 'employee',
        role: 'super_admin'
      },
      {
        username: 'admin',
        password: hashedPassword,
        company_id: techCorp.id,
        user_type: 'employee',
        role: 'admin_manager'
      },
      {
        username: 'manager',
        password: hashedPassword,
        company_id: techCorp.id,
        user_type: 'employee',
        role: 'employee'
      },
      {
        username: 'employee1',
        password: hashedPassword,
        company_id: techCorp.id,
        user_type: 'employee',
        role: 'basic_employee'
      },
      {
        username: 'client1',
        password: hashedPassword,
        company_id: marketingSolutions.id,
        user_type: 'client',
        role: 'client'
      },
      {
        username: 'contractor1',
        password: hashedPassword,
        company_id: creativeAgency.id,
        user_type: 'contractor',
        role: 'contractor'
      }
    ];

    // Insert users and assign roles
    for (const user of testUsers) {
      const [userId] = await knex('users').insert({
        username: user.username,
        password: user.password,
        company_id: user.company_id,
        user_type: user.user_type
      });

      // Assign role
      await knex('user_roles').insert({
        user: userId,
        role: getRoleId(user.role)
      });
    }
    
    console.log(`✅ Created ${testUsers.length} test users\n`);

    // 7. Create sample campaigns
    console.log('📋 Creating sample campaigns...');
    const campaigns = [
      {
        name: 'Summer Campaign 2025',
        description: 'Promotional campaign for summer products',
        start_date: new Date('2025-06-01'),
        end_date: new Date('2025-08-31'),
        status: 'pending',
        company_id: marketingSolutions.id
      },
      {
        name: 'Product Launch',
        description: 'New product launch campaign',
        start_date: new Date('2025-09-01'),
        end_date: new Date('2025-10-31'),
        status: 'pending',
        company_id: creativeAgency.id
      }
    ];
    
    await knex('campaigns').insert(campaigns);
    console.log(`✅ Created ${campaigns.length} sample campaigns\n`);

    console.log('🎉 Database setup complete!\n');
    console.log('📊 Summary:');
    console.log(`   • ${roles.length} roles created`);
    console.log(`   • ${permissions.length} permissions created`);
    console.log(`   • ${rolePermissionData.length} role-permission assignments`);
    console.log(`   • ${companies.length} test companies`);
    console.log(`   • ${testUsers.length} test users`);
    console.log(`   • ${campaigns.length} sample campaigns`);
    console.log('\n🔑 Test Logins:');
    console.log('   👑 SUPER ADMIN:');
    console.log('      Username: superadmin');
    console.log('      Password: password123');
    console.log('      Access: Full system control');
    console.log('   🛡️  ADMIN MANAGER:');
    console.log('      Username: admin');
    console.log('      Password: password123');
    console.log('      Access: Limited admin controls');
    console.log('   👨‍💼 EMPLOYEE:');
    console.log('      Username: manager');
    console.log('      Password: password123');
    console.log('      Access: Standard business operations');
    console.log('   👤 BASIC EMPLOYEE:');
    console.log('      Username: employee1');
    console.log('      Password: password123');
    console.log('      Access: Read-only');
    console.log('\n✅ Setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
  
  process.exit(0);
}

setupDatabase();
