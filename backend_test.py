#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class TimeKeeperAPITester:
    def __init__(self, base_url="https://timekeeper-245.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_user_id = None
        self.project_id = None
        self.entry_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@timekeeper.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_admin_registration(self):
        """Test admin user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        admin_data = {
            "name": f"Admin User {timestamp}",
            "email": "admin@timekeeper.com",
            "password": "AdminPass123!"
        }
        
        success, response = self.run_test(
            "Admin Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data,
            headers={}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            self.admin_user_id = response['user']['id']
            print(f"   Admin User ID: {self.admin_user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"testuser{timestamp}@timekeeper.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data,
            headers={}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_project(self):
        """Test project creation"""
        project_data = {
            "name": "Test Project",
            "color": "#4F46E5"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   Project ID: {self.project_id}")
            return True
        return False

    def test_get_projects(self):
        """Test get projects"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "projects",
            200
        )
        return success

    def test_start_timer(self):
        """Test starting timer"""
        timer_data = {
            "task_name": "Test Task",
            "description": "Testing timer functionality",
            "project_id": self.project_id,
            "tags": ["testing", "api"]
        }
        
        success, response = self.run_test(
            "Start Timer",
            "POST",
            "timer/start",
            200,
            data=timer_data
        )
        
        if success and 'id' in response:
            self.entry_id = response['id']
            print(f"   Entry ID: {self.entry_id}")
            return True
        return False

    def test_get_current_timer(self):
        """Test get current timer"""
        success, response = self.run_test(
            "Get Current Timer",
            "GET",
            "timer/current",
            200
        )
        return success

    def test_stop_timer(self):
        """Test stopping timer"""
        success, response = self.run_test(
            "Stop Timer",
            "POST",
            "timer/stop",
            200
        )
        return success

    def test_get_entries(self):
        """Test get time entries"""
        success, response = self.run_test(
            "Get Time Entries",
            "GET",
            "entries",
            200
        )
        return success

    def test_get_entry_by_id(self):
        """Test get specific entry"""
        if not self.entry_id:
            print("⚠️  Skipping - No entry ID available")
            return True
            
        success, response = self.run_test(
            "Get Entry by ID",
            "GET",
            f"entries/{self.entry_id}",
            200
        )
        return success

    def test_update_entry(self):
        """Test update entry"""
        if not self.entry_id:
            print("⚠️  Skipping - No entry ID available")
            return True
            
        update_data = {
            "task_name": "Updated Test Task",
            "description": "Updated description"
        }
        
        success, response = self.run_test(
            "Update Entry",
            "PUT",
            f"entries/{self.entry_id}",
            200,
            data=update_data
        )
        return success

    def test_daily_summary(self):
        """Test daily summary"""
        success, response = self.run_test(
            "Daily Summary",
            "GET",
            "entries/summary/daily",
            200
        )
        return success

    def test_weekly_summary(self):
        """Test weekly summary"""
        success, response = self.run_test(
            "Weekly Summary",
            "GET",
            "entries/summary/weekly",
            200
        )
        return success

    def test_monthly_summary(self):
        """Test monthly summary"""
        success, response = self.run_test(
            "Monthly Summary",
            "GET",
            "entries/summary/monthly",
            200
        )
        return success

    def test_export_csv(self):
        """Test CSV export"""
        success, response = self.run_test(
            "Export CSV",
            "GET",
            "export/csv",
            200
        )
        return success

    def test_admin_get_users(self):
        """Test admin get all users"""
        if not self.admin_token:
            print("⚠️  Skipping - No admin token available")
            return True
            
        # Temporarily switch to admin token
        original_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_admin_reports(self):
        """Test admin reports"""
        if not self.admin_token:
            print("⚠️  Skipping - No admin token available")
            return True
            
        # Temporarily switch to admin token
        original_token = self.token
        self.token = self.admin_token
        
        success, response = self.run_test(
            "Admin Reports",
            "GET",
            "admin/reports",
            200
        )
        
        # Restore original token
        self.token = original_token
        return success

    def test_delete_entry(self):
        """Test delete entry"""
        if not self.entry_id:
            print("⚠️  Skipping - No entry ID available")
            return True
            
        success, response = self.run_test(
            "Delete Entry",
            "DELETE",
            f"entries/{self.entry_id}",
            200
        )
        return success

    def test_delete_project(self):
        """Test delete project"""
        if not self.project_id:
            print("⚠️  Skipping - No project ID available")
            return True
            
        success, response = self.run_test(
            "Delete Project",
            "DELETE",
            f"projects/{self.project_id}",
            200
        )
        return success

def main():
    print("🚀 Starting TimeKeeper API Tests...")
    print("=" * 50)
    
    tester = TimeKeeperAPITester()
    
    # Authentication Tests
    print("\n📝 AUTHENTICATION TESTS")
    print("-" * 30)
    
    if not tester.test_user_registration():
        print("❌ User registration failed, stopping tests")
        return 1
    
    if not tester.test_admin_registration():
        print("⚠️  Admin registration failed, continuing without admin tests")
    
    if not tester.test_get_current_user():
        print("❌ Get current user failed")
        return 1
    
    # Project Tests
    print("\n📁 PROJECT TESTS")
    print("-" * 30)
    
    if not tester.test_create_project():
        print("❌ Project creation failed")
        return 1
    
    if not tester.test_get_projects():
        print("❌ Get projects failed")
        return 1
    
    # Timer Tests
    print("\n⏱️  TIMER TESTS")
    print("-" * 30)
    
    if not tester.test_start_timer():
        print("❌ Start timer failed")
        return 1
    
    if not tester.test_get_current_timer():
        print("❌ Get current timer failed")
        return 1
    
    # Wait a moment for timer to run
    import time
    print("⏳ Waiting 2 seconds for timer to accumulate time...")
    time.sleep(2)
    
    if not tester.test_stop_timer():
        print("❌ Stop timer failed")
        return 1
    
    # Entry Tests
    print("\n📊 ENTRY TESTS")
    print("-" * 30)
    
    if not tester.test_get_entries():
        print("❌ Get entries failed")
        return 1
    
    if not tester.test_get_entry_by_id():
        print("❌ Get entry by ID failed")
        return 1
    
    if not tester.test_update_entry():
        print("❌ Update entry failed")
        return 1
    
    # Summary Tests
    print("\n📈 SUMMARY TESTS")
    print("-" * 30)
    
    if not tester.test_daily_summary():
        print("❌ Daily summary failed")
        return 1
    
    if not tester.test_weekly_summary():
        print("❌ Weekly summary failed")
        return 1
    
    if not tester.test_monthly_summary():
        print("❌ Monthly summary failed")
        return 1
    
    # Export Tests
    print("\n📤 EXPORT TESTS")
    print("-" * 30)
    
    if not tester.test_export_csv():
        print("❌ CSV export failed")
        return 1
    
    # Admin Tests
    print("\n👑 ADMIN TESTS")
    print("-" * 30)
    
    tester.test_admin_get_users()
    tester.test_admin_reports()
    
    # Cleanup Tests
    print("\n🗑️  CLEANUP TESTS")
    print("-" * 30)
    
    tester.test_delete_entry()
    tester.test_delete_project()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Excellent! API is working well")
        return 0
    elif success_rate >= 70:
        print("⚠️  Good, but some issues need attention")
        return 0
    else:
        print("❌ Multiple failures detected")
        return 1

if __name__ == "__main__":
    sys.exit(main())