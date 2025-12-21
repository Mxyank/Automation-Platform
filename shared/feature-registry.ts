import { 
  Database, 
  Container, 
  Brain, 
  Zap,
  DollarSign,
  RefreshCw,
  GitBranch,
  Shield,
  Rocket,
  Activity,
  BarChart3,
  Layers,
  Server,
  Cloud,
  Sparkles,
  Terminal,
  FileCode,
  Snowflake,
  Wind,
  Workflow,
  Table2,
  LineChart,
  Lock,
  Bug,
  Search,
  Network,
  Fingerprint,
  Eye,
  type LucideIcon
} from "lucide-react";

export type Domain = 'devops' | 'data-engineering' | 'cybersecurity';

export interface DomainInfo {
  id: Domain;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

export const domains: DomainInfo[] = [
  {
    id: 'devops',
    name: 'DevOps',
    description: 'CI/CD, Containers, Infrastructure as Code',
    icon: 'Container',
    color: 'text-neon-cyan',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'data-engineering',
    name: 'Data Engineering',
    description: 'Data Pipelines, Warehousing, ETL',
    icon: 'Database',
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Security Scanning, Compliance, Threat Detection',
    icon: 'Shield',
    color: 'text-red-400',
    gradient: 'from-red-500 to-orange-600'
  }
];

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  gradient: string;
  badge?: string;
  domains: Domain[];
  isNew?: boolean;
  isPremium?: boolean;
}

