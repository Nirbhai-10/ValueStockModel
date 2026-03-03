/**
 * server.js
 * Express server with file-watcher for live Excel reload.
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const chokidar = require("chokidar");
const { parseExcel } = require("./parse_excel");

const app = express();
const PORT = 3000;

/* ─── Locate the Excel file ─── */
const DATA_DIR = __dirname;
function findExcelFile() {
    const files = fs.readdirSync(DATA_DIR);
    return files.find(
        (f) =>
            f.endsWith(".xlsx") &&
            !f.startsWith("~$") &&
            f.toLowerCase().includes("stock pick")
    );
}

let excelFileName = findExcelFile();
let excelPath = excelFileName ? path.join(DATA_DIR, excelFileName) : null;
let data = null;
let lastUpdated = null;

function reload() {
    // Re-search in case file was renamed
    excelFileName = findExcelFile();
    excelPath = excelFileName ? path.join(DATA_DIR, excelFileName) : null;
    if (!excelPath || !fs.existsSync(excelPath)) {
        console.error("❌ Excel file not found in", DATA_DIR);
        return;
    }
    try {
        data = parseExcel(excelPath);
        lastUpdated = new Date().toISOString();
        console.log(`✅ Data loaded from "${excelFileName}" at ${lastUpdated}`);
    } catch (err) {
        console.error("❌ Error parsing Excel:", err.message);
    }
}

reload();

/* ─── File Watcher ─── */
const watcher = chokidar.watch(DATA_DIR, {
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

/* ─── Static files ─── */
app.use(express.static(path.join(__dirname, "public")));

/* ─── API routes ─── */
app.get("/api/meta", (req, res) => {
    res.json({
        fileName: excelFileName,
        lastUpdated,
        stockCount: data?.dataDump?.length || 0,
        passCount: data?.portfolio25?.length || 0,
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

/* ─── Start ─── */
app.listen(PORT, () => {
    console.log(`\n🚀 Stock Pick Dashboard running at http://localhost:${PORT}\n`);
});
