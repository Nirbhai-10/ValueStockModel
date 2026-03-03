/**
 * server.js
 * Express server — works both locally (with file-watcher) and on Vercel (serverless).
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const { parseExcel } = require("./parse_excel");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = !!process.env.VERCEL;

/* ─── Locate the Excel file ─── */
const ROOT_DIR = path.resolve(__dirname);

function findExcelFile(dir) {
    try {
        const files = fs.readdirSync(dir);
        return files.find(
            (f) =>
                f.endsWith(".xlsx") &&
                !f.startsWith("~$") &&
                f.toLowerCase().includes("stock pick")
        );
    } catch (e) {
        return null;
    }
}

function locateExcel() {
    // Try __dirname first (local), then parent dirs (Vercel bundles api/ separately)
    const searchDirs = [
        ROOT_DIR,
        path.resolve(ROOT_DIR, ".."),
        path.resolve(ROOT_DIR, "../.."),
    ];
    for (const dir of searchDirs) {
        const found = findExcelFile(dir);
        if (found) {
            return { dir, fileName: found, filePath: path.join(dir, found) };
        }
    }
    return { dir: ROOT_DIR, fileName: null, filePath: null };
}

let excel = locateExcel();
let data = null;
let lastUpdated = null;
let loadError = null;

function reload() {
    excel = locateExcel();
    if (!excel.filePath || !fs.existsSync(excel.filePath)) {
        loadError = `Excel file not found. Searched from: ${ROOT_DIR}`;
        console.error("❌", loadError);
        return;
    }
    try {
        data = parseExcel(excel.filePath);
        lastUpdated = new Date().toISOString();
        loadError = null;
        console.log(`✅ Data loaded from "${excel.fileName}" at ${lastUpdated}`);
    } catch (err) {
        loadError = err.message;
        console.error("❌ Error parsing Excel:", err.message);
    }
}

reload();

/* ─── File Watcher (local only) ─── */
if (!IS_VERCEL) {
    try {
        const chokidar = require("chokidar");
        const watcher = chokidar.watch(ROOT_DIR, {
            ignored: /(^|[\/\\])\..|(node_modules|public)/,
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
        });
        watcher.on("all", (event, filePath) => {
            if (filePath.endsWith(".xlsx") && !path.basename(filePath).startsWith("~$")) {
                console.log(`🔄 Excel change detected (${event}): ${path.basename(filePath)}`);
                reload();
            }
        });
    } catch (e) {
        console.log("ℹ️  chokidar not available, file-watching disabled");
    }
}

/* ─── Static files ─── */
app.use(express.static(path.join(__dirname, "public")));

/* ─── API routes ─── */
app.get("/api/meta", (req, res) => {
    res.json({
        fileName: excel.fileName,
        lastUpdated,
        stockCount: data?.dataDump?.length || 0,
        passCount: data?.portfolio25?.length || 0,
    });
});

app.get("/api/debug", (req, res) => {
    const searchDirs = [ROOT_DIR, path.resolve(ROOT_DIR, ".."), path.resolve(ROOT_DIR, "../..")];
    const dirContents = {};
    for (const dir of searchDirs) {
        try { dirContents[dir] = fs.readdirSync(dir).filter(f => !f.startsWith('.')); } catch (e) { dirContents[dir] = `Error: ${e.message}`; }
    }
    res.json({
        __dirname: ROOT_DIR,
        IS_VERCEL,
        excelFound: excel.fileName,
        excelPath: excel.filePath,
        dataLoaded: !!data,
        loadError,
        dirContents,
    });
});

app.get("/api/home", (req, res) => {
    res.json(data?.home || {});
});

app.get("/api/portfolio", (req, res) => {
    res.json(data?.portfolio25 || []);
});

app.get("/api/top-picks", (req, res) => {
    res.json(data?.topPicks || []);
});

app.get("/api/sectors", (req, res) => {
    res.json(data?.sectorAllocation || []);
});

app.get("/api/stocks", (req, res) => {
    res.json(data?.dataDump || []);
});

app.get("/api/diagnostics", (req, res) => {
    res.json(data?.diagnostics || {});
});

/* ─── Catch-all: serve index.html for SPA ─── */
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ─── Start (local only) ─── */
if (!IS_VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Stock Pick Dashboard running at http://localhost:${PORT}\n`);
    });
}

module.exports = app;
