const mongoose = require('mongoose');

// Connect to MongoDB
async function makeUserAdmin(userEmail, role = 'company_admin') {
  try {
    // Replace with your MongoDB connection string
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kanishkumar:1234kanish@cluster0.2zf36.mongodb.net/climate');

    // Define User schema (simplified)
    const userSchema = new mongoose.Schema({
      email: String,
      role: String,
      name: String,
    });

    const User = mongoose.model('User', userSchema);

    // Update user role
    const result = await User.updateOne(
      { email: userEmail },
      { $set: { role: role } }
    );

    if (result.matchedCount === 0) {
      console.log(`User with email ${userEmail} not found`);
    } else if (result.modifiedCount === 0) {
      console.log(`User ${userEmail} already has role ${role}`);
    } else {
      console.log(`Successfully updated ${userEmail} to ${role}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Usage: node scripts/make-user-admin.js user@example.com company_admin
const userEmail = process.argv[2];
const role = process.argv[3] || 'company_admin';

if (!userEmail) {
  console.log('Usage: node make-user-admin.js <email> [role]');
  console.log('Available roles: super_admin, company_admin, leader, supervisor, evaluated_user');
  process.exit(1);
}

makeUserAdmin(userEmail, role);