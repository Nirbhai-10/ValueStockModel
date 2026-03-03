/**
 * api.js — Thin fetch wrapper for all API endpoints
 */
const API = {
    async get(endpoint) {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`API ${endpoint} failed: ${res.status}`);
        return res.json();
    },
    meta: () => API.get("/api/meta"),
    home: () => API.get("/api/home"),
    portfolio: () => API.get("/api/portfolio"),
    topPicks: () => API.get("/api/top-picks"),
    sectors: () => API.get("/api/sectors"),
    stocks: () => API.get("/api/stocks"),
    diagnostics: () => API.get("/api/diagnostics"),
};
