import pytest
import requests
import uuid
import time
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base, engine
from models import User

# Using TestClient for integration tests without spinning up a real server
client = TestClient(app)

def setup_module(module):
    """Setup database for testing"""
    Base.metadata.create_all(bind=engine)

def teardown_module(module):
    """Clean up database after testing"""
    # In a real environment we might drop tables, but here we'll rely on unique user creation
    pass

class TestEndToEndFlow:
    @pytest.fixture
    def user_data(self):
        unique_id = str(uuid.uuid4())[:8]
        return {
            "username": f"test_user_{unique_id}",
            "email": f"test_{unique_id}@example.com",
            "password": "strongpassword123"
        }

    def test_full_user_journey(self, user_data):
        print(f"\n🚀 Starting E2E User Journey for {user_data['username']}")

        # 1. Register
        print("1. Registering new user...")
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == user_data["username"]
        assert "id" in data
        user_id = data["id"]
        print("   ✅ Registration successful")

        # 2. Login
        print("2. Logging in...")
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"]
        }
        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 200
        token_data = response.json()
        assert "access_token" in token_data
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   ✅ Login successful, token received")

        # 3. Submit Behavioral Data
        print("3. Submitting Behavioral Data...")
        behavior_payload = {
            "sleep_hours": 6.5,
            "screen_time_hours": 8.0,
            "physical_activity_minutes": 20
        }
        response = client.post("/behavioral/submit_behavior", json=behavior_payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        print("   ✅ Behavioral data submitted")

        # 4. Submit Wearable Data
        print("4. Submitting Wearable Data...")
        wearable_payload = {
            "heart_rate": 85.0,
            "steps": 4500
        }
        response = client.post("/wearable/submit_wearable", json=wearable_payload, headers=headers)
        assert response.status_code == 200
        print("   ✅ Wearable data submitted")

        # 5. Check Risk Prediction
        print("5. Checking Risk Prediction...")
        response = client.get("/risk/predict_risk", headers=headers)
        assert response.status_code == 200
        risk_data = response.json()
        print(f"   ℹ️ Risk Level: {risk_data['risk']}")
        print(f"   ℹ️ Confidence: {risk_data['confidence']}")
        assert "risk" in risk_data
        assert "behavior_score" in risk_data
        assert "wearable_score" in risk_data
        # Voice score might be null, which is expected
        print("   ✅ Risk prediction received")

        # 6. Check History
        print("6. Verifying History...")
        response = client.get("/risk/risk_history?days=7", headers=headers)
        assert response.status_code == 200
        history = response.json()["history"]
        assert len(history) > 0
        print("   ✅ History retrieval successful")

        # 7. Check Privacy Export
        print("7. Exporting Data...")
        response = client.get("/auth/export", headers=headers)
        assert response.status_code == 200
        export_data = response.json()
        assert export_data["user_info"]["username"] == user_data["username"]
        assert len(export_data["behavioral_data"]) >= 1
        print("   ✅ Data export confirmed")

        # 8. Delete Account
        print("8. Deleting Account...")
        response = client.delete("/auth/me", headers=headers)
        assert response.status_code == 204
        print("   ✅ Account deletion requested")

        # 9. Verify Deletion (Login should fail)
        print("9. Verifying Deletion...")
        response = client.post("/auth/login", data=login_data)
        assert response.status_code == 401
        print("   ✅ Login failed as expected (User deleted)")

        print("\n🎉 Full E2E Journey Passed!")

if __name__ == "__main__":
    # Allow running directly (e.g. python test_integration_flow.py)
    pytest.main([__file__])
