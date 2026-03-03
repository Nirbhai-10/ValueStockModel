/**
 * api/index.js — Vercel serverless entry point
 * Loads pre-built data.json (generated from Excel at build time).
 */
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

/* ══════════════════════════════════════
   Load Data
   ══════════════════════════════════════ */
let data = null;
let loadError = null;

try {
    data = require("./data.json");
    console.log("✅ Data loaded from data.json");
} catch (err) {
    loadError = err.message;
    console.error("❌ Error loading data.json:", err.message);
}

const lastUpdated = new Date().toISOString();

/* ══════════════════════════════════════
   Static Files
   ══════════════════════════════════════ */
const publicDir = path.resolve(__dirname, "../public");
// Also check if public is co-located (Vercel flattens to /var/task)
const publicDir2 = path.resolve(__dirname, "public");
app.use(express.static(fs.existsSync(publicDir) ? publicDir : publicDir2));

/* ══════════════════════════════════════
   API Routes
   ══════════════════════════════════════ */
app.get("/api/meta", (req, res) => {
    res.json({
        fileName: "data.json",
        lastUpdated,
        stockCount: data?.dataDump?.length || 0,
        passCount: data?.portfolio25?.length || 0,
    });
});

app.get("/api/debug", (req, res) => {
    const dirs = [__dirname, path.resolve(__dirname, ".."), path.resolve(__dirname, "api")];
    const dirContents = {};
    dirs.forEach(d => { try { dirContents[d] = fs.readdirSync(d).filter(f => !f.startsWith('.')).slice(0, 30); } catch (e) { dirContents[d] = e.message; } });
    res.json({ __dirname, dataLoaded: !!data, loadError, keys: data ? Object.keys(data) : [], stockCount: data?.dataDump?.length, dirContents });
});

app.get("/api/home", (req, res) => res.json(data?.home || {}));
app.get("/api/portfolio", (req, res) => res.json(data?.portfolio25 || []));
app.get("/api/top-picks", (req, res) => res.json(data?.topPicks || []));
app.get("/api/sectors", (req, res) => res.json(data?.sectorAllocation || []));
app.get("/api/stocks", (req, res) => res.json(data?.dataDump || []));
app.get("/api/diagnostics", (req, res) => res.json(data?.diagnostics || {}));

/* SPA fallback */
app.get("*", (req, res) => {
    const idx1 = path.join(publicDir, "index.html");
    const idx2 = path.join(publicDir2, "index.html");
    const indexPath = fs.existsSync(idx1) ? idx1 : idx2;
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: "index.html not found", tried: [idx1, idx2] });
    }
});

module.exports = app;
