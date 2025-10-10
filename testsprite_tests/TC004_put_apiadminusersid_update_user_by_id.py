import requests

BASE_URL = "http://localhost:3000"
# TODO: Replace 'your_valid_access_token_here' with a valid access token with appropriate permissions
TOKEN = "your_valid_access_token_here"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
TIMEOUT = 30

def test_put_apiadminusersid_update_user_by_id():
    create_url = f"{BASE_URL}/api/admin/users"
    update_user_url_template = f"{BASE_URL}/api/admin/users/{{id}}"
    delete_url_template = f"{BASE_URL}/api/admin/users/{{id}}"

    # Step 1: Create a new user to update
    user_payload = {
        "name": "Test User Update",
        "email": "testuserupdate@example.com",
        "role": "employee"
    }
    user_id = None

    try:
        response_create = requests.post(create_url, json=user_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response_create.status_code == 201, f"User creation failed: {response_create.text}"
        user_data = response_create.json()
        user_id = user_data.get("id") or user_data.get("_id")
        assert user_id, "Created user ID not found in response"

        # Step 2: Update the user by ID
        update_payload = {
            "name": "Updated Test User",
            "email": "updateduser@example.com",
            "role": "leader"
        }
        update_url = update_user_url_template.format(id=user_id)
        response_update = requests.put(update_url, json=update_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response_update.status_code == 200, f"User update failed: {response_update.text}"
        updated_user = response_update.json()

        # Validate response confirms the update
        assert updated_user.get("name") == update_payload["name"], "User name not updated correctly"
        assert updated_user.get("email") == update_payload["email"], "User email not updated correctly"
        assert updated_user.get("role") == update_payload["role"], "User role not updated correctly"
    finally:
        # Cleanup: delete the user if created
        if user_id:
            try:
                delete_url = delete_url_template.format(id=user_id)
                response_delete = requests.delete(delete_url, headers=HEADERS, timeout=TIMEOUT)
                assert response_delete.status_code == 200, f"User deletion failed: {response_delete.text}"
            except Exception:
                pass


test_put_apiadminusersid_update_user_by_id()
