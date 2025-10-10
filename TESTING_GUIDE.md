# 🧪 Testing Guide - Organizational Climate Platform

## Complete Testing Setup and Execution Guide

---

## 📋 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test User Setup](#test-user-setup)
3. [Backend API Testing](#backend-api-testing)
4. [Frontend UI Testing](#frontend-ui-testing)
5. [Integration Testing](#integration-testing)
6. [Running Tests](#running-tests)

---

## 🎯 Testing Overview

### Test Types

- **Unit Tests**: Jest tests for individual components
- **API Tests**: Backend endpoint testing with authentication
- **UI Tests**: TestSprite frontend testing
- **Integration Tests**: End-to-end workflow testing

### Test Credentials

- **Email:** 77kanish@gmail.com
- **Password:** kanish@7.7
- **Role:** super_admin

---

## 👤 Test User Setup

### Create Test Super Admin

```bash
# Run the setup script
npm run setup:test-user
```

This creates a super admin user with test credentials for automated testing.

**Verification:**

```bash
# The script will output:
✅ Test user created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 TEST CREDENTIALS:
   Email: 77kanish@gmail.com
   Password: kanish@7.7
   Role: super_admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Backend API Testing

### Setup Python Environment

```bash
# Navigate to test directory
cd testsprite_tests

# Install Python dependencies
pip install -r requirements.txt
```

### Authentication Helper

The `auth_helper.py` provides NextAuth session-based authentication:

```python
from auth_helper import create_authenticated_session

# Create authenticated session
auth = create_authenticated_session(
    email="77kanish@gmail.com",
    password="kanish@7.7"
)

# Make authenticated request
response = auth.make_authenticated_request('GET', '/api/admin/users')
```

### Run Example Tests

```bash
# Ensure server is running
npm run dev

# In another terminal, run example test
cd testsprite_tests
python example_authenticated_test.py
```

**Expected Output:**

```
🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪
RUNNING EXAMPLE AUTHENTICATED TESTS
🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪

============================================================
TEST: List Users with Authentication
============================================================
✅ Authenticated as: 77kanish@gmail.com
   Role: super_admin
📊 Response Status: 200
✅ SUCCESS: Retrieved users

============================================================
TEST SUMMARY
============================================================
✅ PASS: List Users
✅ PASS: List Companies
✅ PASS: Create User
📊 Results: 3/3 tests passed
============================================================
```

---

## 🎨 Frontend UI Testing (TestSprite)

### Prerequisites

1. **Local server running:**

```bash
npm run dev
```

2. **Test data seeded:**

```bash
npm run seed:comprehensive
npm run setup:test-user
```

### Running TestSprite Tests

TestSprite tests are configured in `testsprite_tests/`:

- `testsprite_backend_test_plan.json` - 10 backend API tests
- `testsprite_frontend_test_plan.json` - 20 frontend UI tests

**Important:** TestSprite tests now use proper authentication via the auth helper.

### Test Plan Overview

#### Backend Tests (10 tests)

- TC001: User Registration
- TC002-TC005: User Management
- TC006-TC007: Company Management
- TC008-TC009: Department Management
- TC010: Dashboard Data

#### Frontend Tests (20 tests)

- Survey Creation & Management (6 tests)
- Company & User Management (3 tests)
- Multilingual Support (2 tests)
- Advanced Features (5 tests)
- Dashboard & Reporting (2 tests)
- Authentication & Performance (2 tests)

---

## 🔄 Integration Testing

### Full System Test

```bash
# Run comprehensive test suite
npm run test:integration
```

### Manual Integration Test Flow

1. **User Management**

   ```bash
   # Create company
   # Create departments
   # Invite users
   # Verify invitations sent
   ```

2. **Survey Workflow**

   ```bash
   # Create survey
   # Add questions from library
   # Configure targeting
   # Set schedule
   # Distribute survey
   # Collect responses
   ```

3. **Analytics & Reporting**

   ```bash
   # View results
   # Generate reports
   # Export data
   # Create action plans
   ```

4. **Microclimate Features**
   ```bash
   # Launch microclimate session
   # Collect real-time responses
   # View live visualizations
   # Export session data
   ```

---

## ▶️ Running Tests

### Jest Unit Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### API Integration Tests

```bash
# Test user management
npm run test:user-management

# Test department creation
npm run test:department-creation

# Test survey workflow
npm run test:survey-workflow
```

### Manual Testing Checklist

#### Authentication ✅

- [ ] Login with test credentials
- [ ] Logout
- [ ] Session persistence
- [ ] Role-based access control

#### User Management ✅

- [ ] Create user (via invitation)
- [ ] Update user
- [ ] Delete user
- [ ] Bulk import users (CSV)

#### Survey Management ✅

- [ ] Create survey
- [ ] Add questions from library
- [ ] Configure demographics
- [ ] Set targeting rules
- [ ] Schedule survey
- [ ] Generate QR code
- [ ] Distribute survey

#### Response Collection ✅

- [ ] Complete survey as employee
- [ ] Save draft
- [ ] Auto-save functionality
- [ ] Submit responses
- [ ] View completion status

#### Analytics ✅

- [ ] View survey results
- [ ] Filter by demographics
- [ ] Generate reports
- [ ] Export to PDF/Excel
- [ ] View AI insights

#### Microclimate ✅

- [ ] Launch session
- [ ] Collect responses
- [ ] View live word cloud
- [ ] Export session data

---

## 🐛 Troubleshooting

### Tests Failing with 401 Unauthorized

**Issue:** Authentication not working

**Solution:**

```bash
# 1. Verify test user exists
npm run setup:test-user

# 2. Ensure server is running
npm run dev

# 3. Check NEXTAUTH_SECRET is set
cat .env.local | grep NEXTAUTH_SECRET
```

### Database Connection Errors

**Issue:** Cannot connect to MongoDB

**Solution:**

```bash
# 1. Verify MongoDB is running
# For Docker:
docker ps | grep mongodb

# For local:
sudo systemctl status mongod

# 2. Check connection string
echo $MONGODB_URI
```

### Email Tests Failing

**Issue:** Invitations not sending

**Solution:**

```bash
# 1. Verify Brevo configuration
npm run test:brevo-email

# 2. Check environment variables
cat .env.local | grep EMAIL
cat .env.local | grep BREVO
```

---

## 📊 Test Coverage Goals

| Component   | Target Coverage     | Current |
| ----------- | ------------------- | ------- |
| API Routes  | 80%+                | TBD     |
| Components  | 70%+                | TBD     |
| Utilities   | 90%+                | TBD     |
| Integration | 100% critical flows | TBD     |

---

## 🔍 Test Reports

### Backend Test Report

Located at: `testsprite_tests/testsprite-mcp-test-report.md`

### Comprehensive Test Report

Located at: `TESTSPRITE_COMPREHENSIVE_TEST_REPORT.md`

Includes:

- Executive summary
- Test results (backend & frontend)
- Failed test analysis
- Recommendations
- Action items

---

## 📝 Writing New Tests

### Backend API Test Template

```python
from auth_helper import create_authenticated_session

def test_my_new_feature():
    # Create authenticated session
    auth = create_authenticated_session()

    # Make request
    response = auth.make_authenticated_request(
        'POST',
        '/api/my-endpoint',
        json={'key': 'value'}
    )

    # Assertions
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
```

### Jest Unit Test Template

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

---

## ✅ Pre-Deployment Testing Checklist

Before deploying to production:

- [ ] All unit tests passing
- [ ] All API tests passing
- [ ] Authentication flows tested
- [ ] CRUD operations verified
- [ ] Email delivery confirmed
- [ ] Survey workflow end-to-end tested
- [ ] Role-based access verified
- [ ] Performance tests passed
- [ ] Security scan completed
- [ ] Load testing completed (if applicable)

---

## 📞 Support

For testing issues:

1. Check troubleshooting section
2. Review test reports
3. Check GitHub issues
4. Contact QA team

---

**Next Steps:**

- Review [PRODUCTION_READINESS_CHECKLIST.md](./PRODUCTION_READINESS_CHECKLIST.md)
- Review [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

