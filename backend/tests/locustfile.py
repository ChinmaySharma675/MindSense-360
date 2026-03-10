from locust import HttpUser, task, between
import random

class MindSenseUser(HttpUser):
    wait_time = between(10, 30)  # Simulates polling interval (averaging around 20s, closest to 30s)
    
    def on_start(self):
        """Login on start to get token"""
        self.username = f"load_user_{random.randint(1000, 9999)}"
        self.password = "password123"
        self.register_and_login()

    def register_and_login(self):
        # Try to register
        self.client.post("/auth/register", json={
            "username": self.username,
            "email": f"{self.username}@example.com",
            "password": self.password
        })
        
        # Login
        response = self.client.post("/auth/login", data={
            "username": self.username,
            "password": self.password
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None

    @task(3)
    def view_dashboard(self):
        """Simulate viewing dashboard (polling risk)"""
        if self.token:
            self.client.get("/risk/predict_risk", headers=self.headers)

    @task(1)
    def submit_behavior(self):
        """Randomly submit behavioral data"""
        if self.token:
            self.client.post("/behavioral/submit_behavior", json={
                "sleep_hours": random.uniform(4, 9),
                "screen_time_hours": random.uniform(2, 12),
                "physical_activity_minutes": random.randint(0, 120)
            }, headers=self.headers)

    @task(1)
    def view_history(self):
        """View risk history"""
        if self.token:
            self.client.get("/risk/risk_history?days=7", headers=self.headers)
