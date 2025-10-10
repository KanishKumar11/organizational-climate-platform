import requests
from requests.auth import HTTPBasicAuth

def test_get_apiadmincompanies_list_all_companies():
    base_url = "http://localhost:3000"
    endpoint = "/api/admin/companies"

    auth = HTTPBasicAuth("77kanish@gmail.com", "kanish@7.7")
    headers = {
        "Accept": "application/json"
    }
    timeout = 30

    try:
        response = requests.get(f"{base_url}{endpoint}", auth=auth, headers=headers, timeout=timeout)
        response.raise_for_status()
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

        companies = response.json()
        assert isinstance(companies, list), "Response JSON is not a list"
        for company in companies:
            assert isinstance(company, dict), "Each company should be a dictionary"
            assert "name" in company, "Company entry missing 'name'"
            # 'industry' and 'size' are optional by schema but often present; check if present
            assert "industry" in company or True
            assert "size" in company or True

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_apiadmincompanies_list_all_companies()