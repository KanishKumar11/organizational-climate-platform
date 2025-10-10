import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

def test_get_company_admin_dashboard_data():
    url = f"{BASE_URL}/api/dashboard/company-admin"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate presence of expected keys related to dashboard data
    expected_keys = ["surveys", "participation_metrics", "recent_activity"]
    for key in expected_keys:
        assert key in data, f"Response JSON missing expected key: '{key}'"

    # Further validation of each key
    # 'surveys' should be a list
    assert isinstance(data["surveys"], list), "'surveys' should be a list"
    # 'participation_metrics' should be a dict (assuming metrics are key-value pairs)
    assert isinstance(data["participation_metrics"], dict), "'participation_metrics' should be a dict"
    # 'recent_activity' should be a list
    assert isinstance(data["recent_activity"], list), "'recent_activity' should be a list"

test_get_company_admin_dashboard_data()
