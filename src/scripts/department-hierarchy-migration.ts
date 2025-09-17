import { connectDB } from '@/lib/db';
import Department from '@/models/Department';
import User from '@/models/User';
import Company from '@/models/Company';

interface DepartmentMigrationData {
  companyId: string;
  departments: Array<{
    name: string;
    description?: string;
    parent?: string; // Name of parent department
    existingId?: string; // If updating existing department
  }>;
}

interface HierarchyRestructureData {
  companyId: string;
  moves: Array<{
    departmentName: string;
    newParent?: string; // null for root level
  }>;
}

export async function migrateDepartmentHierarchy(
  data: DepartmentMigrationData
) {
  try {
    await connectDB();

    console.log(
      `🏗️ Starting department hierarchy migration for company: ${data.companyId}`
    );

    // Verify company exists
    const company = await Company.findById(data.companyId);
    if (!company) {
      throw new Error(`Company not found: ${data.companyId}`);
    }

    // Get existing departments
    const existingDepartments = await Department.find({
      company_id: data.companyId,
      is_active: true,
    });
    const existingDeptMap = new Map(
      existingDepartments.map((d) => [d.name, d])
    );

    console.log(`📋 Found ${existingDepartments.length} existing departments`);

    // Create new department map for tracking
    const departmentMap = new Map<string, any>();
    const departmentsToProcess = [...data.departments];
    const processedDepartments = [];

    // First pass: create/update root departments (no parent)
    for (let i = departmentsToProcess.length - 1; i >= 0; i--) {
      const deptData = departmentsToProcess[i];
      if (!deptData.parent) {
        let department;

        if (existingDeptMap.has(deptData.name)) {
          // Update existing department
          department = await Department.findByIdAndUpdate(
            existingDeptMap.get(deptData.name)!._id,
            {
              description: deptData.description,
              hierarchy: {
                level: 0,
                parent_department_id: null,
              },
              updated_at: new Date(),
            },
            { new: true }
          );
          console.log(`🔄 Updated root department: ${deptData.name}`);
        } else {
          // Create new department
          department = new Department({
            name: deptData.name,
            description: deptData.description,
            company_id: data.companyId,
            is_active: true,
            hierarchy: {
              level: 0,
              parent_department_id: null,
            },
          });
          await department.save();
          console.log(`✅ Created root department: ${deptData.name}`);
        }

        departmentMap.set(deptData.name, department);
        processedDepartments.push(department);
        departmentsToProcess.splice(i, 1);
      }
    }

    // Subsequent passes: create/update child departments
    let maxIterations = 10;
    while (departmentsToProcess.length > 0 && maxIterations > 0) {
      let processedInThisPass = 0;

      for (let i = departmentsToProcess.length - 1; i >= 0; i--) {
        const deptData = departmentsToProcess[i];
        const parentDept =
          departmentMap.get(deptData.parent!) ||
          existingDeptMap.get(deptData.parent!);

        if (parentDept) {
          let department;

          if (existingDeptMap.has(deptData.name)) {
            // Update existing department
            department = await Department.findByIdAndUpdate(
              existingDeptMap.get(deptData.name)!._id,
              {
                description: deptData.description,
                hierarchy: {
                  level: parentDept.hierarchy.level + 1,
                  parent_department_id: parentDept._id,
                },
                updated_at: new Date(),
              },
              { new: true }
            );
            console.log(
              `🔄 Updated child department: ${deptData.name} (parent: ${deptData.parent})`
            );
          } else {
            // Create new department
            department = new Department({
              name: deptData.name,
              description: deptData.description,
              company_id: data.companyId,
              is_active: true,
              hierarchy: {
                level: parentDept.hierarchy.level + 1,
                parent_department_id: parentDept._id,
              },
            });
            await department.save();
            console.log(
              `✅ Created child department: ${deptData.name} (parent: ${deptData.parent})`
            );
          }

          departmentMap.set(deptData.name, department);
          processedDepartments.push(department);
          departmentsToProcess.splice(i, 1);
          processedInThisPass++;
        }
      }

      if (processedInThisPass === 0) {
        console.warn(
          `⚠️ Could not process remaining departments: ${departmentsToProcess.map((d) => d.name).join(', ')}`
        );
        break;
      }

      maxIterations--;
    }

    console.log(`✅ Department hierarchy migration completed`);
    console.log(`📊 Processed ${processedDepartments.length} departments`);

    return {
      success: true,
      processedDepartments,
      remainingDepartments: departmentsToProcess,
    };
  } catch (error) {
    console.error('❌ Error during department hierarchy migration:', error);
    throw error;
  }
}

