import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("77kanish@gmail.com", "kanish@7.7")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30


def test_delete_apiadminusersid_delete_user_by_id():
    user_payload = {
        "name": "Test User To Delete",
        "email": "testuser.delete@example.com",
        "role": "employee"
    }

    created_user_id = None
    try:
        # Create a new user to delete
        create_response = requests.post(
            f"{BASE_URL}/api/admin/users",
            auth=AUTH,
            headers=HEADERS,
            json=user_payload,
            timeout=TIMEOUT
        )
        assert create_response.status_code == 201, f"User creation failed: {create_response.text}"
        created_user = create_response.json()
        created_user_id = created_user.get("id") or created_user.get("_id") or created_user.get("user_id")
        assert created_user_id, "Created user ID not found in response"

        # Delete the created user
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/users/{created_user_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert delete_response.status_code == 200, f"User deletion failed: {delete_response.text}"

        # Verify the user was deleted by trying to get user details or user list doesn't contain the user
        # Assuming a GET /api/admin/users/{id} would return 404, or listing won't show the user
        get_response = requests.get(
            f"{BASE_URL}/api/admin/users/{created_user_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        # Expecting 404 or 400 for user not found after deletion, if 200 then fail test
        assert get_response.status_code == 404 or get_response.status_code == 400,\
            f"Deleted user still accessible: {get_response.status_code} {get_response.text}"

    finally:
        # Cleanup: If user still exists, attempt to delete again
        if created_user_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/admin/users/{created_user_id}",
                    auth=AUTH,
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
            except Exception:
                pass


test_delete_apiadminusersid_delete_user_by_id()