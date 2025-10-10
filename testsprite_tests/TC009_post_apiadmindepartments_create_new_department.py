import requests

BASE_URL = "http://localhost:3000"
AUTH = ("77kanish@gmail.com", "kanish@7.7")
HEADERS = {
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_post_apiadmindepartments_create_new_department():
    company_id = None
    department_id = None
    try:
        # Step 1: Create a company to get a valid company_id
        company_payload = {
            "name": "Test Company for Department",
            "industry": "Technology",
            "size": "50-100"
        }
        company_response = requests.post(f"{BASE_URL}/api/admin/companies", auth=AUTH, headers=HEADERS, json=company_payload, timeout=TIMEOUT)
        assert company_response.status_code == 201, f"Failed to create company: {company_response.text}"
        company_data = company_response.json()
        company_id = company_data.get("id") or company_data.get("_id")
        assert company_id, "Created company ID not found in response"

        # Step 2: Create a new department with the obtained company_id
        department_payload = {
            "name": "Test Department",
            "company_id": company_id
            # parent_id is optional, so omitted here
        }
        dept_response = requests.post(f"{BASE_URL}/api/admin/departments", auth=AUTH, headers=HEADERS, json=department_payload, timeout=TIMEOUT)
        assert dept_response.status_code == 201, f"Failed to create department: {dept_response.text}"
        dept_data = dept_response.json()
        department_id = dept_data.get("id") or dept_data.get("_id")
        assert department_id, "Created department ID not found in response"
        assert dept_data.get("name") == department_payload["name"], "Department name mismatch"
        assert dept_data.get("company_id") == company_id, "Department company_id mismatch"

    finally:
        # Cleanup - delete the created department if exists
        if department_id:
            try:
                del_dept_response = requests.delete(f"{BASE_URL}/api/admin/departments/{department_id}", auth=AUTH, timeout=TIMEOUT)
                # Allow 200 or 204 as successful deletion responses
                assert del_dept_response.status_code in [200, 204], f"Failed to delete department: {del_dept_response.text}"
            except Exception:
                pass
        # Cleanup - delete the created company if exists
        if company_id:
            try:
                del_comp_response = requests.delete(f"{BASE_URL}/api/admin/companies/{company_id}", auth=AUTH, timeout=TIMEOUT)
                assert del_comp_response.status_code in [200, 204], f"Failed to delete company: {del_comp_response.text}"
            except Exception:
                pass

test_post_apiadmindepartments_create_new_department()