import json
import os


CITIES = [
    "Bengaluru", "Bangalore",
    "Hyderabad",
    "Pune",
    "Mumbai",
    "Noida",
    "Chennai",
    "Gurgaon", "Gurugram",
    "Delhi",
]

INCLUDE_KEYWORDS = [
    "java", "spring boot", "springboot", "spring-boot",
    "backend engineer", "back-end engineer", "back end engineer",
    "software engineer", "software developer", "sde",
    "backend developer", "back-end developer", "full stack",
    "sde i", "sde ii", "sde 1", "sde 2",
    "software engineer i", "software engineer ii",
    "software engineer 1", "software engineer 2",
    "associate developer", "associate engineer",
    "microservice", "aws", "kafka", "rest api", "restapi", "restful",
    "node.js", "nodejs", "typescript",
    "spring security", "spring cloud",
    "distributed system", "event-driven", "event driven",
]

EXCLUDE_KEYWORDS = [
    "senior", "sr.", "staff", "principal", "manager", "vp ", "vice president",
    "director", "lead", "architect", "head of",
    "frontend", "front-end", "front end", "react", "ui ",
    "android", "ios",
    "intern", "trainee", "fresher", "0-1",
    "supportability", "support engineer", "technical support", "technical services",
    "solutions engineer", "sales engineer",
    "systems engineer",
    "devops engineer", "site reliability", "sre",
    "qa engineer", "test engineer", "quality assurance",
    "data engineer", "data scientist", "data analyst", "data & ai",
    "sde iii", "sde iv", "sde v",
    " sde 3", " sde 4", " sde 5",
    "software engineer iii", "software engineer iv",
    "software engineer 3", "software engineer 4",
    "engineer 3", "engineer iii", "engineer 4", "engineer iv",
    "engineer v", "engineer 5",
    "staff engineer", "principal engineer",
    "salesforce", "csoc engineer", "security engineer",
]

EXPERIENCE_PATTERNS = [
    (r"(\d+)\+?\s*(?:years|yrs|yr)", True),
    (r"(\d+)\s*[-–to]+\s*(\d+)\s*(?:years|yrs|yr)", False),
]


def load_companies():
    path = os.path.join(os.path.dirname(__file__), "companies.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)
