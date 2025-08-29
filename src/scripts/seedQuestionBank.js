const { seedQuestionBank } = require('../lib/seedQuestionBank.ts');

async function runSeed() {
  try {
    console.log('Starting question bank seeding...');
    await seedQuestionBank();
    console.log('Question bank seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding question bank:', error);
    process.exit(1);
  }
}

runSeed();