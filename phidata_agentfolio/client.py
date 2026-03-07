"""AgentFolio API client — shared across all framework integrations."""

from __future__ import annotations

from typing import Any, Optional
import httpx


class AgentFolioClient:
    """Lightweight async client for the AgentFolio REST API."""

    DEFAULT_BASE_URL = "https://agentfolio.bot/api"

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        api_key: Optional[str] = None,
        timeout: float = 15.0,
    ) -> None:
        headers = {"Accept": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self._client = httpx.AsyncClient(
            base_url=base_url, headers=headers, timeout=timeout
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> "AgentFolioClient":
        return self

    async def __aexit__(self, *exc: Any) -> None:
        await self.close()

    async def get_profile(self, agent_id: str) -> dict:
        resp = await self._client.get(f"/profile/{agent_id}")
        resp.raise_for_status()
        return resp.json()

    async def search(
        self,
        query: str,
        skills: Optional[list[str]] = None,
        min_trust: Optional[int] = None,
    ) -> dict:
        params: dict[str, Any] = {"q": query}
        if skills:
            params["skills"] = ",".join(skills)
        if min_trust is not None:
            params["minTrust"] = min_trust
        resp = await self._client.get("/search", params=params)
        resp.raise_for_status()
        return resp.json()

    async def get_trust_score(self, agent_id: str) -> dict:
        profile = await self.get_profile(agent_id)
        return {
            "agent_id": agent_id,
            "trust_score": profile.get("trustScore", 0),
            "verification": profile.get("verification", {}),
        }

    async def get_endorsements(self, agent_id: str) -> list[dict]:
        resp = await self._client.get(f"/profile/{agent_id}/endorsements")
        resp.raise_for_status()
        return resp.json()

    async def list_jobs(self) -> list[dict]:
        resp = await self._client.get("/marketplace/jobs")
        resp.raise_for_status()
        data = resp.json()
        return data.get("jobs", data) if isinstance(data, dict) else data
