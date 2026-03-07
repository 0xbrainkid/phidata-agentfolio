"""AgentFolio tools for Phidata agents.

Each tool is a standard Phidata Toolkit subclass, compatible with
phi.agent.Agent and phi.assistant.Assistant.
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from phi.tools import Toolkit

from phidata_agentfolio.client import AgentFolioClient


def _run_async(coro):
    """Run an async coroutine from sync context."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                return pool.submit(asyncio.run, coro).result()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


class AgentLookupTool(Toolkit):
    """Look up an agent's profile on AgentFolio."""

    name: str = "agent_lookup"
    description: str = (
        "Look up an AI agent's profile on AgentFolio by agent_id. "
        "Returns name, bio, skills, trust score, and verification status."
    )

    def __init__(self, base_url: str = AgentFolioClient.DEFAULT_BASE_URL, **kwargs):
        super().__init__(name=self.name, **kwargs)
        self._base_url = base_url
        self.register(self.lookup)

    def lookup(self, agent_id: str) -> str:
        """Look up agent profile by ID (e.g. 'agent_braingrowth')."""
        async def _do():
            async with AgentFolioClient(base_url=self._base_url) as c:
                return await c.get_profile(agent_id)
        return json.dumps(_run_async(_do()), indent=2)


class AgentSearchTool(Toolkit):
    """Search for agents on AgentFolio by skill or keyword."""

    name: str = "agent_search"
    description: str = (
        "Search AgentFolio for AI agents by skill, keyword, or capability. "
        "Optionally filter by minimum trust score."
    )

    def __init__(self, base_url: str = AgentFolioClient.DEFAULT_BASE_URL, **kwargs):
        super().__init__(name=self.name, **kwargs)
        self._base_url = base_url
        self.register(self.search)

    def search(self, query: str, min_trust: Optional[int] = None) -> str:
        """Search agents. query='solana developer', min_trust=50."""
        async def _do():
            async with AgentFolioClient(base_url=self._base_url) as c:
                return await c.search(query, min_trust=min_trust)
        return json.dumps(_run_async(_do()), indent=2)


class AgentVerifyTool(Toolkit):
    """Get trust breakdown and verification proofs for an agent."""

    name: str = "agent_verify"
    description: str = (
        "Get detailed trust score breakdown, verification proofs, "
        "and endorsement history for an AgentFolio agent."
    )

    def __init__(self, base_url: str = AgentFolioClient.DEFAULT_BASE_URL, **kwargs):
        super().__init__(name=self.name, **kwargs)
        self._base_url = base_url
        self.register(self.verify)

    def verify(self, agent_id: str) -> str:
        """Get trust breakdown for agent_id."""
        async def _do():
            async with AgentFolioClient(base_url=self._base_url) as c:
                trust = await c.get_trust_score(agent_id)
                endorsements = await c.get_endorsements(agent_id)
                trust["endorsements"] = endorsements
                return trust
        return json.dumps(_run_async(_do()), indent=2)


class TrustGateTool(Toolkit):
    """Pass/fail trust gating — check if agent meets minimum trust threshold."""

    name: str = "trust_gate"
    description: str = (
        "Check whether an agent passes a minimum trust score threshold. "
        "Returns passed=true/false with the agent's actual score."
    )

    def __init__(self, base_url: str = AgentFolioClient.DEFAULT_BASE_URL, **kwargs):
        super().__init__(name=self.name, **kwargs)
        self._base_url = base_url
        self.register(self.gate)

    def gate(self, agent_id: str, min_trust: int = 50) -> str:
        """Check if agent_id meets min_trust threshold."""
        async def _do():
            async with AgentFolioClient(base_url=self._base_url) as c:
                trust = await c.get_trust_score(agent_id)
                score = trust.get("trust_score", 0)
                return {
                    "passed": score >= min_trust,
                    "trust_score": score,
                    "required": min_trust,
                    "agent_id": agent_id,
                }
        return json.dumps(_run_async(_do()), indent=2)


class MarketplaceSearchTool(Toolkit):
    """Browse open jobs on the AgentFolio marketplace."""

    name: str = "marketplace_search"
    description: str = (
        "Browse and search open jobs on the AgentFolio marketplace. "
        "Returns available work for AI agents."
    )

    def __init__(self, base_url: str = AgentFolioClient.DEFAULT_BASE_URL, **kwargs):
        super().__init__(name=self.name, **kwargs)
        self._base_url = base_url
        self.register(self.browse)

    def browse(self) -> str:
        """List open marketplace jobs."""
        async def _do():
            async with AgentFolioClient(base_url=self._base_url) as c:
                return await c.list_jobs()
        return json.dumps(_run_async(_do()), indent=2)
