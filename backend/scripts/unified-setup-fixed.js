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
      { name: 'employee', description: 'Employee' },
      { name: 'client', description: 'Client' },
      { name: 'contractor', description: 'Contractor' },
      { name: 'limited_employee', description: 'Limited Employee' },
      { name: 'basic_employee', description: 'Basic Employee' }
    ];
    await knex('roles').insert(roles);
    console.log(`✅ Created ${roles.length} roles\n`);

    // 2. Insert Permissions
    console.log('🔐 Creating permissions...');
    const permissions = [
      // User management
      { permission: 'view_users', description: 'View Users' },
      { permission: 'create_user', description: 'Create Users' },
      { permission: 'edit_user', description: 'Edit Users' },
      { permission: 'delete_user', description: 'Delete Users' },
      
      // Company management
      { permission: 'view_companies', description: 'View Companies' },
      { permission: 'create_company', description: 'Create Companies' },
      { permission: 'edit_company', description: 'Edit Companies' },
      { permission: 'delete_company', description: 'Delete Companies' },
      
      // Campaign management
      { permission: 'view_campaigns', description: 'View Campaigns' },
      { permission: 'create_campaign', description: 'Create Campaigns' },
      { permission: 'edit_campaign', description: 'Edit Campaigns' },
      { permission: 'delete_campaign', description: 'Delete Campaigns' },
      { permission: 'assign_campaign', description: 'Assign Campaigns' },
      
      // Role management
      { permission: 'manage_roles', description: 'Manage Roles' },
      { permission: 'view_roles', description: 'View Roles' },
      
      // System
      { permission: 'system_admin', description: 'System Administration' },
      { permission: 'view_reports', description: 'View Reports' }
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
      // Employee - full access
      { role: 'employee', permissions: ['view_users', 'create_user', 'edit_user', 'delete_user', 'view_companies', 'create_company', 'edit_company', 'delete_company', 'view_campaigns', 'create_campaign', 'edit_campaign', 'delete_campaign', 'assign_campaign', 'manage_roles', 'view_roles', 'system_admin', 'view_reports'] },
      
      // Client - campaign management only
      { role: 'client', permissions: ['view_campaigns', 'create_campaign', 'edit_campaign'] },
      
      // Contractor - view only
      { role: 'contractor', permissions: ['view_campaigns'] },
      
      // Limited employee - no delete permissions
      { role: 'limited_employee', permissions: ['view_users', 'create_user', 'edit_user', 'view_companies', 'create_company', 'edit_company', 'view_campaigns', 'create_campaign', 'edit_campaign', 'assign_campaign', 'view_roles'] },
      
      // Basic employee - read only
      { role: 'basic_employee', permissions: ['view_users', 'view_companies', 'view_campaigns'] }
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
        username: 'admin',
        password: hashedPassword,
        company_id: techCorp.id,
        user_type: 'employee',
        role: 'employee'
      },
      {
        username: 'manager',
        password: hashedPassword,
        company_id: techCorp.id,
        user_type: 'employee',
        role: 'limited_employee'
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
        company_id: techCorp.id,
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
    console.log('\n🔑 Test Login:');
    console.log('   Username: admin');
    console.log('   Password: password123\n');
    console.log('✅ Setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
  
  process.exit(0);
}

setupDatabase();
