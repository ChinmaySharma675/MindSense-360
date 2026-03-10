import requests
import sys
import psutil
import socket

def check_port_open(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex((host, port))
    sock.close()
    return result == 0

def check_api_health(url):
    try:
        response = requests.get(url)
        return response.status_code == 200
    except:
        return False

def validate_system():
    print("🏥 Starting System Validation Check...")
    passing = True

    # 1. Check Backend Port
    if check_port_open("localhost", 8000):
        print("✅ Backend Port (8000) is open")
    else:
        print("❌ Backend Port (8000) is CLOSED")
        passing = False

    # 2. Check Frontend Port
    if check_port_open("localhost", 3000):
        print("✅ Frontend Port (3000) is open")
    else:
        print("❌ Frontend Port (3000) is CLOSED")
        passing = False

    # 3. Check API Health
    if check_api_health("http://localhost:8000/health"):
        print("✅ API Health Check PASSED")
    else:
        print("❌ API Health Check FAILED")
        passing = False

    # 4. Resource Usage
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    print(f"ℹ️  CPU Usage: {cpu_percent}%")
    print(f"ℹ️  Memory Usage: {memory.percent}%")
    
    if memory.percent > 90:
        print("⚠️  High Memory Usage!")

    if passing:
        print("\n✨ System Validation PASSED ✨")
        sys.exit(0)
    else:
        print("\n🚫 System Validation FAILED 🚫")
        sys.exit(1)

if __name__ == "__main__":
    validate_system()
