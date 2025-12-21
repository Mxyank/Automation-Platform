import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function analyzeLogError(logText: string): Promise<{
  problem: string;
  solution: string;
  confidence: number;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an expert DevOps engineer. Analyze the provided log or error message and provide a clear problem description and actionable solution. 
    
Respond with JSON in this exact format (no markdown, just raw JSON):
{ "problem": "description of the problem", "solution": "actionable solution", "confidence": 0.8 }

Analyze this log/error and help me fix it:

${logText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      problem: parsed.problem || "Could not identify the problem",
      solution: parsed.solution || "No solution available",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
    };
  } catch (error) {
    throw new Error("Failed to analyze log: " + (error as Error).message);
  }
}

export async function generateYamlFromNaturalLanguage(description: string): Promise<{
  yaml: string;
  explanation: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an expert in DevOps and CI/CD. Convert natural language descriptions into valid YAML configurations for GitHub Actions, Docker Compose, or Kubernetes.

Respond with JSON in this exact format (no markdown, just raw JSON):
{ "yaml": "the yaml configuration", "explanation": "explanation of what the yaml does" }

Generate YAML configuration for: ${description}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      yaml: parsed.yaml || "# Could not generate YAML",
      explanation: parsed.explanation || "No explanation available",
    };
  } catch (error) {
    throw new Error("Failed to generate YAML: " + (error as Error).message);
  }
}

export async function optimizeDockerfile(dockerfile: string): Promise<{
  optimizedDockerfile: string;
  improvements: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are a Docker expert. Analyze the provided Dockerfile and suggest optimizations for size, security, and build time.

Respond with JSON in this exact format (no markdown, just raw JSON):
{ "optimizedDockerfile": "the optimized dockerfile content", "improvements": ["improvement 1", "improvement 2"] }

Optimize this Dockerfile:

${dockerfile}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      optimizedDockerfile: parsed.optimizedDockerfile || dockerfile,
      improvements: parsed.improvements || [],
    };
  } catch (error) {
    throw new Error("Failed to optimize Dockerfile: " + (error as Error).message);
  }
}

export async function generateDevOpsResponse(query: string): Promise<string> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return getDevOpsKnowledgeResponse(query);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `You are an expert DevOps and Cloud Infrastructure consultant with deep knowledge of:
          
- AWS, Azure, GCP cloud platforms and services
- Container technologies (Docker, Kubernetes, container orchestration)
- CI/CD pipelines and automation (GitHub Actions, Jenkins, GitLab CI)
- Infrastructure as Code (Terraform, CloudFormation, Pulumi)
- Monitoring and observability (Prometheus, Grafana, ELK stack)
- Security best practices and compliance
- Database scaling and management
- Microservices architecture and deployment strategies
- Network configuration and load balancing
- Cost optimization and resource management

Provide detailed, practical, and actionable responses. Include:
- Step-by-step instructions when appropriate
- Code examples and configuration snippets
- Best practices and common pitfalls to avoid
- Security considerations
- Performance optimization tips
- Cost implications where relevant

Keep responses comprehensive but well-structured with clear headings and bullet points.
Focus on production-ready solutions rather than basic tutorials.

User Query: ${query}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();
    
    if (!answer) {
      return getDevOpsKnowledgeResponse(query);
    }

    return answer;
  } catch (error) {
    console.error('Gemini DevOps query error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
        return `**Gemini API Quota Exceeded**

Your Google API account has reached its usage limit. Here's what you can do:

1. **Check your Google Cloud billing**: Visit https://console.cloud.google.com to see your current usage
2. **Enable billing**: Ensure billing is enabled for your Google Cloud project
3. **Request quota increase**: Consider requesting a quota increase for the Gemini API

**Meanwhile, here's some general guidance for your query:**
${getDevOpsKnowledgeResponse(query)}

*Once you have available quota on your Google API account, the AI assistant will provide more detailed, personalized responses.*`;
      }
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
        return `**Gemini API Key Issue**

There's an issue with your Google API key. Please check:

1. **Key validity**: Ensure your API key is correct and active
2. **API enabled**: Make sure the Gemini API is enabled in your Google Cloud project
3. **Account status**: Check if your Google Cloud account is in good standing

**Basic guidance for your query:**
${getDevOpsKnowledgeResponse(query)}`;
      }
    }
    
    return getDevOpsKnowledgeResponse(query);
  }
}

function getDevOpsKnowledgeResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('docker') || lowerQuery.includes('container')) {
    return `**Docker Best Practices**