export const featureRegistry: Feature[] = [
  // DevOps Core Tools
  {
    id: 'api-generator',
    title: 'Generate API',
    description: 'Create CRUD endpoints',
    icon: 'Database',
    href: '/api-generator',
    gradient: 'from-neon-cyan to-blue-500',
    domains: ['devops', 'data-engineering']
  },
  {
    id: 'docker-generator',
    title: 'Docker Setup',
    description: 'Containerize your app',
    icon: 'Container',
    href: '/docker-generator',
    gradient: 'from-blue-500 to-cyan-500',
    domains: ['devops']
  },
  {
    id: 'jenkins-generator',
    title: 'Jenkins Pipeline',
    description: 'Generate CI/CD pipelines',
    icon: 'Zap',
    href: '/jenkins-generator',
    gradient: 'from-blue-600 to-indigo-600',
    domains: ['devops']
  },
  {
    id: 'ansible-generator',
    title: 'Ansible Playbook',
    description: 'Automate infrastructure',
    icon: 'Terminal',
    href: '/ansible-generator',
    gradient: 'from-red-500 to-orange-600',
    domains: ['devops']
  },
  {
    id: 'sonarqube-setup',
    title: 'SonarQube Setup',
    description: 'Code quality analysis',
    icon: 'Shield',
    href: '/sonarqube-setup',
    gradient: 'from-orange-500 to-yellow-600',
    domains: ['devops', 'cybersecurity']
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Debug with AI',
    icon: 'Brain',
    href: '/ai-assistant',
    gradient: 'from-neon-purple to-purple-500',
    domains: ['devops', 'data-engineering', 'cybersecurity']
  },
  
  // Advanced DevOps/AI Features
  {
    id: 'deployment-simulator',
    title: 'Deployment Simulator',
    description: 'AI predicts failures, cost & scaling',
    icon: 'Rocket',
    href: '/deployment-simulator',
    gradient: 'from-purple-500 to-pink-600',
    badge: 'AI',
    domains: ['devops']
  },
  {
    id: 'iac-autofix',
    title: 'IaC Autofix',
    description: 'Terraform & Pulumi analyzer',
    icon: 'Layers',
    href: '/iac-autofix',
    gradient: 'from-orange-500 to-red-600',
    badge: 'New',
    domains: ['devops']
  },
  {
    id: 'release-notes',
    title: 'Release Notes',
    description: 'Auto-generate changelogs',
    icon: 'FileCode',
    href: '/release-notes',
    gradient: 'from-blue-500 to-purple-600',
    badge: 'AI',
    domains: ['devops']
  },
  {
    id: 'secret-scanner',
    title: 'Secret Scanner',
    description: 'Find & fix exposed secrets',
    icon: 'Shield',
    href: '/secret-scanner',
    gradient: 'from-red-500 to-orange-600',
    badge: 'Security',
    domains: ['devops', 'cybersecurity']
  },
  {
    id: 'cloud-optimizer',
    title: 'Cloud Optimizer',
    description: 'Multi-cloud cost reduction',
    icon: 'DollarSign',
    href: '/cloud-optimizer',
    gradient: 'from-green-500 to-emerald-600',
    badge: 'AI',
    domains: ['devops', 'data-engineering']
  },
  {
    id: 'infra-chat',
    title: 'Infra Chat',
    description: 'Talk to your infrastructure',
    icon: 'Brain',
    href: '/infra-chat',
    gradient: 'from-cyan-500 to-blue-600',
    badge: 'Chat',
    domains: ['devops']
  },
  {
    id: 'blueprint-generator',
    title: 'Blueprint Generator',
    description: 'Complete architecture from ideas',
    icon: 'Server',
    href: '/blueprint-generator',
    gradient: 'from-indigo-500 to-purple-600',
    badge: 'AI',
    domains: ['devops', 'data-engineering']
  },
  {
    id: 'postmortem',
    title: 'Post-Mortem',
    description: 'AI incident analysis',
    icon: 'Activity',
    href: '/postmortem',
    gradient: 'from-red-600 to-pink-600',
    badge: 'New',
    domains: ['devops', 'cybersecurity']
  },
  {
    id: 'cost-estimator',
    title: 'Cost Estimator',
    description: 'Estimate cloud infrastructure costs',
    icon: 'DollarSign',
    href: '/cost-estimator',
    gradient: 'from-green-500 to-emerald-600',
    badge: 'Calculator',
    domains: ['devops', 'data-engineering']
  },
  {
    id: 'env-replicator',
    title: 'Magic Sandbox',
    description: 'Spin up dev env from GitHub',
    icon: 'Sparkles',
    href: '/env-replicator',
    gradient: 'from-violet-500 to-purple-600',
    badge: 'AI',
    domains: ['devops']
  },
  {
    id: 'database-optimizer',
    title: 'AI DBA',
    description: 'Database optimization',
    icon: 'Database',
    href: '/database-optimizer',
    gradient: 'from-emerald-500 to-teal-600',
    badge: 'AI',
    domains: ['devops', 'data-engineering']
  },
  {
    id: 'website-monitor',
    title: 'Website Monitor',
    description: 'Analyze site performance',
    icon: 'Activity',
    href: '/website-monitor',
    gradient: 'from-blue-500 to-cyan-600',
    badge: 'Analytics',
    domains: ['devops']
  },

  // Data Engineering Tools
  {
    id: 'snowflake-setup',
    title: 'Snowflake Setup',
    description: 'Configure Snowflake warehouse',
    icon: 'Snowflake',
    href: '/snowflake-setup',
    gradient: 'from-blue-400 to-cyan-500',
    badge: 'New',
    domains: ['data-engineering'],
    isNew: true
  },
  {
    id: 'airflow-generator',
    title: 'Airflow DAG Generator',
    description: 'Create data pipeline DAGs',
    icon: 'Wind',
    href: '/airflow-generator',
    gradient: 'from-teal-500 to-green-600',
    badge: 'New',
    domains: ['data-engineering'],
    isNew: true
  },
  {
    id: 'dbt-generator',
    title: 'dbt Model Generator',
    description: 'Generate dbt transformations',
    icon: 'Table2',
    href: '/dbt-generator',
    gradient: 'from-orange-400 to-red-500',
    badge: 'New',
    domains: ['data-engineering'],
    isNew: true
  },
  {
    id: 'spark-generator',
    title: 'Spark Job Generator',
    description: 'Create PySpark & Scala jobs',
    icon: 'Zap',
    href: '/spark-generator',
    gradient: 'from-orange-500 to-yellow-500',
    badge: 'New',
    domains: ['data-engineering'],
    isNew: true
  },
  {
    id: 'kafka-setup',
    title: 'Kafka Pipeline Setup',
    description: 'Configure streaming pipelines',
    icon: 'Workflow',
    href: '/kafka-setup',
    gradient: 'from-gray-600 to-gray-800',
    badge: 'New',
    domains: ['data-engineering', 'devops'],
    isNew: true
  },
  {
    id: 'data-quality',
    title: 'Data Quality Check',
    description: 'Great Expectations setup',
    icon: 'BarChart3',
    href: '/data-quality',
    gradient: 'from-purple-500 to-indigo-600',
    badge: 'New',
    domains: ['data-engineering'],
    isNew: true
  },

  // Cybersecurity Tools
  {
    id: 'vulnerability-scanner',
    title: 'Vulnerability Scanner',
    description: 'Scan code for vulnerabilities',
    icon: 'Bug',
    href: '/vulnerability-scanner',
    gradient: 'from-red-600 to-rose-600',
    badge: 'Security',
    domains: ['cybersecurity'],
    isNew: true
  },
  {
    id: 'compliance-checker',
    title: 'Compliance Checker',
    description: 'SOC2, HIPAA, PCI-DSS checks',
    icon: 'Shield',
    href: '/compliance-checker',
    gradient: 'from-blue-600 to-indigo-700',
    badge: 'Security',
    domains: ['cybersecurity'],
    isNew: true
  },
  {
    id: 'threat-detector',
    title: 'Threat Detector',
    description: 'AI-powered threat analysis',
    icon: 'Eye',
    href: '/threat-detector',
    gradient: 'from-red-500 to-orange-600',
    badge: 'AI',
    domains: ['cybersecurity'],
    isNew: true
  },
  {
    id: 'network-analyzer',
    title: 'Network Analyzer',
    description: 'Analyze network security',
    icon: 'Network',
    href: '/network-analyzer',
    gradient: 'from-purple-600 to-pink-600',
    badge: 'Security',
    domains: ['cybersecurity'],
    isNew: true
  },
  {
    id: 'iam-generator',
    title: 'IAM Policy Generator',
    description: 'Create secure IAM policies',
    icon: 'Lock',
    href: '/iam-generator',
    gradient: 'from-yellow-500 to-orange-600',
    badge: 'Security',
    domains: ['cybersecurity', 'devops'],
    isNew: true
  },
  {
    id: 'pentest-planner',
    title: 'Pentest Planner',
    description: 'Plan penetration testing',
    icon: 'Fingerprint',
    href: '/pentest-planner',
    gradient: 'from-gray-600 to-gray-900',
    badge: 'Security',
    domains: ['cybersecurity'],
    isNew: true
  }
];

