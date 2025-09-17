#!/usr/bin/env tsx

import { seedCompaniesAndDepartments } from '@/lib/seedCompaniesAndDepartments';
import { seedQuestionBank } from '@/lib/seedQuestionBank';
import { seedMicroclimateTemplates } from '@/lib/seedMicroclimateTemplates';
import { seedActionPlanTemplates } from '@/lib/seedActionPlanTemplates';
import { seedBenchmarks } from '@/lib/seedBenchmarks';
import { seedNotificationTemplates } from '@/lib/seedNotificationTemplates';

async function seedAll() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    // 1. Seed companies and departments first (foundational data)
    console.log('1️⃣ Seeding companies and departments...');
    await seedCompaniesAndDepartments();
    console.log('✅ Companies and departments seeded\n');

    // 2. Seed question bank
    console.log('2️⃣ Seeding question bank...');
    await seedQuestionBank();
    console.log('✅ Question bank seeded\n');

    // 3. Seed microclimate templates
    console.log('3️⃣ Seeding microclimate templates...');
    await seedMicroclimateTemplates();
    console.log('✅ Microclimate templates seeded\n');

    // 4. Seed action plan templates
    console.log('4️⃣ Seeding action plan templates...');
    await seedActionPlanTemplates();
    console.log('✅ Action plan templates seeded\n');

    // 5. Seed benchmarks
    console.log('5️⃣ Seeding benchmarks...');
    await seedBenchmarks();
    console.log('✅ Benchmarks seeded\n');

    // 6. Seed notification templates
    console.log('6️⃣ Seeding notification templates...');
    await seedNotificationTemplates();
    console.log('✅ Notification templates seeded\n');

    console.log('🎉 All seeding completed successfully!');
    console.log('\n📊 Database is now ready with:');
    console.log('   • Sample companies and departments');
    console.log('   • Comprehensive question bank');
    console.log('   • Microclimate templates');
    console.log('   • Action plan templates');
    console.log('   • Industry benchmarks');
    console.log('   • Notification templates');
    console.log('\n✨ You can now create microclimates with proper department targeting!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('\n🏁 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedAll };
