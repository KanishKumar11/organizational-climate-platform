import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_apiadmindepartments_list_all_departments():
    url = f"{BASE_URL}/api/admin/departments"
    try:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
        departments = response.json()
        assert isinstance(departments, list), "Response should be a list"
        for dept in departments:
            assert isinstance(dept, dict), "Each department entry should be a dict"
            assert "name" in dept, "Department entry missing 'name' field"
    except requests.exceptions.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_get_apiadmindepartments_list_all_departments()