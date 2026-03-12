/**
 * AgentFolio API Client
 * Shared HTTP client for all AgentFolio API interactions.
 */

const DEFAULT_BASE_URL = 'https://agentfolio.bot/api';

export interface AgentProfile {
  id: string;
  name: string;
  bio?: string;
  skills?: string[];
  trust_score?: number;
  reputation?: number;
  rank?: string;
  wallets?: Record<string, string>;
  verifications?: string[];
  endorsements?: any[];
  portfolio?: any[];
  track_record?: any[];
}

export interface Job {
  id: string;
  title: string;
  description: string;
  budget?: string;
  category?: string;
  skills_required?: string[];
  posted_by?: string;
  status?: string;
}

export interface SearchResult {
  results: AgentProfile[];
  total: number;
  limit: number;
  offset: number;
}

export interface TrustScore {
  agent_id: string;
  trust_score: number;
  reputation: number;
  rank: string;
  level: number;
  endorsement_count: number;
  verification_count: number;
}

export class AgentFolioClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
    this.apiKey = apiKey;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.apiKey) {
      headers['X-Api-Key'] = this.apiKey;
    }
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    if (!res.ok) throw new Error(`AgentFolio API ${res.status}: ${res.statusText}`);
    return res.json();
  }

  async lookupAgent(agentId: string): Promise<AgentProfile> {
    return this.request(`/profile/${agentId}`);
  }

  async searchAgents(query: string, limit = 10): Promise<SearchResult> {
    return this.request(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async getTrustScore(agentId: string): Promise<TrustScore> {
    return this.request(`/profile/${agentId}/score`);
  }

  async getEndorsements(agentId: string): Promise<any[]> {
    const data = await this.request(`/profile/${agentId}/endorsements`);
    return Array.isArray(data) ? data : data.endorsements || [];
  }

  async listJobs(): Promise<Job[]> {
    const data = await this.request('/jobs');
    return Array.isArray(data) ? data : data.jobs || [];
  }

  async getJob(jobId: string): Promise<Job> {
    return this.request(`/jobs/${jobId}`);
  }

  async getLeaderboard(limit = 20): Promise<any[]> {
    const data = await this.request(`/leaderboard/scores?limit=${limit}`);
    return Array.isArray(data) ? data : data.agents || [];
  }
}
