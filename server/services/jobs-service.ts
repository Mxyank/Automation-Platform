import type { Job, JobFilter } from "../../shared/jobs-types";

const sampleJobs: Job[] = [
  {
    id: "job-1",
    title: "Senior DevOps Engineer",
    company: "Amazon Web Services",
    location: "Bangalore",
    type: "full-time",
    experienceLevel: "senior",
    salary: "₹35-50 LPA",
    description: "Join AWS to build and maintain cloud infrastructure at scale. Work on cutting-edge container orchestration and CI/CD pipelines.",
    requirements: ["5+ years DevOps experience", "Strong AWS knowledge", "Kubernetes expertise", "Terraform proficiency"],
    skills: ["AWS", "Kubernetes", "Terraform", "Docker", "Python", "CI/CD"],
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.amazon.jobs/en/jobs/2859747/senior-devops-engineer",
    source: "Amazon Jobs",
    logo: "https://logo.clearbit.com/amazon.com"
  },
  {
    id: "job-2",
    title: "Cloud Engineer - Azure",
    company: "Microsoft",
    location: "Hyderabad",
    type: "full-time",
    experienceLevel: "mid",
    salary: "₹25-40 LPA",
    description: "Design and implement Azure cloud solutions for enterprise clients. Focus on infrastructure automation and security.",
    requirements: ["3+ years cloud experience", "Azure certifications preferred", "Infrastructure as Code", "Networking knowledge"],
    skills: ["Azure", "ARM Templates", "PowerShell", "Kubernetes", "Networking"],
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://careers.microsoft.com/us/en/search-results?keywords=cloud%20engineer",
    source: "Microsoft Careers",
    logo: "https://logo.clearbit.com/microsoft.com"
  },
  {
    id: "job-3",
    title: "Kubernetes Administrator",
    company: "Google Cloud",
    location: "Remote",
    type: "remote",
    experienceLevel: "senior",
    salary: "$150,000 - $200,000",
    description: "Manage and optimize Kubernetes clusters for Google Cloud customers. Lead container orchestration best practices.",
    requirements: ["5+ years Kubernetes", "CKA/CKAD certified", "GCP experience", "Strong troubleshooting skills"],
    skills: ["Kubernetes", "GKE", "Helm", "Prometheus", "Grafana", "Go"],
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://careers.google.com/jobs/results/?q=kubernetes",
    source: "Google Careers",
    logo: "https://logo.clearbit.com/google.com"
  },
  {
    id: "job-4",
    title: "DevOps Engineer - Fresher",
    company: "Infosys",
    location: "Pune",
    type: "full-time",
    experienceLevel: "fresher",
    salary: "₹4-6 LPA",
    description: "Entry-level DevOps role with training provided. Work on CI/CD pipelines and cloud infrastructure for global clients.",
    requirements: ["B.Tech/BE in CS/IT", "Basic Linux knowledge", "Scripting basics", "Eager to learn"],
    skills: ["Linux", "Git", "Jenkins", "Docker", "Python", "Bash"],
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.infosys.com/careers.html",
    source: "Infosys Careers",
    logo: "https://logo.clearbit.com/infosys.com"
  },
  {
    id: "job-5",
    title: "SRE Engineer",
    company: "Netflix",
    location: "United States",
    type: "remote",
    experienceLevel: "senior",
    salary: "$180,000 - $250,000",
    description: "Build and maintain highly available systems serving millions of users. Focus on reliability, scalability, and performance.",
    requirements: ["6+ years SRE/DevOps", "Large-scale distributed systems", "Incident management", "Chaos engineering"],
    skills: ["AWS", "Kubernetes", "Spinnaker", "Chaos Engineering", "Java", "Python"],
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://jobs.netflix.com/search?q=sre",
    source: "Netflix Jobs",
    logo: "https://logo.clearbit.com/netflix.com"
  },
  {
    id: "job-6",
    title: "Junior Cloud Engineer",
    company: "TCS",
    location: "Chennai",
    type: "full-time",
    experienceLevel: "junior",
    salary: "₹6-10 LPA",
    description: "Support cloud migration projects for enterprise clients. Learn and implement cloud best practices.",
    requirements: ["1-2 years experience", "AWS/Azure basics", "Linux administration", "Good communication"],
    skills: ["AWS", "Linux", "Docker", "Ansible", "Shell Scripting"],
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.tcs.com/careers",
    source: "TCS Careers",
    logo: "https://logo.clearbit.com/tcs.com"
  },
  {
    id: "job-7",
    title: "Platform Engineer",
    company: "Uber",
    location: "Bangalore",
    type: "hybrid",
    experienceLevel: "senior",
    salary: "₹45-65 LPA",
    description: "Build internal developer platforms and tooling. Enable engineering teams with self-service infrastructure.",
    requirements: ["5+ years platform/DevOps", "Kubernetes at scale", "Developer experience focus", "Strong coding skills"],
    skills: ["Kubernetes", "Go", "Terraform", "ArgoCD", "Platform Engineering"],
    postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.uber.com/us/en/careers/",
    source: "Uber Careers",
    logo: "https://logo.clearbit.com/uber.com"
  },
  {
    id: "job-8",
    title: "AWS Solutions Architect",
    company: "Accenture",
    location: "Mumbai",
    type: "full-time",
    experienceLevel: "lead",
    salary: "₹40-60 LPA",
    description: "Design and implement AWS solutions for enterprise clients. Lead technical teams and drive cloud adoption.",
    requirements: ["8+ years experience", "AWS Solutions Architect certification", "Pre-sales experience", "Leadership skills"],
    skills: ["AWS", "Architecture", "Migration", "Consulting", "Leadership"],
    postedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.accenture.com/us-en/careers",
    source: "Accenture Careers",
    logo: "https://logo.clearbit.com/accenture.com"
  },
  {
    id: "job-9",
    title: "DevSecOps Engineer",
    company: "Goldman Sachs",
    location: "Hyderabad",
    type: "full-time",
    experienceLevel: "mid",
    salary: "₹30-45 LPA",
    description: "Implement security in CI/CD pipelines. Automate security scanning and compliance checks.",
    requirements: ["3-5 years DevOps", "Security tools experience", "Compliance knowledge", "SAST/DAST tools"],
    skills: ["Security", "CI/CD", "Kubernetes", "Vault", "SonarQube", "OWASP"],
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.goldmansachs.com/careers/",
    source: "Goldman Sachs",
    logo: "https://logo.clearbit.com/goldmansachs.com"
  },
  {
    id: "job-10",
    title: "Docker/Kubernetes Specialist",
    company: "Red Hat",
    location: "Delhi NCR",
    type: "full-time",
    experienceLevel: "senior",
    salary: "₹35-50 LPA",
    description: "Help enterprises adopt container technologies. Implement OpenShift solutions and provide technical guidance.",
    requirements: ["5+ years containers", "OpenShift experience", "Customer-facing role", "Training/mentoring"],
    skills: ["OpenShift", "Kubernetes", "Docker", "RHEL", "Ansible", "Consulting"],
    postedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.redhat.com/en/jobs",
    source: "Red Hat Jobs",
    logo: "https://logo.clearbit.com/redhat.com"
  },
  {
    id: "job-11",
    title: "Cloud Infrastructure Engineer",
    company: "Flipkart",
    location: "Bangalore",
    type: "full-time",
    experienceLevel: "mid",
    salary: "₹25-40 LPA",
    description: "Build and manage cloud infrastructure for India's largest e-commerce platform. Handle massive scale during sale events.",
    requirements: ["3-5 years experience", "AWS/GCP", "High availability systems", "Automation"],
    skills: ["AWS", "Terraform", "Kubernetes", "Python", "MySQL", "Redis"],
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.flipkartcareers.com/",
    source: "Flipkart Careers",
    logo: "https://logo.clearbit.com/flipkart.com"
  },
  {
    id: "job-12",
    title: "GitOps Engineer",
    company: "GitLab",
    location: "Remote",
    type: "remote",
    experienceLevel: "mid",
    salary: "$120,000 - $160,000",
    description: "Implement GitOps workflows using GitLab CI/CD. Help customers adopt DevOps best practices.",
    requirements: ["3+ years DevOps", "Git expertise", "Kubernetes", "GitOps experience"],
    skills: ["GitLab", "Kubernetes", "ArgoCD", "Flux", "Terraform", "CI/CD"],
    postedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://about.gitlab.com/jobs/",
    source: "GitLab Jobs",
    logo: "https://logo.clearbit.com/gitlab.com"
  },
  {
    id: "job-13",
    title: "Monitoring & Observability Engineer",
    company: "Datadog",
    location: "Singapore",
    type: "full-time",
    experienceLevel: "senior",
    salary: "SGD 150,000 - 200,000",
    description: "Build monitoring solutions for cloud-native applications. Work on Prometheus, Grafana, and distributed tracing.",
    requirements: ["5+ years monitoring", "Prometheus/Grafana", "APM tools", "Distributed systems"],
    skills: ["Prometheus", "Grafana", "Datadog", "OpenTelemetry", "Go", "Python"],
    postedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.datadoghq.com/careers/",
    source: "Datadog Careers",
    logo: "https://logo.clearbit.com/datadog.com"
  },
  {
    id: "job-14",
    title: "DevOps Trainee",
    company: "Wipro",
    location: "Bangalore",
    type: "full-time",
    experienceLevel: "fresher",
    salary: "₹3.5-5 LPA",
    description: "6-month training program covering DevOps fundamentals. Learn CI/CD, containers, and cloud technologies.",
    requirements: ["BE/BTech fresher", "Good academics", "Willingness to learn", "Programming basics"],
    skills: ["Linux", "Git", "Programming", "Networking"],
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://careers.wipro.com/",
    source: "Wipro Careers",
    logo: "https://logo.clearbit.com/wipro.com"
  },
  {
    id: "job-15",
    title: "Terraform Expert",
    company: "HashiCorp",
    location: "Remote",
    type: "remote",
    experienceLevel: "principal",
    salary: "$200,000 - $280,000",
    description: "Lead Terraform product development and enterprise customer success. Define IaC best practices globally.",
    requirements: ["10+ years infrastructure", "Terraform expert", "Go programming", "Public speaking"],
    skills: ["Terraform", "Go", "AWS", "Azure", "GCP", "Architecture"],
    postedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.hashicorp.com/careers",
    source: "HashiCorp Careers",
    logo: "https://logo.clearbit.com/hashicorp.com"
  },
  {
    id: "job-16",
    title: "Site Reliability Engineer",
    company: "Razorpay",
    location: "Bangalore",
    type: "hybrid",
    experienceLevel: "senior",
    salary: "₹35-55 LPA",
    description: "Ensure 99.99% uptime for payment infrastructure. Build resilient systems handling millions of transactions.",
    requirements: ["5+ years SRE/DevOps", "Payment systems", "Incident management", "Performance optimization"],
    skills: ["Kubernetes", "AWS", "Python", "PostgreSQL", "Kafka", "Redis"],
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://razorpay.com/careers/",
    source: "Razorpay Careers",
    logo: "https://logo.clearbit.com/razorpay.com"
  },
  {
    id: "job-17",
    title: "Jenkins Administrator",
    company: "Cognizant",
    location: "Pune",
    type: "full-time",
    experienceLevel: "junior",
    salary: "₹8-12 LPA",
    description: "Manage Jenkins infrastructure for multiple projects. Create and maintain CI/CD pipelines.",
    requirements: ["2-3 years experience", "Jenkins administration", "Pipeline as Code", "Git"],
    skills: ["Jenkins", "Groovy", "Git", "Docker", "Maven", "Shell"],
    postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://careers.cognizant.com/",
    source: "Cognizant Careers",
    logo: "https://logo.clearbit.com/cognizant.com"
  },
  {
    id: "job-18",
    title: "Cloud Security Engineer",
    company: "Palo Alto Networks",
    location: "Bangalore",
    type: "full-time",
    experienceLevel: "senior",
    salary: "₹40-60 LPA",
    description: "Implement cloud security solutions. Work on CSPM, container security, and compliance automation.",
    requirements: ["5+ years security", "Cloud security certifications", "Compliance frameworks", "Security tools"],
    skills: ["Cloud Security", "Prisma Cloud", "AWS", "Kubernetes", "Compliance", "SIEM"],
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.paloaltonetworks.com/company/careers",
    source: "Palo Alto Networks",
    logo: "https://logo.clearbit.com/paloaltonetworks.com"
  },
  {
    id: "job-19",
    title: "Ansible Automation Engineer",
    company: "IBM",
    location: "Hyderabad",
    type: "full-time",
    experienceLevel: "mid",
    salary: "₹20-35 LPA",
    description: "Automate infrastructure provisioning and application deployment using Ansible. Support enterprise clients.",
    requirements: ["3-5 years automation", "Ansible certified", "Linux administration", "Python scripting"],
    skills: ["Ansible", "Ansible Tower", "Python", "Linux", "VMware", "RHEL"],
    postedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.ibm.com/employment/",
    source: "IBM Careers",
    logo: "https://logo.clearbit.com/ibm.com"
  },
  {
    id: "job-20",
    title: "AWS DevOps Engineer",
    company: "Zomato",
    location: "Delhi NCR",
    type: "hybrid",
    experienceLevel: "mid",
    salary: "₹25-40 LPA",
    description: "Build infrastructure for food delivery platform serving millions. Focus on cost optimization and scalability.",
    requirements: ["3-5 years DevOps", "AWS expertise", "Cost optimization", "Microservices"],
    skills: ["AWS", "Kubernetes", "Terraform", "Python", "MySQL", "MongoDB"],
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: "https://www.zomato.com/careers",
    source: "Zomato Careers",
    logo: "https://logo.clearbit.com/zomato.com"
  }
];

