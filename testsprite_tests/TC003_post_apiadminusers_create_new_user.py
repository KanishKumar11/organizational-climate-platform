import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH_TOKEN = "Bearer PLACEHOLDER_TOKEN"  # Replace with valid token for the test environment

headers = {
    "Content-Type": "application/json",
    "Authorization": AUTH_TOKEN
}

def test_post_apiadminusers_create_new_user():
    # First, fetch existing departments to get a valid department_id for user creation
    dep_url = f"{BASE_URL}/api/admin/departments"
    try:
        dep_resp = requests.get(dep_url, headers=headers, timeout=TIMEOUT)
        dep_resp.raise_for_status()
        departments = dep_resp.json()
        assert isinstance(departments, list), "Expected list of departments"
        assert len(departments) > 0, "No departments available to assign user"
        department_id = departments[0].get("id") or departments[0].get("_id") or departments[0].get("department_id")
        if not department_id and isinstance(departments[0], dict):
            for k,v in departments[0].items():
                if isinstance(v, str):
                    department_id = v
                    break
        assert department_id, "Could not extract department_id from department data"
    except Exception as e:
        raise AssertionError(f"Failed to fetch departments: {e}")

    user_payload = {
        "name": "Test User TC003",
        "email": "testuser_tc003@example.com",
        "role": "employee",
        "department_id": department_id
    }

    user_url = f"{BASE_URL}/api/admin/users"
    created_user_id = None
    try:
        resp = requests.post(user_url, json=user_payload, headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 201, f"Expected status code 201, got {resp.status_code}"
        resp_json = resp.json()
        if isinstance(resp_json, dict):
            created_user_id = resp_json.get("id") or resp_json.get("_id")
            assert created_user_id or ("name" in resp_json and "email" in resp_json), "User creation response missing user identification"
        else:
            raise AssertionError("User creation response JSON is not an object")
    except Exception as e:
        raise AssertionError(f"User creation failed: {e}")
    finally:
        if created_user_id:
            del_url = f"{user_url}/{created_user_id}"
            try:
                del_resp = requests.delete(del_url, headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code in [200, 204], f"User deletion failed with status {del_resp.status_code}"
            except Exception as e:
                raise AssertionError(f"Cleanup failed: Could not delete created user: {e}")

test_post_apiadminusers_create_new_user()
