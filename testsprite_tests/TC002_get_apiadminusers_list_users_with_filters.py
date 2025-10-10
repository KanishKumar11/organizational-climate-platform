import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
AUTH_TOKEN = "Bearer your_valid_token_here"  # Replace with valid token for testing

headers = {
    "Accept": "application/json",
    "Authorization": AUTH_TOKEN
}

def test_tc002_get_apiadminusers_list_users_with_filters():
    """
    Test the user listing endpoint with pagination, search, role, and department filters 
    to verify it returns the correct subset of users and handles edge cases like empty results.
    """
    url = f"{BASE_URL}/api/admin/users"

    # Test with pagination: page 1, limit 5
    params = {"page": 1, "limit": 5}
    try:
        response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Unexpected status code {response.status_code} for pagination test"
        data = response.json()
        assert isinstance(data, dict), "Response should be a JSON object/dict"
        assert "users" in data or "data" in data or isinstance(data, list), "Response doesn't contain users list"
    except Exception as e:
        raise AssertionError(f"Pagination filter test failed: {e}")

    # Test with search filter: search a likely nonexistent string to get empty result
    params = {"search": "unlikelysearchterm1234567890"}
    try:
        response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Unexpected status code {response.status_code} for search filter test"
        data = response.json()
        users_list = None
        if isinstance(data, dict):
            if "users" in data:
                users_list = data["users"]
            elif "data" in data:
                users_list = data["data"]
            else:
                users_list = []
        elif isinstance(data, list):
            users_list = data
        else:
            users_list = []

        assert (isinstance(users_list, list) and len(users_list) == 0) or users_list == [], \
            "Expected empty user list for unlikely search term"
    except Exception as e:
        raise AssertionError(f"Search filter test failed: {e}")

    # Test with role filter: use a valid role, e.g. "employee"
    params = {"role": "employee", "limit": 10}
    try:
        response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Unexpected status code {response.status_code} for role filter test"
        data = response.json()
        users_list = None
        if isinstance(data, dict):
            users_list = data.get("users") or data.get("data") or []
        elif isinstance(data, list):
            users_list = data
        else:
            users_list = []

        if users_list:
            for user in users_list:
                assert user.get("role") == "employee", f"User role mismatch, expected 'employee', got {user.get('role')}"
    except Exception as e:
        raise AssertionError(f"Role filter test failed: {e}")

    # Test with department_id filter: first retrieve departments to get an existing department id
    departments_url = f"{BASE_URL}/api/admin/departments"
    try:
        resp_depts = requests.get(departments_url, headers=headers, timeout=TIMEOUT)
        assert resp_depts.status_code == 200, f"Failed to get departments for department filter test"
        departments = resp_depts.json()
        department_id = None
        if isinstance(departments, dict):
            depts_list = departments.get("departments") or departments.get("data") or []
            if depts_list and isinstance(depts_list, list):
                department_id = depts_list[0].get("id") or depts_list[0].get("_id")
        elif isinstance(departments, list) and len(departments) > 0:
            department_id = departments[0].get("id") or departments[0].get("_id")

        if not department_id:
            # If no department found, skip this subtest without exiting test
            pass
        else:
            params = {"department_id": department_id, "limit": 10}
            response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
            assert response.status_code == 200, f"Unexpected status code {response.status_code} for department filter test"
            data = response.json()
            users_list = None
            if isinstance(data, dict):
                users_list = data.get("users") or data.get("data") or []
            elif isinstance(data, list):
                users_list = data
            else:
                users_list = []

            if users_list:
                for user in users_list:
                    user_dept_id = user.get("department_id") or user.get("department") or None
                    assert user_dept_id == department_id, \
                        f"User department_id mismatch: expected {department_id} got {user_dept_id}"
    except Exception as e:
        raise AssertionError(f"Department filter test failed: {e}")


test_tc002_get_apiadminusers_list_users_with_filters()
