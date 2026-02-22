import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// ─── Provider Configuration ────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SEARCH_API_KEY = process.env.SEARCH_API?.trim();

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

type AIProvider = "gemini" | "openai" | "search";

function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (GEMINI_KEY) providers.push("gemini");
  if (OPENAI_KEY) providers.push("openai");
  // SearchAPI.io is always last resort
  if (SEARCH_API_KEY) providers.push("search");
  return providers;
}

export function isAIConfigured(): boolean {
  return !!(GEMINI_KEY || OPENAI_KEY || SEARCH_API_KEY);
}

// ─── Search-Based Answer Generation ─────────────────────────────────────────────

/**
 * Use SearchAPI.io to find relevant results and build an answer from them.
 * This is used as a fallback when Gemini/OpenAI are unavailable.
 */
async function generateFromSearch(prompt: string): Promise<string> {
  if (!SEARCH_API_KEY) {
    throw new Error("SEARCH_API key is not configured");
  }

  // Extract a concise search query from the prompt (use last 200 chars or whole thing if short)
  // Usually the actual user question is at the end of the prompt
  const lines = prompt.split('\n').filter(l => l.trim().length > 0);
  let searchQuery = lines[lines.length - 1] || prompt;
  // Clean up common prompt artifacts
  searchQuery = searchQuery.replace(/^(Now answer the following query.*?:|User Query:|Question:)\s*/i, '');
  searchQuery = searchQuery.replace(/^(Provide a helpful.*?response:)\s*/i, '');
  // Limit length
  if (searchQuery.length > 200) searchQuery = searchQuery.substring(0, 200);

  const params = new URLSearchParams({
    api_key: SEARCH_API_KEY,
    engine: "google",
    q: searchQuery,
    num: "8",
  });

  const response = await fetch(`https://www.searchapi.io/api/v1/search?${params}`);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`SearchAPI.io returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const results = data.organic_results || [];

  if (results.length === 0) {
    throw new Error("No search results found");
  }

  // Also grab answer_box / knowledge_graph if available for richer answers
  let answer = "";

  // Use answer box if available (Google's direct answer)
  if (data.answer_box) {
    const ab = data.answer_box;
    if (ab.answer) {
      answer += `**${ab.answer}**\n\n`;
    } else if (ab.snippet) {
      answer += `${ab.snippet}\n\n`;
    }
  }

  // Use knowledge graph if available
  if (data.knowledge_graph?.description) {
    answer += `${data.knowledge_graph.description}\n\n`;
  }

  // Build answer from top search results
  answer += `## Key Information\n\n`;
  results.slice(0, 4).forEach((r: any, i: number) => {
    answer += `**${i + 1}. ${r.title}**\n`;
    answer += `${r.snippet || ""}\n`;
    answer += `*Source: [${r.source || r.domain}](${r.link})*\n\n`;
  });

  if (results.length > 4) {
    answer += `## More Resources\n\n`;
    results.slice(4, 8).forEach((r: any, i: number) => {
      answer += `${i + 5}. [${r.title}](${r.link}) — ${r.snippet || ""}\n\n`;
    });
  }

  answer += `---\n*${results.length} sources found via web search*`;

  console.log(`[AI] ✅ Response from SearchAPI.io (${results.length} results)`);
  return answer;
}

// ─── Core Multi-Provider Engine ─────────────────────────────────────────────────

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is a retryable rate-limit error
 */
function isRetryableError(error: any): boolean {
  const msg = (error?.message || String(error)).toLowerCase();
  return msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('rate');
}

/**
 * Unified AI content generation with automatic provider fallback.
 * Tries Gemini first, falls back to OpenAI, then uses SearchAPI.io as last resort.
 */
export async function generateAIContent(prompt: string, jsonMode: boolean = false): Promise<string> {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error("AI_NOT_CONFIGURED: No AI or search provider is configured. Please set GOOGLE_API_KEY, OPENAI_API_KEY, or SEARCH_API in your environment variables.");
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      if (provider === "gemini" && genAI) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Retry with exponential backoff for rate limits
        const MAX_RETRIES = 3;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (!text || text.trim().length === 0) {
              throw new Error("Empty response from Gemini");
            }

            console.log(`[AI] ✅ Response from Gemini (gemini-2.0-flash)${attempt > 0 ? ` after ${attempt} retries` : ''}`);
            return text;
          } catch (retryErr) {
            if (isRetryableError(retryErr) && attempt < MAX_RETRIES - 1) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`[AI] ⏳ Gemini rate-limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
              await sleep(delay);
              continue;
            }
            throw retryErr;
          }
        }
      }

      if (provider === "openai" && openai) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        });

        const text = response.choices[0]?.message?.content;
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from OpenAI");
        }

        console.log(`[AI] ✅ Response from OpenAI (gpt-4o-mini)`);
        return text;
      }

      if (provider === "search" && SEARCH_API_KEY) {
        // SearchAPI.io fallback — build answer from search results
        // Skip if jsonMode is required (search can't generate structured JSON)
        if (jsonMode) {
          console.log(`[AI] ⚠️ SearchAPI.io skipped (JSON mode required)`);
          continue;
        }
        return await generateFromSearch(prompt);
      }
    } catch (error) {
      const errorMsg = (error as Error).message || String(error);
      console.log(`[AI] ⚠️ ${provider} failed: ${errorMsg.substring(0, 120)}...`);
      lastError = error as Error;
      // Continue to next provider
    }
  }

  // All providers failed — throw the last error with context
  const errorMessage = lastError?.message || "All AI providers failed";

  if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
    throw new Error(`QUOTA_EXCEEDED: All providers' quotas are exhausted. ${errorMessage}`);
  }
  if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("invalid") || errorMessage.includes("Incorrect API key")) {
    throw new Error(`INVALID_API_KEY: API key is invalid. ${errorMessage}`);
  }

  throw new Error(`AI_ERROR: ${errorMessage}`);
}