function isWithinTimeframe(postedAt: string, timeframe: string): boolean {
  const postedDate = new Date(postedAt);
  const now = new Date();
  const diffMs = now.getTime() - postedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (timeframe) {
    case '24h':
      return diffDays <= 1;
    case '7d':
      return diffDays <= 7;
    case '30d':
      return diffDays <= 30;
    case 'all':
    default:
      return true;
  }
}

export async function searchJobs(filters: JobFilter): Promise<Job[]> {
  let results = [...sampleJobs];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(job =>
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      job.skills.some(skill => skill.toLowerCase().includes(searchLower)) ||
      job.description.toLowerCase().includes(searchLower)
    );
  }

  if (filters.location && filters.location !== 'all') {
    const locationLower = filters.location.toLowerCase();
    results = results.filter(job =>
      job.location.toLowerCase().includes(locationLower)
    );
  }

  if (filters.experienceLevel && filters.experienceLevel !== '') {
    results = results.filter(job =>
      job.experienceLevel === filters.experienceLevel
    );
  }

  if (filters.type && filters.type !== '') {
    results = results.filter(job =>
      job.type === filters.type
    );
  }

  if (filters.postedWithin && filters.postedWithin !== 'all') {
    results = results.filter(job =>
      isWithinTimeframe(job.postedAt, filters.postedWithin!)
    );
  }

  results.sort((a, b) => 
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  return results;
}

export async function getJobById(id: string): Promise<Job | undefined> {
  return sampleJobs.find(job => job.id === id);
}

export function getJobStats() {
  const totalJobs = sampleJobs.length;
  const remoteJobs = sampleJobs.filter(j => j.type === 'remote' || j.type === 'hybrid').length;
  const fresherJobs = sampleJobs.filter(j => j.experienceLevel === 'fresher' || j.experienceLevel === 'junior').length;
  
  return {
    totalJobs,
    remoteJobs,
    fresherJobs,
    companies: new Set(sampleJobs.map(j => j.company)).size,
  };
}
