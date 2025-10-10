"""
Authentication Helper for TestSprite
Handles NextAuth.js session-based authentication
"""

import requests
from typing import Optional, Dict, Any

class NextAuthHelper:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.csrf_token: Optional[str] = None
        
    def get_csrf_token(self) -> str:
        """Get CSRF token from NextAuth"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/csrf", timeout=30)
            response.raise_for_status()
            data = response.json()
            self.csrf_token = data.get('csrfToken')
            return self.csrf_token
        except Exception as e:
            raise Exception(f"Failed to get CSRF token: {e}")
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login using NextAuth credentials provider
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Dict with login status and session info
        """
        try:
            # Step 1: Get CSRF token
            if not self.csrf_token:
                self.get_csrf_token()
            
            # Step 2: Attempt to login via NextAuth callback
            # Note: NextAuth uses form-urlencoded for credentials callback
            login_data = {
                'email': email,
                'password': password,
                'csrfToken': self.csrf_token,
                'callbackUrl': f"{self.base_url}/dashboard",
                'json': 'true'
            }
            
            # Try the credentials callback endpoint
            response = self.session.post(
                f"{self.base_url}/api/auth/callback/credentials",
                data=login_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout=30,
                allow_redirects=False
            )
            
            # NextAuth may redirect on success (302) or return JSON
            if response.status_code in [200, 302]:
                # Verify session by checking /api/auth/session
                session_response = self.session.get(
                    f"{self.base_url}/api/auth/session",
                    timeout=30
                )
                
                if session_response.status_code == 200:
                    session_data = session_response.json()
                    
                    if session_data and session_data.get('user'):
                        return {
                            'success': True,
                            'session': session_data,
                            'user': session_data.get('user'),
                            'message': 'Login successful'
                        }
            
            # If we got here, login failed
            return {
                'success': False,
                'session': None,
                'user': None,
                'message': f'Login failed with status {response.status_code}',
                'response_text': response.text[:200]  # First 200 chars for debugging
            }
            
        except Exception as e:
            return {
                'success': False,
                'session': None,
                'user': None,
                'message': f'Login error: {str(e)}'
            }
    
    def get_session(self) -> Optional[Dict[str, Any]]:
        """Get current session information"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/auth/session",
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            return None
            
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    def logout(self) -> bool:
        """Logout from NextAuth session"""
        try:
            if not self.csrf_token:
                self.get_csrf_token()
                
            response = self.session.post(
                f"{self.base_url}/api/auth/signout",
                data={'csrfToken': self.csrf_token},
                timeout=30
            )
            
            return response.status_code in [200, 302]
            
        except Exception as e:
            print(f"Error during logout: {e}")
            return False
    
    def make_authenticated_request(
        self, 
        method: str, 
        endpoint: str, 
        **kwargs
    ) -> requests.Response:
        """
        Make an authenticated API request
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            endpoint: API endpoint (e.g., '/api/admin/users')
            **kwargs: Additional arguments to pass to requests
            
        Returns:
            Response object
        """
        url = f"{self.base_url}{endpoint}"
        return self.session.request(method, url, **kwargs)


# Example usage and helper functions
def create_authenticated_session(
    email: str = "77kanish@gmail.com",
    password: str = "kanish@7.7",
    base_url: str = "http://localhost:3000"
) -> NextAuthHelper:
    """
    Create an authenticated session for testing
    
    Args:
        email: User email (default: test super admin)
        password: User password
        base_url: Application base URL
        
    Returns:
        NextAuthHelper instance with active session
        
    Raises:
        Exception if login fails
    """
    auth = NextAuthHelper(base_url)
    result = auth.login(email, password)
    
    if not result['success']:
        raise Exception(f"Authentication failed: {result['message']}")
    
    print(f"✅ Authenticated as: {result['user'].get('email')}")
    print(f"   Role: {result['user'].get('role')}")
    
    return auth


if __name__ == "__main__":
    # Test the authentication
    print("Testing NextAuth authentication...")
    
    try:
        auth = create_authenticated_session()
        
        # Test an authenticated request
        response = auth.make_authenticated_request('GET', '/api/admin/users')
        print(f"\n📊 Test API call status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Authentication helper working correctly!")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Authentication test failed: {e}")


