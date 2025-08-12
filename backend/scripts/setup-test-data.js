// Reset and create test data with specific permission scenarios
// This script will:
// 1. Clear all existing data
// 2. Create test users with password '123456'
// 3. Set up different employee permission levels
// 4. Create realistic test scenarios

const knex = require('../config/knex');
const { hashPassword } = require('../services/authService');

async function resetAndCreateTestData() {
  try {
    console.log('🧹 Clearing all existing data...');
    
    // Disable foreign key checks temporarily to avoid constraint issues
    await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clear all data in proper order
    await knex('campaign_assignments').del();
    await knex('campaign_images').del();
    await knex('campaigns').del();
    await knex('permission_functions').del();
    await knex('role_permissions').del();
    await knex('user_roles').del();
    await knex('users').del();
    await knex('companies').del();
    
    // Re-enable foreign key checks
    await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ All data cleared');
    
    console.log('🏢 Creating test companies...');
    
    // Create test companies
    const companies = [
      { name: 'TechCorp Inc' },
      { name: 'Marketing Solutions' },
      { name: 'Creative Agency' }
    ];
    
    const companyIds = [];
    for (const company of companies) {
      const [companyId] = await knex('companies').insert(company);
      companyIds.push(companyId);
    }
    
    console.log('👥 Creating test users...');
    
    // Hash the standard password
    const standardPassword = await hashPassword('123456');
    
    // Create test users with different roles and permissions
    const testUsers = [
      // ADMIN EMPLOYEE - Can do everything
      { 
        username: 'admin', 
        password: standardPassword, 
        company_id: companyIds[0], // TechCorp Inc
        roles: ['employee'],
        description: 'Super admin - can do everything'
      },
      
      // LIMITED EMPLOYEE - Cannot change passwords or delete users
      { 
        username: 'manager', 
        password: standardPassword, 
        company_id: companyIds[0], // TechCorp Inc
        roles: ['limited_employee'],
        description: 'Manager - can manage users but not passwords/deletions'
      },
      
      // REGULAR EMPLOYEE - Basic employee permissions
      { 
        username: 'employee1', 
        password: standardPassword, 
        company_id: companyIds[0], // TechCorp Inc
        roles: ['basic_employee'],
        description: 'Basic employee - limited permissions'
      },
      
      // CLIENT USERS
      { 
        username: 'client1', 
        password: standardPassword, 
        company_id: companyIds[1], // Marketing Solutions
        roles: ['client'],
        description: 'Client user - can manage own campaigns'
      },
      { 
        username: 'client2', 
        password: standardPassword, 
        company_id: companyIds[2], // Creative Agency
        roles: ['client'],
        description: 'Another client user'
      },
      
      // CONTRACTOR USERS
      { 
        username: 'contractor1', 
        password: standardPassword, 
        company_id: companyIds[0], // TechCorp Inc
        roles: ['contractor'],
        description: 'Contractor - works on assigned campaigns'
      },
      { 
        username: 'contractor2', 
        password: standardPassword, 
        company_id: companyIds[0], // TechCorp Inc
        roles: ['contractor'],
        description: 'Another contractor'
      }
    ];
    
    // Insert users and store their IDs with role info
    const userRoleAssignments = [];
    for (const user of testUsers) {
      const [userId] = await knex('users').insert({
        username: user.username,
        password: user.password,
        company_id: user.company_id
      });
      
      // Store role assignments for later
      for (const role of user.roles) {
        userRoleAssignments.push({
          user_id: userId,
          role_name: role,
          is_active: true
        });
      }
      
      console.log(`  ✓ Created user: ${user.username} (${user.description})`);
    }
    
    console.log('🎭 Setting up roles and permissions...');
    
    // Define role permissions with granular control
    const rolePermissions = [
      // ADMIN EMPLOYEE - Full permissions
      { role_name: 'employee', permission_name: 'users.read' },
      { role_name: 'employee', permission_name: 'users.create' },
      { role_name: 'employee', permission_name: 'users.update' },
      { role_name: 'employee', permission_name: 'users.delete' },
      { role_name: 'employee', permission_name: 'users.change_password' },
      { role_name: 'employee', permission_name: 'companies.read' },
      { role_name: 'employee', permission_name: 'companies.create' },
      { role_name: 'employee', permission_name: 'companies.update' },
      { role_name: 'employee', permission_name: 'companies.delete' },
      { role_name: 'employee', permission_name: 'campaigns.read' },
      { role_name: 'employee', permission_name: 'campaigns.create' },
      { role_name: 'employee', permission_name: 'campaigns.update' },
      { role_name: 'employee', permission_name: 'campaigns.delete' },
      { role_name: 'employee', permission_name: 'campaigns.assign' },
      { role_name: 'employee', permission_name: 'campaign_images.read' },
      { role_name: 'employee', permission_name: 'campaign_images.upload' },
      { role_name: 'employee', permission_name: 'campaign_images.review' },
      { role_name: 'employee', permission_name: 'campaign_images.delete' },
      { role_name: 'employee', permission_name: 'roles.read' },
      { role_name: 'employee', permission_name: 'roles.create' },
      { role_name: 'employee', permission_name: 'roles.update' },
      { role_name: 'employee', permission_name: 'roles.delete' },
      
      // LIMITED EMPLOYEE - Cannot change passwords or delete users
      { role_name: 'limited_employee', permission_name: 'users.read' },
      { role_name: 'limited_employee', permission_name: 'users.create' },
      { role_name: 'limited_employee', permission_name: 'users.update' },
      // NO users.delete or users.change_password
      { role_name: 'limited_employee', permission_name: 'companies.read' },
      { role_name: 'limited_employee', permission_name: 'companies.create' },
      { role_name: 'limited_employee', permission_name: 'companies.update' },
      { role_name: 'limited_employee', permission_name: 'campaigns.read' },
      { role_name: 'limited_employee', permission_name: 'campaigns.create' },
      { role_name: 'limited_employee', permission_name: 'campaigns.update' },
      { role_name: 'limited_employee', permission_name: 'campaigns.assign' },
      { role_name: 'limited_employee', permission_name: 'campaign_images.read' },
      { role_name: 'limited_employee', permission_name: 'campaign_images.upload' },
      { role_name: 'limited_employee', permission_name: 'campaign_images.review' },
      { role_name: 'limited_employee', permission_name: 'roles.read' },
      
      // BASIC EMPLOYEE - Very limited permissions
      { role_name: 'basic_employee', permission_name: 'users.read' },
      { role_name: 'basic_employee', permission_name: 'companies.read' },
      { role_name: 'basic_employee', permission_name: 'campaigns.read' },
      { role_name: 'basic_employee', permission_name: 'campaign_images.read' },
      
      // CLIENT - Can manage their own campaigns
      { role_name: 'client', permission_name: 'campaigns.read' },
      { role_name: 'client', permission_name: 'campaigns.create' },
      { role_name: 'client', permission_name: 'campaigns.update' },
      { role_name: 'client', permission_name: 'campaign_images.read' },
      { role_name: 'client', permission_name: 'campaign_images.upload' },
      { role_name: 'client', permission_name: 'campaign_images.review' },
      
      // CONTRACTOR - Can work on assigned campaigns
      { role_name: 'contractor', permission_name: 'campaigns.read' },
      { role_name: 'contractor', permission_name: 'campaign_images.read' },
      { role_name: 'contractor', permission_name: 'campaign_images.upload' }
    ];
    
    // Insert role permissions
    for (const rolePerm of rolePermissions) {
      await knex('role_permissions').insert({
        role_name: rolePerm.role_name,
        permission_name: rolePerm.permission_name,
        is_active: true
      });
    }
    
    console.log('👤 Assigning roles to users...');
    
    // Insert user role assignments
    for (const assignment of userRoleAssignments) {
      await knex('user_roles').insert(assignment);
    }
    
    console.log('⚙️ Setting up permission functions...');
    
    // Create granular permission functions
    const permissionFunctions = [
      // User Management Functions
      { permission_name: 'users.read', function_name: 'view_user_list', description: 'Display list of users', module: 'user_management' },
      { permission_name: 'users.read', function_name: 'view_user_details', description: 'View detailed user information', module: 'user_management' },
      { permission_name: 'users.create', function_name: 'create_user_form', description: 'Show create user form', module: 'user_management' },
      { permission_name: 'users.create', function_name: 'save_new_user', description: 'Save new user to database', module: 'user_management' },
      { permission_name: 'users.update', function_name: 'edit_user_form', description: 'Show edit user form', module: 'user_management' },
      { permission_name: 'users.update', function_name: 'update_user_data', description: 'Update user information in database', module: 'user_management' },
      { permission_name: 'users.delete', function_name: 'delete_user_confirm', description: 'Show delete user confirmation', module: 'user_management' },
      { permission_name: 'users.delete', function_name: 'remove_user_record', description: 'Remove user from database', module: 'user_management' },
      { permission_name: 'users.change_password', function_name: 'change_user_password', description: 'Change user password', module: 'user_management' },
      { permission_name: 'users.change_password', function_name: 'reset_user_password', description: 'Reset user password', module: 'user_management' },
      
      // Company Management Functions
      { permission_name: 'companies.read', function_name: 'view_company_list', description: 'Display list of companies', module: 'company_management' },
      { permission_name: 'companies.read', function_name: 'view_company_details', description: 'View detailed company information', module: 'company_management' },
      { permission_name: 'companies.create', function_name: 'create_company_form', description: 'Show create company form', module: 'company_management' },
      { permission_name: 'companies.create', function_name: 'save_new_company', description: 'Save new company to database', module: 'company_management' },
      { permission_name: 'companies.update', function_name: 'edit_company_form', description: 'Show edit company form', module: 'company_management' },
      { permission_name: 'companies.update', function_name: 'update_company_data', description: 'Update company information in database', module: 'company_management' },
      { permission_name: 'companies.delete', function_name: 'delete_company_confirm', description: 'Show delete company confirmation', module: 'company_management' },
      { permission_name: 'companies.delete', function_name: 'remove_company_record', description: 'Remove company from database', module: 'company_management' },
      
      // Campaign Management Functions
      { permission_name: 'campaigns.read', function_name: 'view_campaign_list', description: 'Display list of campaigns', module: 'campaign_management' },
      { permission_name: 'campaigns.read', function_name: 'view_campaign_details', description: 'View detailed campaign information', module: 'campaign_management' },
      { permission_name: 'campaigns.create', function_name: 'create_campaign_form', description: 'Show create campaign form', module: 'campaign_management' },
      { permission_name: 'campaigns.create', function_name: 'save_new_campaign', description: 'Save new campaign to database', module: 'campaign_management' },
      { permission_name: 'campaigns.update', function_name: 'edit_campaign_form', description: 'Show edit campaign form', module: 'campaign_management' },
      { permission_name: 'campaigns.update', function_name: 'update_campaign_data', description: 'Update campaign information in database', module: 'campaign_management' },
      { permission_name: 'campaigns.delete', function_name: 'delete_campaign_confirm', description: 'Show delete campaign confirmation', module: 'campaign_management' },
      { permission_name: 'campaigns.delete', function_name: 'remove_campaign_record', description: 'Remove campaign from database', module: 'campaign_management' },
      { permission_name: 'campaigns.assign', function_name: 'assign_contractor_to_campaign', description: 'Assign contractors to campaigns', module: 'campaign_management' },
      
      // Campaign Image Functions
      { permission_name: 'campaign_images.read', function_name: 'view_campaign_images', description: 'View campaign images', module: 'campaign_images' },
      { permission_name: 'campaign_images.upload', function_name: 'upload_campaign_image', description: 'Upload new campaign images', module: 'campaign_images' },
      { permission_name: 'campaign_images.review', function_name: 'review_campaign_image', description: 'Review and approve/reject images', module: 'campaign_images' },
      { permission_name: 'campaign_images.delete', function_name: 'delete_campaign_image', description: 'Delete campaign images', module: 'campaign_images' },
      
      // Role Management Functions
      { permission_name: 'roles.read', function_name: 'view_role_list', description: 'Display list of roles', module: 'role_management' },
      { permission_name: 'roles.read', function_name: 'view_role_details', description: 'View detailed role information', module: 'role_management' },
      { permission_name: 'roles.create', function_name: 'create_role_form', description: 'Show create role form', module: 'role_management' },
      { permission_name: 'roles.create', function_name: 'save_new_role', description: 'Save new role to database', module: 'role_management' },
      { permission_name: 'roles.update', function_name: 'edit_role_form', description: 'Show edit role form', module: 'role_management' },
      { permission_name: 'roles.update', function_name: 'update_role_data', description: 'Update role information in database', module: 'role_management' },
      { permission_name: 'roles.delete', function_name: 'delete_role_confirm', description: 'Show delete role confirmation', module: 'role_management' },
      { permission_name: 'roles.delete', function_name: 'remove_role_record', description: 'Remove role from database', module: 'role_management' }
    ];
    
    // Insert permission functions
    for (const func of permissionFunctions) {
      await knex('permission_functions').insert({
        permission_name: func.permission_name,
        function_name: func.function_name,
        description: func.description,
        module: func.module,
        is_active: true
      });
    }
    
    console.log('🎯 Creating test campaigns...');
    
    // Get the admin user ID for created_by field
    const adminUser = await knex('users').where('username', 'admin').first();
    
    // Create some test campaigns (using the actual company IDs)
    const campaigns = [
      {
        name: 'Summer Product Launch',
        description: 'Marketing campaign for new summer product line',
        start_date: '2025-06-01',
        end_date: '2025-08-31',
        company_id: companyIds[1], // Marketing Solutions
        status: 'in_progress',
        created_by: adminUser.id
      },
      {
        name: 'Brand Awareness Q4',
        description: 'Q4 brand awareness campaign across social media',
        start_date: '2025-10-01',
        end_date: '2025-12-31',
        company_id: companyIds[2], // Creative Agency
        status: 'pending',
        created_by: adminUser.id
      }
    ];
    
    for (const campaign of campaigns) {
      await knex('campaigns').insert(campaign);
    }
    
    console.log('🎉 Test environment setup complete!');
    console.log('');
    console.log('=== TEST USERS CREATED ===');
    console.log('All passwords: 123456');
    console.log('');
    console.log('👑 ADMIN (Full Permissions):');
    console.log('  Username: admin');
    console.log('  Role: employee');
    console.log('  Can: Do everything including delete users and change passwords');
    console.log('');
    console.log('👨‍💼 MANAGER (Limited Employee):');
    console.log('  Username: manager');
    console.log('  Role: limited_employee');
    console.log('  Can: Manage users, companies, campaigns BUT cannot delete users or change passwords');
    console.log('');
    console.log('👷 BASIC EMPLOYEE:');
    console.log('  Username: employee1');
    console.log('  Role: basic_employee');
    console.log('  Can: Only read/view data, no modifications');
    console.log('');
    console.log('🏢 CLIENTS:');
    console.log('  Username: client1, client2');
    console.log('  Role: client');
    console.log('  Can: Manage their own campaigns and images');
    console.log('');
    console.log('🔨 CONTRACTORS:');
    console.log('  Username: contractor1, contractor2');
    console.log('  Role: contractor');
    console.log('  Can: Work on assigned campaigns, upload images');
    console.log('');
    console.log('🚀 Ready to test! Try logging in with different users to see permission differences.');
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

module.exports = { resetAndCreateTestData };

// Run if called directly
if (require.main === module) {
  resetAndCreateTestData()
    .then(() => {
      console.log('✅ Test data setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to setup test data:', error);
      process.exit(1);
    });
}
