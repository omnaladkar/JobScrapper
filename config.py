import json
import os


CITIES = [
    "Bengaluru", "Bangalore",
    "Hyderabad",
    "Pune",
    "Mumbai",
    "Noida",
]

INCLUDE_KEYWORDS = [
    "java", "spring boot", "springboot", "spring-boot",
    "backend engineer", "back-end engineer", "back end engineer",
    "software engineer",
    "microservice",
    "aws",
    "kafka",
    "rest api", "restapi", "restful",
]

EXCLUDE_KEYWORDS = [
    "senior", "sr.", " sr", "staff", "principal", "manager", "vp ", "vice president",
    "frontend", "front-end", "front end",
    "android",
    "ios",
]

EXPERIENCE_PATTERNS = [
    (r"(\d+)\+?\s*(?:years|yrs|yr)", True),
    (r"(\d+)\s*[-–to]+\s*(\d+)\s*(?:years|yrs|yr)", False),
]


def load_companies():
    path = os.path.join(os.path.dirname(__file__), "companies.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)