// ─── Exported AI Functions ──────────────────────────────────────────────────────

export function getGeminiModel(modelName: string = "gemini-2.0-flash") {
  if (!GEMINI_KEY || !genAI) {
    throw new Error("Gemini API key is not configured.");
  }
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export async function analyzeLogError(logText: string): Promise<{
  problem: string;
  solution: string;
  confidence: number;
}> {
  const prompt = `You are an expert DevOps engineer. Analyze the provided log or error message and provide a clear problem description and actionable solution.

Respond with JSON in this exact format (no markdown, no code fences, just raw JSON):
{ "problem": "description of the problem", "solution": "actionable solution", "confidence": 0.8 }

Analyze this log/error and help me fix it:

${logText}`;

  try {
    const text = await generateAIContent(prompt, true);

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
    // If JSON parsing fails (e.g. search fallback), provide a text-based answer
    try {
      const text = await generateAIContent(`Analyze this log error and explain the problem and solution:\n\n${logText}`);
      return {
        problem: "See analysis below",
        solution: text,
        confidence: 0.6,
      };
    } catch {
      throw new Error("Failed to analyze log: " + (error as Error).message);
    }
  }
}

export async function generateYamlFromNaturalLanguage(description: string): Promise<{
  yaml: string;
  explanation: string;
}> {
  const prompt = `You are an expert in DevOps and CI/CD. Convert natural language descriptions into valid YAML configurations for GitHub Actions, Docker Compose, or Kubernetes.

Respond with JSON in this exact format (no markdown, no code fences, just raw JSON):
{ "yaml": "the yaml configuration", "explanation": "explanation of what the yaml does" }

Generate YAML configuration for: ${description}`;

  try {
    const text = await generateAIContent(prompt, true);

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
    // Fallback: provide search-based answer
    try {
      const text = await generateAIContent(`YAML configuration example for: ${description}`);
      return {
        yaml: "# See explanation below for guidance",
        explanation: text,
      };
    } catch {
      throw new Error("Failed to generate YAML: " + (error as Error).message);
    }
  }
}

export async function optimizeDockerfile(dockerfile: string): Promise<{
  optimizedDockerfile: string;
  improvements: string[];
}> {
  const prompt = `You are a Docker expert. Analyze the provided Dockerfile and suggest optimizations for size, security, and build time.

Respond with JSON in this exact format (no markdown, no code fences, just raw JSON):
{ "optimizedDockerfile": "the optimized dockerfile content", "improvements": ["improvement 1", "improvement 2"] }

Optimize this Dockerfile:

${dockerfile}`;

  try {
    const text = await generateAIContent(prompt, true);

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
    // Fallback: provide search-based answer
    try {
      const text = await generateAIContent(`Docker optimization best practices for Dockerfiles`);
      return {
        optimizedDockerfile: dockerfile,
        improvements: [text],
      };
    } catch {
      throw new Error("Failed to optimize Dockerfile: " + (error as Error).message);
    }
  }
}

export async function generateDevOpsResponse(query: string): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error("AI_NOT_CONFIGURED: No AI or search provider is configured. Please set GOOGLE_API_KEY, OPENAI_API_KEY, or SEARCH_API in your environment variables.");
  }

  const prompt = `You are an expert DevOps and Cloud Infrastructure AI assistant — the most knowledgeable DevOps engineer in the world. You have deep, practical expertise in:

- **Cloud Platforms**: AWS (EC2, S3, Lambda, ECS, EKS, RDS, CloudFormation, CDK), Azure (AKS, Functions, DevOps), GCP (GKE, Cloud Run, Cloud Build)
- **Containers & Orchestration**: Docker, Kubernetes, Helm, Docker Compose, container security
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins, ArgoCD, Flux, Tekton
- **Infrastructure as Code**: Terraform, Pulumi, Ansible, CloudFormation, Crossplane
- **Monitoring & Observability**: Prometheus, Grafana, Datadog, ELK/EFK stack, OpenTelemetry, Jaeger
- **Security**: RBAC, network policies, secret management (Vault, SOPS), vulnerability scanning, compliance
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, DynamoDB — scaling, replication, backup strategies
- **Networking**: Load balancing, service mesh (Istio, Linkerd), DNS, CDN, VPN, VPC design
- **Microservices**: Architecture patterns, API gateways, event-driven design, message queues (Kafka, RabbitMQ, SQS)
- **Cost Optimization**: Reserved instances, spot instances, right-sizing, FinOps practices

**Response Guidelines:**
1. Always provide **production-ready**, battle-tested solutions — not toy examples
2. Include **working code snippets** and configuration files wherever relevant
3. Structure with clear **markdown headings**, bullet points, and numbered steps
4. Highlight **security considerations** and **common pitfalls** proactively
5. Mention **cost implications** when relevant
6. Suggest **alternative approaches** when there are tradeoffs
7. Use code blocks with proper language tags (e.g. \`\`\`yaml, \`\`\`bash, \`\`\`dockerfile)

Now answer the following query with maximum depth and practical detail:

${query}`;

  return await generateAIContent(prompt);
}

export async function generateChatResponse(systemPrompt: string, userMessage: string): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error("AI_NOT_CONFIGURED: No AI or search provider is configured. Please set GOOGLE_API_KEY, OPENAI_API_KEY, or SEARCH_API in your environment variables.");
  }

  const prompt = `${systemPrompt}

User Query: ${userMessage}

Provide a helpful, practical response:`;

  return await generateAIContent(prompt);
}