export async function restructureDepartmentHierarchy(
  data: HierarchyRestructureData
) {
  try {
    await connectDB();

    console.log(
      `🔄 Starting department hierarchy restructure for company: ${data.companyId}`
    );

    // Get all departments for the company
    const departments = await Department.find({
      company_id: data.companyId,
      is_active: true,
    });
    const deptMap = new Map(departments.map((d) => [d.name, d]));

    console.log(
      `📋 Found ${departments.length} departments to potentially restructure`
    );

    const movedDepartments = [];

    for (const move of data.moves) {
      const department = deptMap.get(move.departmentName);
      if (!department) {
        console.warn(`⚠️ Department not found: ${move.departmentName}`);
        continue;
      }

      let newParentId = null;
      let newLevel = 0;

      if (move.newParent) {
        const newParent = deptMap.get(move.newParent);
        if (!newParent) {
          console.warn(`⚠️ New parent department not found: ${move.newParent}`);
          continue;
        }
        newParentId = newParent._id;
        newLevel = newParent.hierarchy.level + 1;
      }

      // Update the department
      const updatedDepartment = await Department.findByIdAndUpdate(
        department._id,
        {
          hierarchy: {
            level: newLevel,
            parent_department_id: newParentId,
          },
          updated_at: new Date(),
        },
        { new: true }
      );

      movedDepartments.push(updatedDepartment);
      console.log(
        `🔄 Moved ${move.departmentName} to ${move.newParent || 'root level'}`
      );

      // Update all child departments recursively
      await updateChildDepartmentLevels(department._id as string, newLevel);
    }

    console.log(`✅ Department hierarchy restructure completed`);
    console.log(`📊 Moved ${movedDepartments.length} departments`);

    return {
      success: true,
      movedDepartments,
    };
  } catch (error) {
    console.error('❌ Error during department hierarchy restructure:', error);
    throw error;
  }
}

async function updateChildDepartmentLevels(
  parentId: string,
  parentLevel: number
) {
  const childDepartments = await Department.find({
    'hierarchy.parent_department_id': parentId,
    is_active: true,
  });

  for (const child of childDepartments) {
    const newLevel = parentLevel + 1;
    await Department.findByIdAndUpdate(child._id, {
      'hierarchy.level': newLevel,
      updated_at: new Date(),
    });

    console.log(
      `  🔄 Updated child department level: ${child.name} (level ${newLevel})`
    );

    // Recursively update grandchildren
    await updateChildDepartmentLevels(child._id.toString(), newLevel);
  }
}

export async function validateDepartmentHierarchy(companyId: string) {
  try {
    await connectDB();

    console.log(`🔍 Validating department hierarchy for company: ${companyId}`);

    const departments = await Department.find({
      company_id: companyId,
      is_active: true,
    });

    const issues = [];

    for (const dept of departments) {
      // Check if parent exists (if specified)
      if (dept.hierarchy.parent_department_id) {
        const parent = await Department.findById(
          dept.hierarchy.parent_department_id
        );
        if (!parent || !parent.is_active) {
          issues.push(`Department "${dept.name}" has invalid parent reference`);
        } else if (parent.hierarchy.level !== dept.hierarchy.level - 1) {
          issues.push(
            `Department "${dept.name}" has incorrect level (should be ${parent.hierarchy.level + 1})`
          );
        }
      } else if (dept.hierarchy.level !== 0) {
        issues.push(`Root department "${dept.name}" should have level 0`);
      }

      // Check for circular references
      const visited = new Set();
      let current = dept;
      while (
        current.hierarchy.parent_department_id &&
        !visited.has(current._id.toString())
      ) {
        visited.add(current._id.toString());
        current = await Department.findById(
          current.hierarchy.parent_department_id
        );
        if (!current) break;
      }
      if (current && visited.has(current._id.toString())) {
        issues.push(
          `Circular reference detected in hierarchy for department "${dept.name}"`
        );
      }
    }

    if (issues.length === 0) {
      console.log(`✅ Department hierarchy is valid`);
    } else {
      console.log(`❌ Found ${issues.length} hierarchy issues:`);
      issues.forEach((issue) => console.log(`  - ${issue}`));
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  } catch (error) {
    console.error('❌ Error validating department hierarchy:', error);
    throw error;
  }
}

// CLI execution examples
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'validate') {
    const companyId = process.argv[3];
    if (!companyId) {
      console.error('Usage: npm run migrate:departments validate <companyId>');
      process.exit(1);
    }

    validateDepartmentHierarchy(companyId)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Available commands:');
    console.log('  validate <companyId> - Validate department hierarchy');
    process.exit(1);
  }
}
