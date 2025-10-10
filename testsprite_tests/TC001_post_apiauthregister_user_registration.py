import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_EMAIL = "77kanish@gmail.com"
AUTH_PASSWORD = "kanish@7.7"
TIMEOUT = 30

def test_post_apiauthregister_user_registration():
    url = f"{BASE_URL}/api/auth/register"
    auth = HTTPBasicAuth(AUTH_EMAIL, AUTH_PASSWORD)

    headers = {
        "Content-Type": "application/json"
    }

    # Valid user data
    valid_user = {
        "email": "testuser_valid@example.com",
        "password": "StrongPass1!",
        "name": "Test User",
        "role": "employee"
    }

    # Invalid user data cases for validation
    invalid_users = [
        # Invalid email format
        {
            "email": "invalid-email",
            "password": "StrongPass1!",
            "name": "Test User",
            "role": "employee"
        },
        # Password too short
        {
            "email": "testuser_shortpass@example.com",
            "password": "short",
            "name": "Test User",
            "role": "employee"
        },
        # Missing name
        {
            "email": "testuser_noname@example.com",
            "password": "StrongPass1!",
            "role": "employee"
        },
        # Invalid role
        {
            "email": "testuser_invalidrole@example.com",
            "password": "StrongPass1!",
            "name": "Test User",
            "role": "invalid_role"
        }
    ]

    created_user_emails = []

    try:
        # Test valid registration
        resp = requests.post(url, json=valid_user, auth=auth, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code} for valid user registration"
        created_user_emails.append(valid_user["email"])

        # Test invalid registrations
        for invalid_user in invalid_users:
            resp = requests.post(url, json=invalid_user, auth=auth, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 400, (
                f"Expected 400 for invalid input but got {resp.status_code} for data: {invalid_user}"
            )
            assert resp.text and len(resp.text) > 0, "Expected error message in response body for invalid input"

    finally:
        # Cleanup: delete created users if any were registered successfully
        for email in created_user_emails:
            try:
                # We need to find the user ID by email via API (assuming an admin users endpoint)
                search_url = f"{BASE_URL}/api/admin/users"
                params = {"search": email}
                resp = requests.get(search_url, auth=auth, headers=headers, params=params, timeout=TIMEOUT)
                if resp.status_code == 200:
                    users = resp.json()
                    if isinstance(users, list):
                        # Find user with exact email match
                        user = next((u for u in users if u.get("email") == email), None)
                        if user and "id" in user:
                            user_id = user["id"]
                            delete_url = f"{BASE_URL}/api/admin/users/{user_id}"
                            del_resp = requests.delete(delete_url, auth=auth, headers=headers, timeout=TIMEOUT)
                            assert del_resp.status_code == 200, f"User deletion failed with status {del_resp.status_code}"
            except Exception:
                # If deletion fails, skip silently
                pass

test_post_apiauthregister_user_registration()