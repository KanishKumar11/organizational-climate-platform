import { migrateDepartments } from '../lib/seedCompaniesAndDepartments';

async function main() {
  try {
    console.log('Starting department migration...');
    await migrateDepartments();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
