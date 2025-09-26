// Test script to verify company creation API endpoint
const testCompanyCreation = async () => {
  const testData = {
    name: "Test Company",
    domain: "testcompany.com",
    industry: "Technology",
    size: "medium",
    country: "United States",
    subscription_tier: "basic"
  };

  console.log('Testing company creation with data:', testData);

  try {
    const response = await fetch('http://localhost:3000/api/admin/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('Response data:', responseData);

    if (response.ok) {
      console.log('✅ Company creation successful!');
    } else {
      console.log('❌ Company creation failed:', responseData.error || responseData.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Test validation errors
const testValidationErrors = async () => {
  console.log('\n--- Testing validation errors ---');
  
  const invalidData = {
    name: "",  // Missing name
    domain: "invalid-domain",  // Invalid domain format
    industry: "Technology",
    size: "invalid-size",  // Invalid size
    country: "United States",
    subscription_tier: "invalid-tier"  // Invalid tier
  };

  console.log('Testing with invalid data:', invalidData);

  try {
    const response = await fetch('http://localhost:3000/api/admin/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    });

    const responseData = await response.json();
    console.log('Validation response:', responseData);
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

// Run tests
console.log('Starting company creation API tests...\n');
testCompanyCreation().then(() => {
  testValidationErrors();
});
