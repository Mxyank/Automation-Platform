export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface InterviewCategory {
  id: string;
  name: string;
  icon: string;
  questions: InterviewQuestion[];
}

export const interviewCategories: InterviewCategory[] = [
  {
    id: 'devops',
    name: 'DevOps',
    icon: 'Settings',
    questions: [
      { id: 'devops-1', question: 'What is DevOps and why is it important?', answer: 'DevOps is a set of practices that combines software development (Dev) and IT operations (Ops) to shorten the development lifecycle and deliver high-quality software continuously. It emphasizes collaboration, automation, continuous integration/deployment, and monitoring.', difficulty: 'beginner' },
      { id: 'devops-2', question: 'Explain the difference between CI and CD.', answer: 'CI (Continuous Integration) is the practice of frequently merging code changes into a shared repository with automated builds and tests. CD can mean Continuous Delivery (automatically preparing code for release) or Continuous Deployment (automatically releasing to production after passing tests).', difficulty: 'beginner' },
      { id: 'devops-3', question: 'What is Infrastructure as Code (IaC)?', answer: 'IaC is the practice of managing and provisioning infrastructure through machine-readable configuration files rather than manual processes. Tools like Terraform, CloudFormation, and Ansible enable version control, repeatability, and automation of infrastructure.', difficulty: 'intermediate' },
      { id: 'devops-4', question: 'Explain Blue-Green deployment strategy.', answer: 'Blue-Green deployment maintains two identical production environments. The "blue" environment runs the current version while "green" runs the new version. Traffic is switched from blue to green once testing passes, allowing instant rollback if issues occur.', difficulty: 'intermediate' },
      { id: 'devops-5', question: 'What are the key metrics for measuring DevOps success?', answer: 'Key metrics include: Deployment Frequency, Lead Time for Changes, Mean Time to Recovery (MTTR), Change Failure Rate, and Mean Time Between Failures (MTBF). These DORA metrics help evaluate team performance and process efficiency.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    icon: 'Box',
    questions: [
      { id: 'k8s-1', question: 'What is Kubernetes and what problems does it solve?', answer: 'Kubernetes is an open-source container orchestration platform that automates deployment, scaling, and management of containerized applications. It solves problems like service discovery, load balancing, storage orchestration, self-healing, and horizontal scaling.', difficulty: 'beginner' },
      { id: 'k8s-2', question: 'Explain the difference between a Pod and a Deployment.', answer: 'A Pod is the smallest deployable unit containing one or more containers. A Deployment is a higher-level abstraction that manages Pods, providing declarative updates, rolling deployments, rollback capabilities, and replica management.', difficulty: 'beginner' },
      { id: 'k8s-3', question: 'What is a Kubernetes Service and its types?', answer: 'A Service is an abstraction that defines a logical set of Pods and a policy to access them. Types include: ClusterIP (internal only), NodePort (external via node ports), LoadBalancer (external via cloud LB), and ExternalName (DNS CNAME).', difficulty: 'intermediate' },
      { id: 'k8s-4', question: 'Explain Kubernetes namespaces and their use cases.', answer: 'Namespaces provide a mechanism for isolating groups of resources within a single cluster. Use cases include: separating environments (dev/staging/prod), team isolation, resource quota management, and access control through RBAC.', difficulty: 'intermediate' },
      { id: 'k8s-5', question: 'How does Horizontal Pod Autoscaler (HPA) work?', answer: 'HPA automatically scales the number of Pod replicas based on observed CPU utilization or custom metrics. It queries the metrics API, calculates desired replicas using the formula: desiredReplicas = ceil(currentReplicas * (currentMetric/targetMetric)), and adjusts accordingly.', difficulty: 'advanced' },
      { id: 'k8s-6', question: 'Explain Kubernetes Ingress and its components.', answer: 'Ingress manages external access to services, typically HTTP/HTTPS. Components include: Ingress resource (routing rules), Ingress controller (implements rules, e.g., Nginx, Traefik), and annotations for controller-specific configurations like SSL, rewrites, and rate limiting.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'docker',
    name: 'Docker',
    icon: 'Container',
    questions: [
      { id: 'docker-1', question: 'What is Docker and how does it differ from VMs?', answer: 'Docker is a platform for developing, shipping, and running applications in containers. Unlike VMs that virtualize entire operating systems, containers share the host OS kernel, making them lightweight, fast to start, and resource-efficient.', difficulty: 'beginner' },
      { id: 'docker-2', question: 'Explain the difference between Docker image and container.', answer: 'A Docker image is a read-only template containing application code, libraries, and dependencies. A container is a running instance of an image - it adds a writable layer on top of the image and includes its own isolated filesystem, network, and process space.', difficulty: 'beginner' },
      { id: 'docker-3', question: 'What is a Dockerfile and its key instructions?', answer: 'A Dockerfile is a text file with instructions to build a Docker image. Key instructions: FROM (base image), RUN (execute commands), COPY/ADD (add files), WORKDIR (set directory), ENV (environment variables), EXPOSE (ports), CMD/ENTRYPOINT (startup command).', difficulty: 'intermediate' },
      { id: 'docker-4', question: 'How do you optimize Docker image size?', answer: 'Optimization techniques: Use multi-stage builds, choose minimal base images (alpine), combine RUN commands to reduce layers, use .dockerignore, remove unnecessary files and caches, order instructions by change frequency, and avoid installing dev dependencies.', difficulty: 'intermediate' },
      { id: 'docker-5', question: 'Explain Docker networking modes.', answer: 'Docker networking modes: Bridge (default, isolated network), Host (shares host network stack), None (no networking), Overlay (multi-host networking for Swarm), Macvlan (assigns MAC address, appears as physical device). Custom bridge networks enable DNS-based container discovery.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'sonarqube',
    name: 'SonarQube',
    icon: 'Shield',
    questions: [
      { id: 'sonar-1', question: 'What is SonarQube and what does it analyze?', answer: 'SonarQube is an open-source platform for continuous inspection of code quality. It analyzes source code for bugs, code smells, security vulnerabilities, and technical debt across 25+ programming languages through static code analysis.', difficulty: 'beginner' },
      { id: 'sonar-2', question: 'Explain Quality Gates in SonarQube.', answer: 'Quality Gates are a set of threshold conditions that code must meet before it can be released. Common conditions include: code coverage percentage, number of bugs, vulnerabilities, code smells, and duplications. Projects fail the gate if any condition is not met.', difficulty: 'intermediate' },
      { id: 'sonar-3', question: 'What is the difference between bugs, vulnerabilities, and code smells?', answer: 'Bugs are coding errors that will cause incorrect behavior. Vulnerabilities are security flaws that attackers could exploit. Code smells are maintainability issues that make code confusing and harder to maintain but don\'t necessarily cause bugs.', difficulty: 'intermediate' },
      { id: 'sonar-4', question: 'How do you integrate SonarQube with CI/CD pipelines?', answer: 'Integration involves: installing SonarScanner, configuring sonar-project.properties, adding analysis step in CI (Jenkins, GitHub Actions, GitLab CI), setting up webhooks for Quality Gate status, and optionally blocking deployments on gate failure.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'aws',
    name: 'AWS',
    icon: 'Cloud',
    questions: [
      { id: 'aws-1', question: 'Explain the difference between EC2 and Lambda.', answer: 'EC2 provides virtual servers you manage (OS, scaling, patching). Lambda is serverless - you upload code and AWS handles infrastructure, scaling automatically per request. EC2 suits long-running applications; Lambda suits event-driven, short-duration functions.', difficulty: 'beginner' },
      { id: 'aws-2', question: 'What is VPC and its components?', answer: 'VPC (Virtual Private Cloud) is an isolated network in AWS. Components include: Subnets (public/private), Route Tables, Internet Gateway (public access), NAT Gateway (private subnet internet), Security Groups (instance firewall), NACLs (subnet firewall).', difficulty: 'intermediate' },
      { id: 'aws-3', question: 'Explain S3 storage classes and use cases.', answer: 'S3 Standard (frequent access), S3 Intelligent-Tiering (varying access), S3 Standard-IA (infrequent access), S3 One Zone-IA (single AZ), S3 Glacier (archival, minutes to hours retrieval), S3 Glacier Deep Archive (lowest cost, 12+ hours retrieval).', difficulty: 'intermediate' },
      { id: 'aws-4', question: 'What is AWS IAM and best practices?', answer: 'IAM manages access to AWS resources. Best practices: Use least privilege, enable MFA, use roles instead of long-term credentials, rotate credentials regularly, use IAM policies for fine-grained permissions, and never use root account for daily tasks.', difficulty: 'intermediate' },
      { id: 'aws-5', question: 'Explain Auto Scaling in AWS.', answer: 'Auto Scaling automatically adjusts capacity based on demand. Components: Launch Template (instance config), Auto Scaling Group (min/max/desired capacity), Scaling Policies (target tracking, step, simple). Integrates with CloudWatch for metrics-based scaling.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'azure',
    name: 'Azure',
    icon: 'Cloud',
    questions: [
      { id: 'azure-1', question: 'What are Azure Resource Groups?', answer: 'Resource Groups are logical containers for Azure resources that share the same lifecycle, permissions, and policies. They help organize resources by project, environment, or billing. Resources can only belong to one group but can interact across groups.', difficulty: 'beginner' },
      { id: 'azure-2', question: 'Explain Azure App Service and its tiers.', answer: 'App Service is a PaaS for hosting web applications, REST APIs, and mobile backends. Tiers: Free/Shared (dev/test), Basic (dedicated compute), Standard (auto-scale, slots), Premium (enhanced performance), Isolated (network isolation, highest scale).', difficulty: 'intermediate' },
      { id: 'azure-3', question: 'What is Azure DevOps and its components?', answer: 'Azure DevOps is a suite of development tools: Azure Boards (work tracking), Azure Repos (Git repositories), Azure Pipelines (CI/CD), Azure Test Plans (testing), Azure Artifacts (package management). Integrates with most development tools and cloud platforms.', difficulty: 'intermediate' },
      { id: 'azure-4', question: 'Explain Azure Kubernetes Service (AKS).', answer: 'AKS is a managed Kubernetes service that simplifies deployment and management. Azure handles control plane, patching, and scaling. Features include: integrated CI/CD, Azure AD integration, virtual nodes for burst scaling, and Azure Monitor integration.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    icon: 'Activity',
    questions: [
      { id: 'prom-1', question: 'What is Prometheus and how does it work?', answer: 'Prometheus is an open-source monitoring and alerting toolkit. It uses a pull model to scrape metrics from configured targets at intervals, stores data in a time-series database, and provides PromQL for querying. It supports service discovery and alerting.', difficulty: 'beginner' },
      { id: 'prom-2', question: 'Explain the four types of Prometheus metrics.', answer: 'Counter: cumulative value that only increases (requests, errors). Gauge: value that can go up/down (temperature, memory). Histogram: samples observations into configurable buckets. Summary: calculates quantiles over a sliding time window.', difficulty: 'intermediate' },
      { id: 'prom-3', question: 'What is PromQL and common functions?', answer: 'PromQL is Prometheus Query Language for selecting and aggregating metrics. Common functions: rate() (per-second rate), sum() (aggregation), avg() (average), histogram_quantile() (percentiles), increase() (total increase over time range).', difficulty: 'intermediate' },
      { id: 'prom-4', question: 'How do you set up alerting in Prometheus?', answer: 'Define alerting rules in prometheus.yml or separate rules file. Rules specify: alert name, PromQL expression, duration (how long condition must be true), labels, and annotations. Alertmanager handles routing, grouping, silencing, and sending notifications.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'grafana',
    name: 'Grafana',
    icon: 'BarChart',
    questions: [
      { id: 'grafana-1', question: 'What is Grafana and its primary use?', answer: 'Grafana is an open-source analytics and visualization platform. It creates dashboards from various data sources (Prometheus, InfluxDB, Elasticsearch, SQL databases) for monitoring infrastructure, applications, and business metrics with rich visualizations.', difficulty: 'beginner' },
      { id: 'grafana-2', question: 'Explain Grafana data sources and panels.', answer: 'Data sources are the databases Grafana queries (Prometheus, MySQL, CloudWatch, etc.). Panels are individual visualizations (graphs, gauges, tables, heatmaps) that display queried data. Each panel connects to a data source and uses its query language.', difficulty: 'intermediate' },
      { id: 'grafana-3', question: 'How do you create effective Grafana dashboards?', answer: 'Best practices: Use consistent naming conventions, organize panels logically (overview at top), use variables for filtering, set appropriate time ranges, add annotations for events, use proper units and thresholds, create rows for grouping related panels.', difficulty: 'intermediate' },
      { id: 'grafana-4', question: 'Explain Grafana alerting and notification channels.', answer: 'Grafana can evaluate dashboard panel queries and trigger alerts based on thresholds. Notification channels include: email, Slack, PagerDuty, webhooks, and more. Alert rules specify conditions, evaluation frequency, and notification routing.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'testing',
    name: 'Testing',
    icon: 'CheckCircle',
    questions: [
      { id: 'test-1', question: 'Explain the testing pyramid.', answer: 'The testing pyramid is a strategy with three layers: Unit tests (base, most numerous, fast, isolated), Integration tests (middle, test component interactions), E2E/UI tests (top, fewest, slowest, test complete flows). More tests at the bottom, fewer at the top.', difficulty: 'beginner' },
      { id: 'test-2', question: 'What is the difference between unit, integration, and E2E tests?', answer: 'Unit tests verify individual functions/methods in isolation using mocks. Integration tests verify how components work together (API + database). E2E tests simulate real user scenarios through the entire application stack including UI.', difficulty: 'beginner' },
      { id: 'test-3', question: 'Explain TDD (Test-Driven Development).', answer: 'TDD is a development approach: 1) Write a failing test first, 2) Write minimal code to pass the test, 3) Refactor while keeping tests passing. Benefits include better design, built-in documentation, regression protection, and confidence in changes.', difficulty: 'intermediate' },
      { id: 'test-4', question: 'What is code coverage and its limitations?', answer: 'Code coverage measures the percentage of code executed by tests (line, branch, function coverage). Limitations: High coverage doesn\'t guarantee quality tests, doesn\'t verify correct behavior, can encourage testing trivial code, and may miss edge cases.', difficulty: 'intermediate' },
    ]
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    icon: 'Search',
    questions: [
      { id: 'trouble-1', question: 'How do you troubleshoot a slow application?', answer: 'Approach: 1) Identify where slowness occurs (frontend/backend/database), 2) Check metrics (CPU, memory, I/O, network), 3) Review logs for errors/warnings, 4) Profile code to find bottlenecks, 5) Check database query performance, 6) Review recent changes.', difficulty: 'intermediate' },
      { id: 'trouble-2', question: 'How do you debug a container that keeps crashing?', answer: 'Steps: 1) Check logs: docker logs <container>, 2) Inspect container: docker inspect, 3) Check exit code, 4) Run interactively: docker run -it --entrypoint /bin/sh, 5) Verify resource limits, 6) Check health checks, 7) Review Dockerfile and entrypoint.', difficulty: 'intermediate' },
      { id: 'trouble-3', question: 'How do you troubleshoot Kubernetes pod issues?', answer: 'Commands: kubectl describe pod (events, status), kubectl logs (application logs), kubectl exec (debug inside pod), kubectl get events. Check: ImagePullBackOff (registry issues), CrashLoopBackOff (app crashes), Pending (resource/scheduling issues).', difficulty: 'advanced' },
      { id: 'trouble-4', question: 'How do you investigate a memory leak?', answer: 'Steps: 1) Monitor memory growth over time, 2) Take heap dumps at intervals, 3) Compare dumps to identify growing objects, 4) Use profilers (pprof, async-profiler, Node --inspect), 5) Check for common causes: unclosed connections, growing caches, event listeners.', difficulty: 'advanced' },
    ]
  },
  {
    id: 'shell',
    name: 'Shell Scripting',
    icon: 'Terminal',
    questions: [
      { id: 'shell-1', question: 'What is the difference between sh, bash, and zsh?', answer: 'sh is the original Bourne shell (POSIX compliant). Bash (Bourne Again Shell) extends sh with arrays, improved scripting, history. Zsh adds more features: better completion, themes (oh-my-zsh), spelling correction, and shared history across sessions.', difficulty: 'beginner' },
      { id: 'shell-2', question: 'Explain common shell variables: $?, $#, $@, $*.', answer: '$? is the exit status of the last command. $# is the number of arguments. $@ is all arguments as separate words. $* is all arguments as a single word. $0 is the script name. $1-$9 are positional parameters.', difficulty: 'intermediate' },
      { id: 'shell-3', question: 'How do you handle errors in shell scripts?', answer: 'Use: set -e (exit on error), set -u (error on undefined variables), set -o pipefail (pipeline fails if any command fails). Combine as: set -euo pipefail. Use trap for cleanup: trap "cleanup_function" EXIT. Check exit codes with if/then or ||.', difficulty: 'intermediate' },
      { id: 'shell-4', question: 'Explain the difference between > and >> redirection.', answer: '> redirects output to a file, overwriting existing content. >> appends to the file without overwriting. 2> redirects stderr. &> or >& redirects both stdout and stderr. << is here-document for inline input. <<< is here-string.', difficulty: 'beginner' },
      { id: 'shell-5', question: 'How do you process files line by line in bash?', answer: 'Use while read loop: while IFS= read -r line; do echo "$line"; done < file.txt. IFS= prevents leading/trailing whitespace trimming. -r prevents backslash interpretation. Can also use for loop with cat, but while read is more efficient for large files.', difficulty: 'intermediate' },
    ]
  },
];
