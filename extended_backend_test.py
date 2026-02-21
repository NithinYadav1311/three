#!/usr/bin/env python3
"""
Extended Backend Testing with Sample Data Creation
"""

import requests
import json
import uuid
from datetime import datetime, timezone

# Configuration
BACKEND_URL = "/api"
SESSION_ID = f"test_session_{uuid.uuid4().hex[:8]}"

def make_request(method, endpoint, headers=None, data=None, json_data=None):
    """Make HTTP request with session authentication"""
    base_headers = {"X-Session-ID": SESSION_ID}
    if headers:
        base_headers.update(headers)
    
    url = f"http://localhost:8001{BACKEND_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=base_headers)
        elif method.upper() == "POST":
            if json_data:
                response = requests.post(url, headers=base_headers, json=json_data)
            else:
                response = requests.post(url, headers=base_headers, data=data)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=base_headers, json=json_data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=base_headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return None

def create_sample_job():
    """Create a sample job for testing"""
    print("🔧 Creating sample job...")
    
    job_data = {
        "title": "Senior Software Engineer",
        "department": "Engineering",
        "location": "San Francisco, CA",
        "employment_type": "Full-time",
        "experience_level": "Senior",
        "description": "We are looking for a talented Senior Software Engineer to join our growing team.",
        "requirements": [
            "5+ years of software development experience",
            "Strong proficiency in Python or JavaScript",
            "Experience with cloud platforms (AWS, GCP, Azure)"
        ],
        "nice_to_have": [
            "Experience with machine learning",
            "Previous startup experience"
        ],
        "salary_range": {
            "min": 120000,
            "max": 180000,
            "currency": "USD"
        },
        "status": "active"
    }
    
    response = make_request("POST", "/jobs", json_data=job_data)
    
    if response and response.status_code == 200:
        job_result = response.json()
        print(f"✅ Created job: {job_result.get('job_id')}")
        return job_result.get('job_id')
    else:
        print(f"❌ Failed to create job: {response.status_code if response else 'No response'}")
        if response:
            print(f"   Response: {response.text}")
        return None

def test_with_data():
    """Test endpoints with actual data"""
    print("=" * 60)
    print("🚀 EXTENDED BACKEND TESTING WITH SAMPLE DATA")
    print("=" * 60)
    
    # Create sample job
    job_id = create_sample_job()
    
    # Test jobs endpoint with data
    print("\n🧪 Re-testing /api/jobs with data...")
    response = make_request("GET", "/jobs")
    
    if response and response.status_code == 200:
        jobs = response.json()
        print(f"✅ /api/jobs now returns {len(jobs)} jobs")
        if len(jobs) > 0:
            job = jobs[0]
            print(f"   Job: {job.get('title')} - Status: {job.get('status')} - Created: {job.get('created_at', 'N/A')[:19] if job.get('created_at') else 'N/A'}")
    else:
        print(f"❌ Jobs endpoint failed: {response.status_code if response else 'No response'}")
    
    # Test analytics endpoint
    print("\n🧪 Re-testing /api/analytics/dashboard with data...")
    response = make_request("GET", "/analytics/dashboard")
    
    if response and response.status_code == 200:
        analytics = response.json()
        print(f"✅ Analytics endpoint working")
        
        # Show key metrics
        print(f"   Active Jobs: {analytics.get('active_jobs', 'N/A')}")
        print(f"   Total Candidates: {analytics.get('total_candidates', {}).get('count', 'N/A')}")
        print(f"   Recent Activity Items: {len(analytics.get('recent_activity', []))}")
        
        # Show pipeline funnel
        pipeline = analytics.get('pipeline_funnel', {})
        if pipeline:
            print(f"   Pipeline Funnel: new={pipeline.get('new', 0)}, shortlisted={pipeline.get('shortlisted', 0)}, hired={pipeline.get('hired', 0)}")
    else:
        print(f"❌ Analytics endpoint failed: {response.status_code if response else 'No response'}")

if __name__ == "__main__":
    test_with_data()