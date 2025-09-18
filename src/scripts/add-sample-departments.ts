#!/usr/bin/env tsx

import { connectDB } from '@/lib/mongodb';
import Department from '@/models/Department';
import Company from '@/models/Company';
import User from '@/models/User';

interface DepartmentData {
  name: string;
  description?: string;
  parent?: string; // Name of parent department
}

// Sample departments that can be added to any company
const sampleDepartments: DepartmentData[] = [
  // Root level departments
  {
    name: 'Engineering',
    description: 'Software development and technical operations'
  },
  {
    name: 'Product Management',
    description: 'Product strategy and roadmap planning'
  },
  {
    name: 'Design',
    description: 'User experience and visual design'
  },
  {
    name: 'Marketing',
    description: 'Marketing and brand management'
  },
  {
    name: 'Sales',
    description: 'Sales and business development'
  },
  {
    name: 'Human Resources',
    description: 'People operations and talent management'
  },
  {
    name: 'Finance',
    description: 'Financial planning and accounting'
  },
  {
    name: 'Operations',
    description: 'Business operations and support'
  },

  // Engineering sub-departments
  {
    name: 'Frontend Development',
    description: 'User interface and web development',
    parent: 'Engineering'
  },
  {
    name: 'Backend Development',
    description: 'Server-side development and APIs',
    parent: 'Engineering'
  },
  {
    name: 'DevOps & Infrastructure',
    description: 'Infrastructure and deployment automation',
    parent: 'Engineering'
  },
  {
    name: 'Quality Assurance',
    description: 'Testing and quality control',
    parent: 'Engineering'
  },

  // Product sub-departments
  {
    name: 'Product Strategy',
    description: 'Long-term product planning and vision',
    parent: 'Product Management'
  },
  {
    name: 'Product Analytics',
    description: 'Data analysis and user insights',
    parent: 'Product Management'
  },

  // Design sub-departments
  {
    name: 'UX Design',
    description: 'User experience research and design',
    parent: 'Design'
  },
  {
    name: 'Visual Design',
    description: 'Brand and visual design',
    parent: 'Design'
  },

  // Marketing sub-departments
  {
    name: 'Digital Marketing',
    description: 'Online marketing and campaigns',
    parent: 'Marketing'
  },
  {
    name: 'Content Marketing',
    description: 'Content creation and strategy',
    parent: 'Marketing'
  },

  // Sales sub-departments
  {
    name: 'Inside Sales',
    description: 'Inbound sales and lead qualification',
    parent: 'Sales'
  },
  {
    name: 'Enterprise Sales',
    description: 'Large account and enterprise sales',
    parent: 'Sales'
  }
];

async function addSampleDepartments(companyId?: string, companyName?: string) {
  console.log('🏢 Adding Sample Departments...\n');

  try {
    await connectDB();

    let targetCompany;

    if (companyId) {
      targetCompany = await Company.findById(companyId);
      if (!targetCompany) {
        console.error(`❌ Company with ID ${companyId} not found`);
        return;
      }
    } else if (companyName) {
      targetCompany = await Company.findOne({ name: companyName });
      if (!targetCompany) {
        console.error(`❌ Company with name "${companyName}" not found`);
        return;
      }
    } else {
      // Find the first company
      targetCompany = await Company.findOne();
      if (!targetCompany) {
        console.error('❌ No companies found. Please create a company first.');
        return;
      }
    }

    console.log(`🎯 Target Company: ${targetCompany.name} (${targetCompany._id})`);

    // Check existing departments
    const existingDepartments = await Department.find({
      company_id: targetCompany._id.toString(),
      is_active: true
    });

    console.log(`📋 Existing departments: ${existingDepartments.length}`);
    if (existingDepartments.length > 0) {
      console.log('   Existing departments:');
      existingDepartments.forEach((dept, index) => {
        console.log(`   ${index + 1}. ${dept.name}`);
      });
    }

    // Create departments
    const departmentMap = new Map<string, any>();
    const createdDepartments: any[] = [];

    // First pass: create root departments (no parent)
    console.log('\n🌱 Creating root departments...');
    for (const deptData of sampleDepartments) {
      if (!deptData.parent) {
        // Check if department already exists
        const existing = existingDepartments.find(d => d.name === deptData.name);
        if (existing) {
          console.log(`   ⏭️  ${deptData.name} already exists, skipping`);
          departmentMap.set(deptData.name, existing);
          continue;
        }

        const department = new Department({
          name: deptData.name,
          description: deptData.description,
          company_id: targetCompany._id.toString(),
          is_active: true,
          hierarchy: {
            level: 0,
            parent_department_id: null,
          },
        });

        await department.save();
        departmentMap.set(deptData.name, department);
        createdDepartments.push(department);
        console.log(`   ✅ Created: ${deptData.name}`);
      }
    }

    // Second pass: create child departments
    console.log('\n🌿 Creating child departments...');
    for (const deptData of sampleDepartments) {
      if (deptData.parent) {
        // Check if department already exists
        const existing = existingDepartments.find(d => d.name === deptData.name);
        if (existing) {
          console.log(`   ⏭️  ${deptData.name} already exists, skipping`);
          continue;
        }

        const parentDept = departmentMap.get(deptData.parent);
        if (!parentDept) {
          console.log(`   ⚠️  Parent department "${deptData.parent}" not found for ${deptData.name}, skipping`);
          continue;
        }

        const department = new Department({
          name: deptData.name,
          description: deptData.description,
          company_id: targetCompany._id.toString(),
          is_active: true,
          hierarchy: {
            level: parentDept.hierarchy.level + 1,
            parent_department_id: parentDept._id.toString(),
          },
        });

        await department.save();
        departmentMap.set(deptData.name, department);
        createdDepartments.push(department);
        console.log(`   ✅ Created: ${deptData.name} (parent: ${deptData.parent})`);
      }
    }

    console.log(`\n🎉 Successfully created ${createdDepartments.length} new departments!`);
    
    // Show final department count
    const finalDepartments = await Department.find({
      company_id: targetCompany._id.toString(),
      is_active: true
    }).sort({ 'hierarchy.level': 1, name: 1 });

    console.log(`\n📊 Final department structure for ${targetCompany.name}:`);
    finalDepartments.forEach((dept, index) => {
      const indent = '  '.repeat(dept.hierarchy.level);
      console.log(`   ${index + 1}. ${indent}${dept.name} (Level ${dept.hierarchy.level})`);
    });

    console.log('\n✨ Departments are now ready for microclimate targeting!');

  } catch (error) {
    console.error('❌ Error adding sample departments:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const companyId = process.argv[2];
  const companyName = process.argv[3];

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage:');
    console.log('  npm run add:departments                    # Add to first company found');
    console.log('  npm run add:departments <companyId>        # Add to specific company by ID');
    console.log('  npm run add:departments <companyId> <name> # Add to company by name');
    process.exit(0);
  }

  addSampleDepartments(companyId, companyName)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to add departments:', error);
      process.exit(1);
    });
}

export { addSampleDepartments };
