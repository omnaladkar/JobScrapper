// Resume gap → rewrite suggestions.
// Pure heuristic surfaces of adjacent experience — no LLM, no API cost.

export interface BulletSuggestion {
  skill: string;
  bullet: string;
  basedOn: string;
}

// For a missing skill, which related skills on a resume unlock a credible bullet?
const RELATED: Record<string, { tags: string[]; template: (skill: string) => string }> = {
  kubernetes: {
    tags: ["docker", "docker compose", "aws", "gcp", "azure", "ci/cd", "jenkins", "terraform"],
    template: (skill) =>
      `Orchestrated containerized microservices on a managed cluster and automated rolling deployments via CI/CD (Docker → ${skill}).`,
  },
  grpc: {
    tags: ["rest", "rest api", "graphql", "kafka", "microservices", "websocket"],
    template: (skill) =>
      `Built high-throughput inter-service communication, extending REST/graphql services with ${skill} endpoints for low-latency calls.`,
  },
  python: {
    tags: ["java", "spring boot", "typescript", "javascript", "scripts", "automation", "data"],
    template: (skill) =>
      `Automated data pipelines and analysis scripts in ${skill}, complementing a primarily Java/Spring backend.`,
  },
  go: {
    tags: ["java", "spring boot", "microservices", "concurrency", "kafka", "grpc"],
    template: (skill) =>
      `Implemented concurrent, high-throughput services — ported a latency-sensitive microservice to ${skill} to cut response times.`,
  },
  react: {
    tags: ["javascript", "typescript", "html", "css", "node", "frontend", "web"],
    template: (skill) =>
      `Built interactive dashboards and internal tools in ${skill} (TypeScript) on top of a Java/Spring API layer.`,
  },
  "caching": {
    tags: ["redis", "redis cache", "performance tuning", "low latency", "high throughput"],
    template: () =>
      `Cut hot-path latency by introducing a caching layer on frequently-read data, reducing DB load and p99 response times.`,
  },
  kafka: {
    tags: ["event-driven", "message queue", "rabbitmq", "activemq", "event streaming", "streaming"],
    template: () =>
      `Architected event-driven flows on a message broker (topic partitioning, consumer groups) to decouple services.`,
  },
  aws: {
    tags: ["cloud", "deployment", "docker", "lambda", "serverless", "ec2", "gcp", "azure"],
    template: () =>
      `Deployed and monitored services on the cloud — containerized apps, managed DBs, and CI/CD pipelines (no on-prem ops).`,
  },
  sql: {
    tags: ["postgresql", "mysql", "database", "rdbms", "query", "data"],
    template: () =>
      `Wrote and tuned complex SQL (joins, indexes, window functions) against relational stores for reporting and API workloads.`,
  },
  mongodb: {
    tags: ["nosql", "database", "postgresql", "mysql", "data", "elasticsearch"],
    template: () =>
      `Modeled flexible document schemas in a NoSQL store alongside relational data for high-write workloads.`,
  },
  terraform: {
    tags: ["aws", "gcp", "azure", "infrastructure", "deployment", "linux"],
    template: () =>
      `Provisioned cloud infrastructure as code (VPC, compute, managed services) with repeatable environment setup.`,
  },
  grafana: {
    tags: ["monitoring", "observability", "prometheus", "datadog", "cloudwatch"],
    template: () =>
      `Set up service dashboards and alerting to drive p99 improvements and catch regressions early.`,
  },
};

const GENERIC_TEMPLATE = (skill: string) =>
  `Shipped ${skill} in a recent project — integrated it into the ${skill} feature set described in the job to match their stack.`;

export function suggestBullet(skill: string, resumeSkills: string[]): BulletSuggestion | null {
  const key = skill.toLowerCase();
  const rule = RELATED[key];
  if (rule) {
    for (const tag of rule.tags) {
      if (resumeSkills.includes(tag)) {
        return { skill, bullet: rule.template(key), basedOn: tag };
      }
    }
    return null;
  }
  // Generic: surface any plausible adjacent skill so every gap gets an action.
  for (const mine of resumeSkills) {
    if (mine.length >= 3 && mine !== key) {
      return { skill, bullet: GENERIC_TEMPLATE(key), basedOn: mine };
    }
  }
  return null;
}