export const monitoringTools = [
  { id: 'logs', title: 'Logs Dashboard', href: '/logs', icon: 'Activity', color: 'text-green-500', domains: ['devops', 'data-engineering', 'cybersecurity'] as Domain[] },
  { id: 'security', title: 'Security Dashboard', href: '/security', icon: 'Shield', color: 'text-red-500', domains: ['devops', 'cybersecurity'] as Domain[] },
  { id: 'sonar', title: 'Sonar Dashboard', href: '/sonar', icon: 'BarChart3', color: 'text-blue-500', domains: ['devops'] as Domain[] },
  { id: 'website-monitor', title: 'Website Monitor', href: '/website-monitor', icon: 'Cloud', color: 'text-cyan-500', domains: ['devops'] as Domain[] },
];

export function getFeaturesByDomain(domain: Domain): Feature[] {
  return featureRegistry.filter(feature => feature.domains.includes(domain));
}

export function getQuickActionsByDomain(domain: Domain): Feature[] {
  const quickActionIds = ['api-generator', 'docker-generator', 'jenkins-generator', 'ansible-generator', 'sonarqube-setup', 'ai-assistant', 'snowflake-setup', 'airflow-generator', 'vulnerability-scanner', 'compliance-checker'];
  return featureRegistry.filter(feature => 
    quickActionIds.includes(feature.id) && feature.domains.includes(domain)
  ).slice(0, 6);
}

export function getAdvancedFeaturesByDomain(domain: Domain): Feature[] {
  const quickActionIds = ['api-generator', 'docker-generator', 'jenkins-generator', 'ansible-generator', 'sonarqube-setup', 'ai-assistant', 'snowflake-setup', 'airflow-generator', 'vulnerability-scanner', 'compliance-checker'];
  return featureRegistry.filter(feature => 
    !quickActionIds.includes(feature.id) && feature.domains.includes(domain)
  );
}

export function getMonitoringToolsByDomain(domain: Domain) {
  return monitoringTools.filter(tool => tool.domains.includes(domain));
}

export function getDomainInfo(domain: Domain): DomainInfo | undefined {
  return domains.find(d => d.id === domain);
}
