// Score engine — TypeScript port of the app's Python matching engine.
// Runs entirely in the browser so the free tier costs nothing to serve.

export type Recommendation = "APPLY" | "CONSIDER" | "LOW_PRIORITY";

export interface FitResult {
  score: number;
  role_score: number;
  skills_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  matched_skills: string[];
  missing_skills: string[];
  reasons: string[];
  recommendation: Recommendation;
}

export const WEIGHTS = {
  role: 0.25,
  skills: 0.3,
  experience: 0.15,
  location: 0.15,
  company: 0.1,
  salary: 0.05,
} as const;

const SENIORITY_BLOCK = [
  "senior", "sr.", "staff", "principal", "director", "lead",
  "architect", "head", "manager", "vp", "vice president",
];
const EXPERIENCE_BLOCK = ["intern", "trainee", "fresher"];
const BONUS_MISSING = ["kubernetes", "grpc", "go", "python", "react"];

export function recommendationFor(score: number): Recommendation {
  if (score >= 80) return "APPLY";
  if (score >= 55) return "CONSIDER";
  return "LOW_PRIORITY";
}

function roleScore(title: string, targetRoles: string[]): [number, string[]] {
  const t = (title || "").toLowerCase();
  const reasons: string[] = [];
  if (!t) return [0, reasons];
  if (SENIORITY_BLOCK.some((k) => t.includes(k)))
    return [15, ["Title looks senior for target level"]];
  if (EXPERIENCE_BLOCK.some((k) => t.includes(k)))
    return [15, ["Title is intern/fresher level"]];
  const backend = ["backend", "back-end", "back end", "java", "spring"].some((k) => t.includes(k));
  let score = backend ? 100 : 70;
  for (const role of targetRoles) {
    const r = role.toLowerCase();
    if (r && (t.includes(r) || r.includes(t))) {
      score = 100;
      reasons.push(`Title matches target role: ${role}`);
      break;
    }
  }
  reasons.push("Backend/full-stack engineering title");
  return [score, reasons];
}

function skillsScore(descText: string, skills: string[]): [number, string[], string[]] {
  const text = descText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of skills) {
    if (text.includes(skill.toLowerCase())) matched.push(skill);
    else if (BONUS_MISSING.includes(skill.toLowerCase())) missing.push(skill);
  }
  if (!matched.length) return [0, matched, missing];
  const score = Math.min(100, 40 + matched.length * 12);
  return [score, matched, missing];
}

function experienceScore(profileYears: number, jobExperience: string): [number, string[]] {
  const reasons: string[] = [];
  if (!jobExperience) return [100, ["No explicit experience requirement found"]];
  const m = jobExperience.toLowerCase().match(/(\d+)\s*(?:\+|to|-|\s*[-–])?\s*(\d+)?\s*(?:years|yrs|yr)/);
  if (!m) return [80, [`Could not parse experience range (${jobExperience})`]];
  const low = parseInt(m[1], 10);
  const high = m[2] ? parseInt(m[2], 10) : low;
  if (profileYears < low) {
    const score = Math.max(10, 100 - (low - profileYears) * 25);
    reasons.push(`Requires ${low}+ yrs, profile has ${profileYears}`);
    return [score, reasons];
  }
  if (low <= profileYears && profileYears <= high) {
    reasons.push(`Experience ${low}-${high} yrs fits profile (${profileYears})`);
    return [100, reasons];
  }
  reasons.push(`At/above upper bound ${high} yrs`);
  return [70, reasons];
}

function locationScore(location: string, preferred: string[]): [number, string[]] {
  const loc = (location || "").toLowerCase();
  if (!loc) return [80, ["Location not specified"]];
  if (loc.includes("remote")) return [100, ["Remote role"]];
  if (!loc.includes("india")) return [30, ["Not India - outside preferred geography"]];
  for (const city of preferred) {
    const c = city.toLowerCase();
    if ((c === "bangalore" || c === "bengaluru") && (loc.includes("bangalore") || loc.includes("bengaluru")))
      return [100, ["Preferred location: Bangalore/Bengaluru"]];
    if (loc.includes(c)) return [100, [`Preferred location: ${city.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1)).replace("Bengaluru", "Bangalore")}`]];
  }
  return [60, [`India role but city not in preferred list (${location})`]];
}

