/**
 * phidata-agentfolio — AgentFolio integration for Phidata
 *
 * Give Phidata agents access to AgentFolio agent identity, trust scores, and marketplace.
 *
 * Provides:
 * - Agent profile lookup
 * - Agent search by skill/keyword
 * - Trust score verification & trust-gating
 * - Marketplace job browsing
 * - Leaderboard access
 */

import { AgentFolioClient } from './agentfolio-client.js';

export { AgentFolioClient } from './agentfolio-client.js';
export type { AgentProfile, Job, SearchResult, TrustScore } from './agentfolio-client.js';

/** Default AgentFolio API base URL */
export const DEFAULT_BASE_URL = 'https://agentfolio.bot/api';

/**
 * Tool definitions for Phidata integration.
 * Each tool wraps an AgentFolio API call with proper typing and error handling.
 */

export interface ToolResult {
  success: boolean;
  text: string;
  data?: any;
}

export interface AgentFolioToolOptions {
  baseUrl?: string;
  apiKey?: string;
}

/**
 * Create a configured AgentFolio toolkit for Phidata.
 * Returns an object with all available tool functions.
 */
export function createAgentFolioToolkit(options: AgentFolioToolOptions = {}) {
  const client = new AgentFolioClient(options.baseUrl, options.apiKey);

  return {
    /** Look up an agent's full profile by ID */
    async lookupAgent(agentId: string): Promise<ToolResult> {
      try {
        const profile = await client.lookupAgent(agentId);
        const text = `${profile.name || agentId} — ${profile.bio || 'No bio'}\nSkills: ${(profile.skills || []).join(', ') || 'None'}\nTrust: ${profile.trust_score ?? 'N/A'} | Rep: ${profile.reputation ?? 'N/A'}`;
        return { success: true, text, data: profile };
      } catch (err: any) {
        return { success: false, text: `Lookup failed: ${err.message}` };
      }
    },

    /** Search agents by skill, keyword, or name */
    async searchAgents(query: string, limit = 10): Promise<ToolResult> {
      try {
        const result = await client.searchAgents(query, limit);
        const lines = result.results.slice(0, 5).map((a) =>
          `• ${a.name || a.id} — ${a.bio?.slice(0, 80) || 'No bio'}${a.trust_score ? ` (Trust: ${a.trust_score})` : ''}`
        );
        return { success: true, text: `Found ${result.total} agents:\n${lines.join('\n')}`, data: result };
      } catch (err: any) {
        return { success: false, text: `Search failed: ${err.message}` };
      }
    },

    /** Verify an agent's trust score against a threshold */
    async trustGate(agentId: string, threshold = 50): Promise<ToolResult> {
      try {
        const score = await client.getTrustScore(agentId);
        const passed = (score.trust_score || 0) >= threshold;
        const text = passed
          ? `✅ ${agentId} PASSED trust gate (${score.trust_score}/${threshold})`
          : `❌ ${agentId} FAILED trust gate (${score.trust_score}/${threshold})`;
        return { success: true, text, data: { ...score, passed, threshold } };
      } catch (err: any) {
        return { success: false, text: `Trust check failed: ${err.message}` };
      }
    },

    /** Browse open marketplace jobs */
    async listJobs(): Promise<ToolResult> {
      try {
        const jobs = await client.listJobs();
        const lines = jobs.slice(0, 5).map((j) =>
          `• ${j.title} — ${j.description?.slice(0, 100) || 'No desc'}${j.budget ? ` | Budget: ${j.budget}` : ''}`
        );
        return { success: true, text: `${jobs.length} jobs:\n${lines.join('\n')}`, data: jobs };
      } catch (err: any) {
        return { success: false, text: `Jobs fetch failed: ${err.message}` };
      }
    },

    /** Get the top-ranked agents */
    async leaderboard(limit = 10): Promise<ToolResult> {
      try {
        const agents = await client.getLeaderboard(limit);
        const lines = agents.slice(0, limit).map((a: any, i: number) =>
          `${i + 1}. ${a.name || a.id} — Rep: ${a.reputation ?? 'N/A'}, Trust: ${a.trust_score ?? 'N/A'}`
        );
        return { success: true, text: `🏆 Leaderboard:\n${lines.join('\n')}`, data: agents };
      } catch (err: any) {
        return { success: false, text: `Leaderboard failed: ${err.message}` };
      }
    },

    /** Direct access to the underlying client */
    client,
  };
}

export default createAgentFolioToolkit;