Here are key Docker optimization strategies:

## Container Optimization
- Use multi-stage builds to reduce image size
- Choose appropriate base images (Alpine for minimal size)
- Minimize layers by combining RUN commands
- Use .dockerignore to exclude unnecessary files

## Security Best Practices
- Run containers as non-root users
- Scan images for vulnerabilities
- Use specific version tags, not 'latest'
- Limit container resources (CPU, memory)

## Example Dockerfile:
\`\`\`dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app .
USER nextjs
CMD ["npm", "start"]
\`\`\`

*For more detailed assistance, please ensure your Google API key has sufficient quota.*`;
  }
  
  if (lowerQuery.includes('kubernetes') || lowerQuery.includes('k8s')) {
    return `**Kubernetes Essentials**

## Key Concepts
- **Pods**: Smallest deployable units
- **Services**: Network access to pods
- **Deployments**: Manage pod replicas
- **ConfigMaps/Secrets**: Configuration management

## Common Commands
\`\`\`bash
# Check cluster status
kubectl get nodes

# Deploy application
kubectl apply -f deployment.yaml

# Check pods
kubectl get pods

# View logs
kubectl logs pod-name
\`\`\`

## Basic Deployment Example:
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
\`\`\`

*For personalized Kubernetes solutions, please ensure your Google API has available quota.*`;
  }
  
  if (lowerQuery.includes('aws') || lowerQuery.includes('cloud')) {
    return `**AWS Cloud Best Practices**

## Core Services
- **EC2**: Virtual servers
- **S3**: Object storage
- **RDS**: Managed databases
- **Lambda**: Serverless functions
- **VPC**: Network isolation

## Cost Optimization
- Use Reserved Instances for predictable workloads
- Implement auto-scaling
- Monitor with CloudWatch
- Use appropriate instance types
- Clean up unused resources

## Security Fundamentals
- Enable MFA on all accounts
- Use IAM roles instead of access keys
- Encrypt data at rest and in transit
- Regular security audits
- VPC with private subnets

## Example IAM Policy:
\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}
\`\`\`

*For detailed AWS architecture guidance, please ensure your Google API has available quota.*`;
  }
  
  if (lowerQuery.includes('ci/cd') || lowerQuery.includes('pipeline') || lowerQuery.includes('github actions')) {
    return `**CI/CD Pipeline Best Practices**

## GitHub Actions Example
\`\`\`yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          echo "Deploying to production"
\`\`\`

## Key Principles
- Automated testing at every stage
- Fast feedback loops
- Consistent environments
- Security scanning
- Rollback capabilities
- Blue-green deployments

*For custom pipeline configurations, please ensure your Google API has available quota.*`;
  }

  return `**DevOps Guidance**

I can help with DevOps and Cloud questions! Common topics include:

- **Container Technologies**: Docker, Kubernetes, container orchestration
- **Cloud Platforms**: AWS, Azure, GCP services and best practices  
- **CI/CD**: GitHub Actions, Jenkins, deployment pipelines
- **Infrastructure as Code**: Terraform, CloudFormation, Pulumi
- **Monitoring**: Prometheus, Grafana, logging strategies
- **Security**: Best practices, compliance, vulnerability management

**Your query**: "${query}"

**Basic suggestions**:
- Break down complex problems into smaller components
- Follow security best practices
- Use Infrastructure as Code for reproducibility
- Implement monitoring and alerting
- Document your processes

*For detailed, personalized assistance with your specific use case, please ensure your Google API has available quota. The AI can then provide step-by-step solutions, code examples, and production-ready configurations.*

**Need immediate help?**
- Check official documentation for your tools
- Search Stack Overflow for similar issues
- Review GitHub repositories for examples
- Consult cloud provider documentation`;
}

export async function generateChatResponse(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `${systemPrompt}

User Query: ${userMessage}

Provide a helpful, practical response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini chat error:", error);
    return `I apologize, but I couldn't process your request at the moment. Here are some general tips:

**For DevOps Questions:**
- Check official documentation for your specific tools
- Review best practices on Stack Overflow
- Consult cloud provider documentation

**Common Topics I Can Help With:**
- Docker and Kubernetes configuration
- CI/CD pipeline setup
- Infrastructure as Code
- Cloud architecture design
- Security best practices

Please try again or rephrase your question.`;
  }
}