function companyScore(company: string): [number, string[]] {
  const c = (company || "").toLowerCase();
  if (!c) return [70, []];
  if (["amazon", "microsoft", "google", "meta", "uber", "databricks", "stripe", "chase", "jp morgan", "goldman"].some((k) => c.includes(k)))
    return [100, ["Large product/tech company"]];
  return [75, ["Company noted"]];
}

function salaryScore(salaryText: string, minLpa: number): [number, string[]] {
  if (!salaryText) return [75, ["Salary not listed - assume negotiable"]];
  const text = salaryText.toLowerCase();
  const amounts = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(?:lpa|lakh)/g)).map((m) => parseFloat(m[1]));
  if (!amounts.length) return [75, [`Could not parse salary (${salaryText})`]];
  const maxAmount = Math.max(...amounts);
  if (maxAmount >= minLpa) return [100, [`Salary ${Math.round(maxAmount)} LPA meets minimum ${minLpa}`]];
  return [35, [`Salary ${Math.round(maxAmount)} LPA below minimum ${minLpa}`]];
}

export interface ScoreInput {
  title: string;
  description: string;
  experience?: string;
  location?: string;
  company?: string;
  salary?: string;
  targetRoles?: string[];
  skills?: string[];
  experienceYears?: number;
  minLpa?: number;
  preferredLocations?: string[];
}

export function computeFit(input: ScoreInput): FitResult {
  const profile = {
    target_roles: input.targetRoles ?? [
      "Backend Engineer", "Software Engineer", "Java Developer",
      "Java Backend Developer", "Spring Boot Developer",
      "Software Development Engineer", "Backend Software Engineer",
    ],
    skills: input.skills ?? [
      "java", "spring boot", "microservices", "kafka", "redis",
      "postgresql", "mysql", "aws", "docker", "sql",
      "javascript", "typescript", "c++",
    ],
    experience_years: input.experienceYears ?? 2,
    target_salary_min_lpa: input.minLpa ?? 12,
    preferred_locations: input.preferredLocations ?? [
      "bangalore", "bengaluru", "hyderabad", "pune", "mumbai", "noida", "remote",
    ],
  };

  const roleText = input.title || input.description;
  const [role, roleReasons] = roleScore(roleText, profile.target_roles);
  const [skills, matched_skills, missing_skills] = skillsScore(
    `${roleText} ${input.description || ""}`,
    profile.skills
  );
  const [exp, expReasons] = experienceScore(profile.experience_years, input.experience || "");
  const [loc, locReasons] = locationScore(input.location || "", profile.preferred_locations);
  const [comp, compReasons] = companyScore(input.company || "");
  const [salary, salReasons] = salaryScore(input.salary || "", profile.target_salary_min_lpa);

  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        role * WEIGHTS.role +
          skills * WEIGHTS.skills +
          exp * WEIGHTS.experience +
          loc * WEIGHTS.location +
          comp * WEIGHTS.company +
          salary * WEIGHTS.salary
      )
    ) * 10
  ) / 10;

  const reasons: string[] = [];
  reasons.push(...roleReasons);
  if (matched_skills.length) reasons.push("Skills found: " + matched_skills.slice(0, 6).join(", "));
  if (expReasons.length) reasons.push(expReasons[0]);
  if (locReasons.length) reasons.push(locReasons[0]);
  void compReasons;
  void salReasons;

  return {
    score,
    role_score: Math.round(role * 10) / 10,
    skills_score: Math.round(skills * 10) / 10,
    experience_score: Math.round(exp * 10) / 10,
    location_score: Math.round(loc * 10) / 10,
    salary_score: Math.round(salary * 10) / 10,
    matched_skills,
    missing_skills,
    reasons,
    recommendation: recommendationFor(score),
  };
}