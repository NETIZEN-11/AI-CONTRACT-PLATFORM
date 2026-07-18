import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create permissions
  const permissions = [
    // Contract permissions
    {
      name: 'contracts:create',
      resource: 'contracts',
      action: 'create',
      description: 'Create contracts',
    },
    {
      name: 'contracts:read',
      resource: 'contracts',
      action: 'read',
      description: 'Read contracts',
    },
    {
      name: 'contracts:update',
      resource: 'contracts',
      action: 'update',
      description: 'Update contracts',
    },
    {
      name: 'contracts:delete',
      resource: 'contracts',
      action: 'delete',
      description: 'Delete contracts',
    },
    {
      name: 'contracts:export',
      resource: 'contracts',
      action: 'export',
      description: 'Export contracts',
    },

    // User permissions
    { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
    { name: 'users:read', resource: 'users', action: 'read', description: 'Read users' },
    { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },

    // Review permissions
    {
      name: 'reviews:create',
      resource: 'reviews',
      action: 'create',
      description: 'Create reviews',
    },
    { name: 'reviews:read', resource: 'reviews', action: 'read', description: 'Read reviews' },
    {
      name: 'reviews:update',
      resource: 'reviews',
      action: 'update',
      description: 'Update reviews',
    },
    {
      name: 'reviews:delete',
      resource: 'reviews',
      action: 'delete',
      description: 'Delete reviews',
    },
    {
      name: 'reviews:approve',
      resource: 'reviews',
      action: 'approve',
      description: 'Approve reviews',
    },

    // Analytics permissions
    {
      name: 'analytics:read',
      resource: 'analytics',
      action: 'read',
      description: 'View analytics',
    },
    {
      name: 'analytics:export',
      resource: 'analytics',
      action: 'export',
      description: 'Export analytics',
    },

    // Organization permissions
    {
      name: 'organization:manage',
      resource: 'organization',
      action: 'manage',
      description: 'Manage organization',
    },
    {
      name: 'organization:settings',
      resource: 'organization',
      action: 'settings',
      description: 'Manage settings',
    },

    // Workflow permissions
    {
      name: 'workflows:create',
      resource: 'workflows',
      action: 'create',
      description: 'Create workflows',
    },
    {
      name: 'workflows:manage',
      resource: 'workflows',
      action: 'manage',
      description: 'Manage workflows',
    },
  ];

  console.log('📝 Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // Define role-permission mappings
  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: [
      'contracts:create',
      'contracts:read',
      'contracts:update',
      'contracts:delete',
      'contracts:export',
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'reviews:create',
      'reviews:read',
      'reviews:update',
      'reviews:delete',
      'reviews:approve',
      'analytics:read',
      'analytics:export',
      'organization:manage',
      'organization:settings',
      'workflows:create',
      'workflows:manage',
    ],
    [UserRole.LEGAL_MANAGER]: [
      'contracts:create',
      'contracts:read',
      'contracts:update',
      'contracts:export',
      'users:read',
      'reviews:create',
      'reviews:read',
      'reviews:update',
      'reviews:approve',
      'analytics:read',
      'analytics:export',
      'workflows:create',
      'workflows:manage',
    ],
    [UserRole.LAWYER]: [
      'contracts:create',
      'contracts:read',
      'contracts:update',
      'users:read',
      'reviews:create',
      'reviews:read',
      'reviews:update',
      'analytics:read',
    ],
    [UserRole.PROCUREMENT]: [
      'contracts:create',
      'contracts:read',
      'reviews:read',
      'analytics:read',
    ],
    [UserRole.HR]: ['contracts:create', 'contracts:read', 'reviews:read', 'analytics:read'],
    [UserRole.FINANCE]: [
      'contracts:create',
      'contracts:read',
      'reviews:read',
      'analytics:read',
      'analytics:export',
    ],
    [UserRole.COMPLIANCE_OFFICER]: [
      'contracts:read',
      'contracts:export',
      'reviews:read',
      'reviews:approve',
      'analytics:read',
      'analytics:export',
    ],
    [UserRole.EXTERNAL_CLIENT]: ['contracts:read', 'reviews:read'],
  };

  console.log('🔐 Assigning permissions to roles...');
  for (const [role, permissionNames] of Object.entries(rolePermissions)) {
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role as UserRole,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            role: role as UserRole,
            permissionId: permission.id,
          },
        });
      }
    }
  }
  console.log('✅ Role permissions assigned');

  // Create demo organization
  console.log('🏢 Creating demo organization...');
  const organization = await prisma.organization.upsert({
    where: { id: 'demo-org-001' },
    update: {},
    create: {
      id: 'demo-org-001',
      name: 'Demo Corporation',
      description: 'A demo organization for testing',
      industry: 'Technology',
      country: 'United States',
      timezone: 'America/New_York',
    },
  });
  console.log(`✅ Created organization: ${organization.name}`);

  // Create demo team
  console.log('👥 Creating demo team...');
  const team = await prisma.team.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'Legal Team',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Legal Team',
      description: 'Main legal team',
    },
  });
  console.log(`✅ Created team: ${team.name}`);

  // Create demo admin user
  console.log('👤 Creating demo admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Admin User',
      hashedPassword,
      role: UserRole.ADMIN,
      organizationId: organization.id,
      teamId: team.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create demo lawyer user
  console.log('👤 Creating demo lawyer user...');
  const lawyerPassword = await bcrypt.hash('Lawyer123!', 12);
  const lawyerUser = await prisma.user.upsert({
    where: { email: 'lawyer@demo.com' },
    update: {},
    create: {
      email: 'lawyer@demo.com',
      name: 'John Lawyer',
      hashedPassword: lawyerPassword,
      role: UserRole.LAWYER,
      organizationId: organization.id,
      teamId: team.id,
      emailVerified: new Date(),
      isActive: true,
    },
  });
  console.log(`✅ Created lawyer user: ${lawyerUser.email}`);

  console.log('\n🎉 Database seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin: admin@demo.com / Admin123!');
  console.log('   Lawyer: lawyer@demo.com / Lawyer123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
