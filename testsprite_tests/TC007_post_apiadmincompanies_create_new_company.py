import requests

BASE_URL = "http://localhost:3000"
TOKEN = "your_valid_access_token_here"  # Replace with a valid JWT or access token
TIMEOUT = 30

def test_post_apiadmincompanies_create_new_company():
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TOKEN}"
    }
    company_data = {
        "name": "Test Company TC007",
        "industry": "Technology",
        "size": "50-200"
    }

    created_company_id = None

    try:
        # Create a new company
        response = requests.post(
            f"{BASE_URL}/api/admin/companies",
            json=company_data,
            headers=headers,
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        json_response = response.json()
        assert "id" in json_response or "_id" in json_response, "Response missing company ID"
        created_company_id = json_response.get("id") or json_response.get("_id")
        # Validate returned data matches input closely (depending on API response structure)
        # We'll check name, industry, and size
        assert json_response.get("name") == company_data["name"], "Mismatch in company name"
        assert json_response.get("industry") == company_data["industry"], "Mismatch in industry"
        assert json_response.get("size") == company_data["size"], "Mismatch in size"
    finally:
        # Clean up - delete the created company if created
        if created_company_id:
            del_response = requests.delete(
                f"{BASE_URL}/api/admin/companies/{created_company_id}",
                headers=headers,
                timeout=TIMEOUT
            )
            # Should be 200 OK or 204 No Content on successful deletion
            assert del_response.status_code in (200, 204), f"Failed to delete company {created_company_id}"

test_post_apiadmincompanies_create_new_company()
