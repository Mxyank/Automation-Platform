import { generateAIContent } from "./gemini";

const SEARCH_API_KEY = process.env.SEARCH_API?.trim();

interface SearchResult {
    title: string;
    url: string;
    description: string;
    source: string;
    favicon?: string;
    age?: string;
}

interface CloudSearchResponse {
    results: SearchResult[];
    aiSummary: string;
    query: string;
    totalResults: number;
}

/**
 * Search the web using SearchAPI.io (Google engine)
 * Docs: https://www.searchapi.io/docs/google
 */
async function searchApiQuery(query: string, count: number = 10): Promise<SearchResult[]> {
    if (!SEARCH_API_KEY) {
        throw new Error("SEARCH_NOT_CONFIGURED: SEARCH_API key is not set in environment variables.");
    }

    const params = new URLSearchParams({
        api_key: SEARCH_API_KEY,
        engine: "google",
        q: query,
        num: String(count),
    });

    const response = await fetch(`https://www.searchapi.io/api/v1/search?${params}`);

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[Search] SearchAPI.io error ${response.status}: ${errText}`);
        throw new Error(`SEARCH_ERROR: SearchAPI.io returned ${response.status}`);
    }

    const data = await response.json();
    const organicResults = data.organic_results || [];

    return organicResults.map((r: any) => ({
        title: r.title || "",
        url: r.link || "",
        description: r.snippet || "",
        source: r.source || r.domain || new URL(r.link).hostname,
        favicon: r.favicon || `https://www.google.com/s2/favicons?domain=${r.domain || new URL(r.link).hostname}&sz=32`,
        age: undefined,
    }));
}

/**
 * Generate an AI summary of search results using Gemini
 */
async function generateSearchSummary(query: string, results: SearchResult[]): Promise<string> {
    const resultsContext = results
        .slice(0, 8)
        .map((r, i) => `${i + 1}. **${r.title}** (${r.source})\n   ${r.description}`)
        .join("\n\n");

    const prompt = `You are a senior cloud & DevOps expert. A user searched for: "${query}"

Here are the top search results:

${resultsContext}

Based on these search results, provide a concise, helpful summary (3-5 paragraphs) that:
1. Directly answers what the user is looking for
2. Highlights key takeaways and best practices
3. Mentions which sources are most relevant
4. Provides actionable recommendations

Use markdown formatting with bold for key terms. Be practical and to-the-point.`;

    try {
        const summary = await generateAIContent(prompt);
        return summary;
    } catch (error) {
        console.error("[Search] AI summary generation failed:", error);
        return "AI summary could not be generated at this time. Please review the search results below.";
    }
}

/**
 * Main cloud search function — combines SearchAPI.io + AI summarization
 */
export async function cloudSearch(query: string, category?: string): Promise<CloudSearchResponse> {
    let enhancedQuery = query;
    if (category && category !== "all") {
        const categoryMap: Record<string, string> = {
            aws: "AWS Amazon Web Services",
            gcp: "Google Cloud Platform GCP",
            azure: "Microsoft Azure",
            kubernetes: "Kubernetes K8s",
            docker: "Docker containers",
            terraform: "Terraform IaC infrastructure as code",
            cicd: "CI/CD pipeline continuous integration deployment",
            security: "cloud security DevSecOps",
            monitoring: "cloud monitoring observability",
            serverless: "serverless cloud functions Lambda",
        };
        const suffix = categoryMap[category] || category;
        enhancedQuery = `${query} ${suffix}`;
    }

    const results = await searchApiQuery(enhancedQuery, 12);
    const aiSummary = await generateSearchSummary(query, results);

    return {
        results,
        aiSummary,
        query,
        totalResults: results.length,
    };
}

export function isSearchConfigured(): boolean {
    return !!SEARCH_API_KEY;
}

/**
 * Lightweight search — returns only web results, NO AI summary call.
 * Use this when the caller will handle formatting separately.
 */
export async function searchWebOnly(query: string, category?: string): Promise<SearchResult[]> {
    let enhancedQuery = query;
    if (category && category !== "all") {
        const categoryMap: Record<string, string> = {
            aws: "AWS Amazon Web Services",
            gcp: "Google Cloud Platform GCP",
            azure: "Microsoft Azure",
            kubernetes: "Kubernetes K8s",
            docker: "Docker containers",
            terraform: "Terraform IaC infrastructure as code",
            cicd: "CI/CD pipeline continuous integration deployment",
            security: "cloud security DevSecOps",
            monitoring: "cloud monitoring observability",
            serverless: "serverless cloud functions Lambda",
        };
        const suffix = categoryMap[category] || category;
        enhancedQuery = `${query} ${suffix}`;
    }

    return await searchApiQuery(enhancedQuery, 8);
}
