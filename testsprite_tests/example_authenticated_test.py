"""
Example Test with NextAuth Authentication
Demonstrates how to use the auth_helper for API testing
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from auth_helper import create_authenticated_session
import requests

BASE_URL = "http://localhost:3000"
TEST_EMAIL = "77kanish@gmail.com"
TEST_PASSWORD = "kanish@7.7"

def test_authenticated_user_list():
    """
    Example test: List users with authentication
    """
    print("\n" + "="*60)
    print("TEST: List Users with Authentication")
    print("="*60)
    
    try:
        # Create authenticated session
        auth = create_authenticated_session(TEST_EMAIL, TEST_PASSWORD, BASE_URL)
        
        # Make authenticated request
        response = auth.make_authenticated_request(
            'GET',
            '/api/admin/users',
            params={'page': 1, 'limit': 10},
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ SUCCESS: Retrieved users")
            
            if isinstance(data, dict) and 'data' in data:
                users = data['data']
            elif isinstance(data, list):
                users = data
            else:
                users = []
            
            print(f"   Total users in response: {len(users)}")
            
            if users:
                print(f"\n   Sample user:")
                sample_user = users[0]
                print(f"   - Name: {sample_user.get('name')}")
                print(f"   - Email: {sample_user.get('email')}")
                print(f"   - Role: {sample_user.get('role')}")
            
            return True
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_authenticated_company_list():
    """
    Example test: List companies with authentication
    """
    print("\n" + "="*60)
    print("TEST: List Companies with Authentication")
    print("="*60)
    
    try:
        # Create authenticated session
        auth = create_authenticated_session(TEST_EMAIL, TEST_PASSWORD, BASE_URL)
        
        # Make authenticated request
        response = auth.make_authenticated_request(
            'GET',
            '/api/admin/companies',
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            companies = response.json()
            print(f"✅ SUCCESS: Retrieved companies")
            print(f"   Total companies: {len(companies)}")
            
            if companies:
                print(f"\n   Sample company:")
                sample = companies[0]
                print(f"   - Name: {sample.get('name')}")
                print(f"   - Domain: {sample.get('domain')}")
                print(f"   - Industry: {sample.get('industry')}")
            
            return True
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False


def test_create_user():
    """
    Example test: Create a new user with authentication
    """
    print("\n" + "="*60)
    print("TEST: Create User with Authentication")
    print("="*60)
    
    try:
        # Create authenticated session
        auth = create_authenticated_session(TEST_EMAIL, TEST_PASSWORD, BASE_URL)
        
        # First, get a department ID
        dept_response = auth.make_authenticated_request(
            'GET',
            '/api/admin/departments',
            timeout=30
        )
        
        if dept_response.status_code != 200:
            print(f"❌ FAILED: Could not get departments")
            return False
        
        departments = dept_response.json()
        if not departments:
            print(f"❌ FAILED: No departments found")
            return False
        
        dept_id = departments[0].get('_id') or departments[0].get('id')
        
        # Create user data
        user_data = {
            "name": "Test User Example",
            "email": f"test.example.{os.urandom(4).hex()}@testcompany.com",
            "role": "employee",
            "department_id": dept_id,
            "is_active": True
        }
        
        # Make authenticated request to create user
        response = auth.make_authenticated_request(
            'POST',
            '/api/admin/users',
            json=user_data,
            timeout=30
        )
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            created_user = response.json()
            print(f"✅ SUCCESS: User created")
            print(f"   Name: {created_user.get('name')}")
            print(f"   Email: {created_user.get('email')}")
            print(f"   Role: {created_user.get('role')}")
            
            # Cleanup: delete the user
            user_id = created_user.get('_id') or created_user.get('id')
            if user_id:
                delete_response = auth.make_authenticated_request(
                    'DELETE',
                    f'/api/admin/users/{user_id}',
                    timeout=30
                )
                if delete_response.status_code == 200:
                    print(f"   ✅ Cleanup: User deleted")
            
            return True
        else:
            print(f"❌ FAILED: Status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "🧪 "*30)
    print("RUNNING EXAMPLE AUTHENTICATED TESTS")
    print("🧪 "*30)
    
    results = []
    
    # Run tests
    results.append(("List Users", test_authenticated_user_list()))
    results.append(("List Companies", test_authenticated_company_list()))
    results.append(("Create User", test_create_user()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    print("="*60 + "\n")
    
    sys.exit(0 if passed == total else 1)


