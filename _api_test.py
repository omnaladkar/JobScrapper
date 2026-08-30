from fastapi.testclient import TestClient

from app.database import init_db
from app.main import app

init_db()

client = TestClient(app)

print("=== Profile (defaults) ===")
r = client.get("/api/profile")
print(r.status_code, r.json())

print("\n=== Add manual job ===")
r = client.post("/api/jobs", json={
    "company": "XYZ Technologies",
    "role": "Backend Engineer",
    "location": "Bangalore, India",
    "experience": "2-4 years",
    "description": "Java, Spring Boot, AWS, Kafka, PostgreSQL, Microservices",
    "apply_url": "https://xyz.example/backend",
    "salary": "15 LPA",
})
print(r.status_code)
job = r.json()
print("job id:", job["id"], "| match:", job["match"]["score"], job["match"]["recommendation"])
print("reasons:", job["match"]["reasons"])
print("matched:", job["match"]["matched_skills"])

print("\n=== Add a poor-match job ===")
r = client.post("/api/jobs", json={
    "company": "Old Corp",
    "role": "Senior Frontend Engineer",
    "location": "San Francisco, USA",
    "experience": "8+ years",
    "description": "React, HTML, CSS only",
    "apply_url": "https://old.example/frontend",
})
print(r.status_code, r.json()["match"]["score"], r.json()["match"]["recommendation"])

print("\n=== List jobs ===")
r = client.get("/api/jobs?min_score=40")
jobs = r.json()
print("count:", len(jobs))
for j in jobs:
    print(f"  {j['company']} | {j['role']} | score={j['match']['score']}")

print("\n=== Dashboard ===")
r = client.get("/api/dashboard")
print(r.json())

print("\n=== Contacts for job (seeded NOT FOUND) ===")
r = client.post(f"/api/jobs/{job['id']}/contacts")
print(r.status_code)
for c in r.json():
    print(f"  {c['contact_type']}: {c['name']} ({c['role']}) conf={c['confidence']}")

print("\n=== Message for contact ===")
cid = r.json()[1]["id"]
r = client.post(f"/api/contacts/{cid}/message", json={"role": "referral"})
print(r.status_code)
print(r.json()["body"])

print("\n=== Application add + status update ===")
r = client.post(f"/api/applications?job_id={job['id']}", json={"status": "NEW"})
print("add:", r.status_code, r.json()["status"])
aid = r.json()["id"]
r = client.patch(f"/api/applications/{aid}", json={"status": "APPLIED", "notes": "Applied via company site"})
print("update:", r.status_code, r.json()["status"], r.json()["notes"])

print("\n=== Dashboard after app ===")
print(client.get("/api/dashboard").json()["stats"])
