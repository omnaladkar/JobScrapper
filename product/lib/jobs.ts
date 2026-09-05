// Job snapshot + resume-skill extraction.
// The snapshot is a static export of the scraper DB (scripts/export_jobs.py),
// so the free product costs nothing to host while using real jobs.

export interface Job {
  id: number;
  company: string;
  role: string;
  location: string;
  experience: string;
  posted_date: string;
  salary: string;
  description: string;
  apply_url: string;
  source: string;
  score: number;
  recommendation: string;
  role_score: number;
  skills_score: number;
  experience_score: number;
  location_score: number;
  salary_score: number;
  company_score: number;
  matched_skills: string[];
  missing_skills: string[];
  reasons: string[];
}

export interface JobSnapshot {
  exported_at: string;
  jobs: Job[];
}

// Common tech skills to detect inside a pasted resume.
const RESUME_SKILLS = [
  "java", "spring boot", "spring", "microservices", "kafka", "redis",
  "postgresql", "mysql", "mongodb", "aws", "docker", "kubernetes", "k8s",
  "sql", "javascript", "typescript", "node", "node.js", "react", "react.js",
  "angular", "vue", "python", "django", "flask", "go", "golang", "golang",
  "c++", "c#", ".net", "ruby", "rails", "php", "laravel", "graphql",
  "grpc", "rest", "rest api", "restful", "terraform", "jenkins", "github actions",
  "ci/cd", "git", "linux", "bash", "shell", "html", "css", "tailwind",
  "sass", "webpack", "react native", "flutter", "kotlin", "swift", "android",
  "ios", "machine learning", "deep learning", "nlp", "tensorflow", "pytorch",
  "pandas", "numpy", "airflow", "spark", "hadoop", "databricks", "snowflake",
  "clickhouse", "elasticsearch", "solr", "rabbitmq", "activemq", "pulsar",
  "nginx", "haproxy", "oracle", "db2", "cosmos db", "dynamodb", "cassandra",
  "hibernate", "jpa", "jdbc", "spring mvc", "spring boot", "spring cloud",
  "junit", "mockito", "testng", "selenium", "playwright", "cypress",
  "jira", "confluence", "agile", "scrum", "kanban", "micro frontend",
  "serverless", "lambda", "ec2", "s3", "rds", "sqs", "sns", "cloudwatch",
  "azure", "gcp", "google cloud", "firebase", "vercel", "netlify", "heroku",
  "fastapi", "django rest", "express", "nestjs", "next.js", "nextjs", "nuxt",
  "solidity", "blockchain", "ethereum", "web3", "tailwindcss",
  "system design", "distributed systems", "high availability", "scalability",
  "performance tuning", "caching", "cd", "micro frontend", "oauth", "jwt",
  "api gateway", "webhooks", "web sockets", "websocket", "event-driven",
  "message queue", "data structures", "algorithms", "oop", "clean code",
];

// Parse applied skills out of a resume text (lowercased, deduped, ordered by length desc).
export function extractSkills(resumeText: string): string[] {
  const text = " " + resumeText.toLowerCase().replace(/\s+/g, " ") + " ";
  const found = new Set<string>();
  for (const skill of RESUME_SKILLS) {
    if (text.includes(" " + skill + " ") || text.includes(skill + ",")) found.add(skill);
  }
  // Also catch skills inside common punctuation boundaries even if not space-wrapped.
  for (const skill of RESUME_SKILLS) {
    if (found.has(skill)) continue;
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?:^|[^a-z])${escaped}(?:$|[^a-z])`).test(text)) found.add(skill);
  }
  return Array.from(found).sort((a, b) => b.length - a.length);
}

export type { };

let cache: Promise<JobSnapshot> | null = null;

export function loadJobs(): Promise<JobSnapshot> {
  if (!cache) {
    cache = fetch("/jobs.json").then((r) => {
      if (!r.ok) throw new Error("Failed to load jobs snapshot");
      return r.json();
    });
  }
  return cache;
}

// --- Scoring a list of real jobs against a pasted resume -------------------

export interface ScoredJob {
  job: Job;
  score: number;
  recommendation: string;
  skills_score: number;
  matched_skills: string[];
  gap_skills: string[];
  reasons: string[];
}

import { computeFit } from "./scoreEngine";

// Skills that a job description can "ask for" — a superset of the resume detector,
// because JDs name many more technologies than a typical resume lists.
const JD_SKILLS = [
  ...RESUME_SKILLS,
  "amazon web services", "aws cloud", "amazon rds", "amazon ec2", "amazon s3",
  "kafka streams", "springdata", "spring data", "spring jpa", "springbatch",
  "spring batch", "hibernate", "mybatis", "flyway", "liquibase", "redis stream",
  "redis cache", "database", "nosql", "rdbms", "sql query", "indexing",
  "postgres", "mysql", "oracle sql", "pl/sql", "cosmos", "cassandra",
  "message broker", "event streaming", "event-driven architecture",
  "reactive", "webflux", "vert.x", "quarkus", "micronaut", "akka",
  "soap", "openapi", "swagger", "actuator", "circuit breaker", "resilience4j",
  "load balancing", "autoscaling", "ntp", "observability", "monitoring",
  "prometheus", "grafana", "datadog", "new relic", "sentry", "logstash",
  "kibana", "opentelemetry", "tail -f", "deployment automation", "infrastructure as code",
  "pipelines", "containerization", "microservice", "distributed computing",
  "transaction management", "concurrency", "multithreading", "threading",
  "design patterns", "system design", "low latency", "high throughput",
];

// Which skills does this job description explicitly ask for?
export function extractJobSkills(job: Job): string[] {
  const text = ` ${(
    job.role +
    " " +
    job.description +
    " " +
    job.experience
  )
    .toLowerCase()
    .replace(/[<>,.\/\/&;:()\[\]{}"']+/g, " ")
    .replace(/\s+/g, " ")} `;
  const found = new Set<string>();
  for (const skill of JD_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?:^|[^a-z])${escaped}(?:$|[^a-z])`).test(text)) found.add(skill);
  }
  return Array.from(found).sort((a, b) => b.length - a.length);
}

export function scoreJobForResume(job: Job, resumeText: string): ScoredJob {
  const resumeSkills = extractSkills(resumeText);
  const jobSkills = extractJobSkills(job);

  const fit = computeFit({
    title: job.role,
    description: job.description,
    experience: job.experience,
    location: job.location,
    company: job.company,
    salary: job.salary,
    skills: resumeSkills.length ? resumeSkills : undefined,
  });

  // matched = skills the job asks for that the resume has
  const matched = jobSkills.filter((s) => resumeSkills.includes(s));
  // gap = skills the job asks for that the resume lacks (fixable by resume edit)
  const gap = jobSkills.filter((s) => !resumeSkills.includes(s));

  return {
    job,
    score: fit.score,
    recommendation: fit.recommendation,
    skills_score: fit.skills_score,
    matched_skills: matched,
    gap_skills: gap,
    reasons: fit.reasons,
  };
}

export function scoreAllJobs(jobs: Job[], resumeText: string): ScoredJob[] {
  return jobs
    .map((job) => scoreJobForResume(job, resumeText))
    .sort((a, b) => b.score - a.score);
}