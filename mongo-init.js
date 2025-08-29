// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('organizational_climate');

// Create collections with indexes for better performance
db.createCollection('users');
db.createCollection('companies');
db.createCollection('departments');
db.createCollection('surveys');
db.createCollection('responses');
db.createCollection('microclimates');
db.createCollection('reports');
db.createCollection('benchmarks');
db.createCollection('actionplans');
db.createCollection('aiinsights');

// Create indexes for better query performance

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "company_id": 1 });
db.users.createIndex({ "department_id": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "status": 1 });

// Companies collection indexes
db.companies.createIndex({ "name": 1 });
db.companies.createIndex({ "industry": 1 });
db.companies.createIndex({ "size": 1 });

// Departments collection indexes
db.departments.createIndex({ "company_id": 1 });
db.departments.createIndex({ "name": 1, "company_id": 1 });

// Surveys collection indexes
db.surveys.createIndex({ "company_id": 1 });
db.surveys.createIndex({ "status": 1 });
db.surveys.createIndex({ "created_at": -1 });
db.surveys.createIndex({ "start_date": 1, "end_date": 1 });

// Responses collection indexes
db.responses.createIndex({ "survey_id": 1 });
db.responses.createIndex({ "user_id": 1 });
db.responses.createIndex({ "company_id": 1 });
db.responses.createIndex({ "department_id": 1 });
db.responses.createIndex({ "created_at": -1 });
db.responses.createIndex({ "survey_id": 1, "user_id": 1 });

// Microclimates collection indexes
db.microclimates.createIndex({ "company_id": 1 });
db.microclimates.createIndex({ "status": 1 });
db.microclimates.createIndex({ "target_departments": 1 });
db.microclimates.createIndex({ "created_at": -1 });

// Reports collection indexes
db.reports.createIndex({ "company_id": 1 });
db.reports.createIndex({ "type": 1 });
db.reports.createIndex({ "created_at": -1 });
db.reports.createIndex({ "shared_token": 1 }, { sparse: true });

// Benchmarks collection indexes
db.benchmarks.createIndex({ "industry": 1 });
db.benchmarks.createIndex({ "company_size": 1 });
db.benchmarks.createIndex({ "category": 1 });
db.benchmarks.createIndex({ "is_active": 1 });

// Action plans collection indexes
db.actionplans.createIndex({ "company_id": 1 });
db.actionplans.createIndex({ "assigned_to": 1 });
db.actionplans.createIndex({ "status": 1 });
db.actionplans.createIndex({ "due_date": 1 });
db.actionplans.createIndex({ "created_at": -1 });

// AI insights collection indexes
db.aiinsights.createIndex({ "company_id": 1 });
db.aiinsights.createIndex({ "type": 1 });
db.aiinsights.createIndex({ "created_at": -1 });
db.aiinsights.createIndex({ "confidence_score": -1 });

print('Database initialized with collections and indexes');

// Create a default admin user (optional - remove in production)
// db.users.insertOne({
//   email: 'admin@example.com',
//   name: 'System Administrator',
//   role: 'super_admin',
//   status: 'active',
//   created_at: new Date(),
//   updated_at: new Date()
// });

print('MongoDB initialization completed successfully');