const mongoose = require('mongoose');

// Connect to MongoDB and check user role
async function checkUserRole(userEmail) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kanishkumar:1234kanish@cluster0.2zf36.mongodb.net/climate');

    // Define User schema (simplified)
    const userSchema = new mongoose.Schema({
      email: String,
      role: String,
      name: String,
      company_id: String,
      department_id: String,
      is_active: Boolean,
    });

    const User = mongoose.model('User', userSchema);

    // Find user
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`❌ User with email ${userEmail} not found`);
    } else {
      console.log('✅ User found:');
      console.log('  Email:', user.email);
      console.log('  Name:', user.name);
      console.log('  Role:', user.role);
      console.log('  Company ID:', user.company_id);
      console.log('  Department ID:', user.department_id);
      console.log('  Is Active:', user.is_active);
      console.log('  ID:', user._id);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Usage: node scripts/check-user-role.js user@example.com
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node check-user-role.js <email>');
  process.exit(1);
}

checkUserRole(userEmail);