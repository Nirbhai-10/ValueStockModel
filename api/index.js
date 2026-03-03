/**
 * api/index.js — Vercel serverless entry point
 * Self-contained: inlines server and parser to avoid cross-directory require issues.
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

const app = express();

/* ══════════════════════════════════════
   Excel Parser (inlined from parse_excel.js)
   ══════════════════════════════════════ */
function parseExcel(filePath) {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    const result = {};

    const homeWs = wb.Sheets["Home"];
    if (homeWs) {
        const rows = XLSX.utils.sheet_to_json(homeWs, { header: 1, defval: "" });
        result.home = {
            title: rows[0] ? rows[0][0] : "Value Screener Output",
            screenerFilter: rows[2] ? rows[2][1] : "",
            scoringLogic: rows[4] ? rows[4][1] : "",
            weights: rows[45] ? rows[45][1] : "",
        };
    }

    const p25Ws = wb.Sheets["Portfolio_25"];
    if (p25Ws) {
        const raw = XLSX.utils.sheet_to_json(p25Ws, { defval: null });
        result.portfolio25 = raw
            .filter((r) => r["Rank"] != null)
            .map((r) => ({
                rank: r["Rank"], industry: r["Industry"], sector: r["Broad Sector"],
                company: r["Company"], name: r["Name"], marketCap: r["Mar Cap Rs.Cr."],
                cmp: r["CMP Rs."], finalScore: r["FinalScore"], valueScore: r["ValueScore"],
                qualityScore: r["QualityScore"], safetyScore: r["SafetyScore"],
                cashScore: r["CashScore"], momentumScore: r["MomentumScore"],
                trapLevel: r["TrapLevel"], pe: r["P/E"], pb: r["CMP / BV"],
                evEbitda: r["EV / EBITDA"], earningsYield: r["Earnings Yield %"],
                debtEq: r["Debt / Eq"], intCoverage: r["Int Coverage"],
                altmanZ: r["Altman Z Scr"], pledged: r["Pledged %"],
                promoterHold: r["Prom. Hold. %"], sixMReturn: r["6mth return %"],
                weight: r["Weight25"],
            }));
    }

    const tpWs = wb.Sheets["Top_Picks"];
    if (tpWs) {
        const raw = XLSX.utils.sheet_to_json(tpWs, { defval: null });
        result.topPicks = raw
            .filter((r) => r["Rank"] != null)
            .map((r) => ({
                rank: r["Rank"], industry: r["Industry"], sector: r["Broad Sector"],
                company: r["Company"], name: r["Name"], cmp: r["CMP Rs."],
                marketCap: r["Mar Cap Rs.Cr."], pe: r["P/E"], indPE: r["Ind PE"],
                relPE: r["Rel_PE"], pb: r["CMP / BV"], indPB: r["Ind PBV"],
                relPB: r["Rel_PB"], evEbitda: r["EV / EBITDA"], cmpFcf: r["CMP / FCF"],
                earningsYield: r["Earnings Yield %"], roce: r["ROCE %"], roe: r["ROE %"],
                piotroski: r["Piotski Scr"], debtEq: r["Debt / Eq"],
                intCoverage: r["Int Coverage"], quickRatio: r["Quick Rat"],
                altmanZ: r["Altman Z Scr"], promoterHold: r["Prom. Hold. %"],
                pledged: r["Pledged %"], sixMReturn: r["6mth return %"],
                finalScore: r["FinalScore"], trapLevel: r["TrapLevel"],
            }));
    }

    const saWs = wb.Sheets["Sector Allocation "];
    if (saWs) {
        const raw = XLSX.utils.sheet_to_json(saWs, { defval: null });
        result.sectorAllocation = raw
            .filter((r) => r["Sector"] != null)
            .map((r) => ({ sector: r["Sector"], weight: r["Weight_Percent"] }));
    }

    const ddWs = wb.Sheets["data_dump"];
    if (ddWs) {
        const raw = XLSX.utils.sheet_to_json(ddWs, { defval: null });
        result.dataDump = raw
            .filter((r) => r["S.No."] != null)
            .map((r) => ({
                sno: r["S.No."], industry: r["Industry"], sector: r["Broad Sector"],
                company: r["Company"], name: r["Name"], cmp: r["CMP Rs."],
                marketCap: r["Mar Cap Rs.Cr."], pe: r["P/E"], indPE: r["Ind PE"],
                pb: r["CMP / BV"], indPB: r["Ind PBV"], evEbitda: r["EV / EBITDA"],
                roce: r["ROCE %"], roe: r["ROE %"], roa: r["ROA 12M %"],
                gFactor: r["G Factor"], earningsYield: r["Earnings Yield %"],
                piotroski: r["Piotski Scr"], debtEq: r["Debt / Eq"],
                avgVol: r["Avg Vol 1Yr"], sixMReturn: r["6mth return %"],
                dma50: r["50 DMA Rs."], dma200: r["200 DMA Rs."],
                cfoOpr5: r["CF Opr 5Yrs Rs.Cr."], fcf5: r["Free Cash Flow 5Yrs Rs.Cr."],
                fcf3: r["Free Cash Flow 3Yrs Rs.Cr."], cmpFcf: r["CMP / FCF"],
                intCoverage: r["Int Coverage"], quickRatio: r["Quick Rat"],
                altmanZ: r["Altman Z Scr"], promoterHold: r["Prom. Hold. %"],
                pledged: r["Pledged %"], valueScore: r["ValueScore (weighted)"],
                qualityScore: r["QualityScore (weighted)"], safetyScore: r["SafetyScore (weighted)"],
                cashScore: r["CashScore"], momentumScore: r["MomentumScore"],
                liquidityScore: r["LiquidityScore (AvgVol)"], valueTrapRisk: r["ValueTrapRisk"],
                trapLevel: r["TrapRisk Level"], finalScore: r["FinalScore"],
                universeOk: r["Universe_OK"], valueOk: r["Value_OK"],
                qualityOk: r["Quality_OK"], safetyOk: r["Safety_OK"],
                passAll: r["Pass_All"], rankPass: r["Rank_Pass"],
                weight: r["Suggested Weight (Top25)"],
            }));
    }

    const diagWs = wb.Sheets["Diagnostics"];
    if (diagWs) {
        const raw = XLSX.utils.sheet_to_json(diagWs, { defval: null });
        result.diagnostics = {};
        raw.forEach((r) => { if (r["Metric"] != null) result.diagnostics[r["Metric"]] = r["Value"]; });
    }

    const isWs = wb.Sheets["Industry_to_Sector"];
    if (isWs) {
        const raw = XLSX.utils.sheet_to_json(isWs, { defval: null });
        result.industryToSector = raw
            .filter((r) => r["Industry"] != null)
            .map((r) => ({ industry: r["Industry"], sector: r["Suggested Broad Sector"], notes: r["Notes (edit sector if needed)"] }));
    }

    return result;
}

/* ══════════════════════════════════════
   Find & Load Excel
   ══════════════════════════════════════ */
function findExcel() {
    // 1. Direct path: co-located in api/data/data.xlsx
    const direct = path.join(__dirname, "data", "data.xlsx");
    if (fs.existsSync(direct)) return { fileName: "data.xlsx", filePath: direct };

    // 2. Search parent directories for any .xlsx
    const searchDirs = [__dirname, path.resolve(__dirname, ".."), path.resolve(__dirname, "../..")];
    for (const dir of searchDirs) {
        try {
            const f = fs.readdirSync(dir).find((x) => x.endsWith(".xlsx") && !x.startsWith("~$"));
            if (f) return { fileName: f, filePath: path.join(dir, f) };
        } catch (e) { /* skip */ }
    }
    return { fileName: null, filePath: null };
}

let excel = findExcel();
let data = null;
let lastUpdated = null;
let loadError = null;

if (excel.filePath) {
    try {
        data = parseExcel(excel.filePath);
        lastUpdated = new Date().toISOString();
        loadError = null;
        console.log(`✅ Data loaded from "${excel.fileName}" at ${excel.filePath}`);
    } catch (err) {
        loadError = err.message;
        console.error("❌ Error parsing Excel:", err.message);
    }
} else {
    loadError = `Excel file not found. __dirname=${__dirname}`;
    console.error("❌", loadError);
}

/* ══════════════════════════════════════
   Static Files
   ══════════════════════════════════════ */
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

/* ══════════════════════════════════════
   API Routes
   ══════════════════════════════════════ */
app.get("/api/meta", (req, res) => {
    res.json({ fileName: excel.fileName, lastUpdated, stockCount: data?.dataDump?.length || 0, passCount: data?.portfolio25?.length || 0 });
});

app.get("/api/debug", (req, res) => {
    const dirs = [__dirname, path.resolve(__dirname, ".."), path.resolve(__dirname, "../..")];
    const dirContents = {};
    dirs.forEach(d => { try { dirContents[d] = fs.readdirSync(d).filter(f => !f.startsWith('.')).slice(0, 30); } catch (e) { dirContents[d] = e.message; } });
    res.json({ __dirname, publicDir, excelFound: excel.fileName, excelPath: excel.filePath, dataLoaded: !!data, loadError, dirContents });
});

app.get("/api/home", (req, res) => res.json(data?.home || {}));
app.get("/api/portfolio", (req, res) => res.json(data?.portfolio25 || []));
app.get("/api/top-picks", (req, res) => res.json(data?.topPicks || []));
app.get("/api/sectors", (req, res) => res.json(data?.sectorAllocation || []));
app.get("/api/stocks", (req, res) => res.json(data?.dataDump || []));
app.get("/api/diagnostics", (req, res) => res.json(data?.diagnostics || {}));

/* SPA fallback */
app.get("*", (req, res) => {
    const indexPath = path.join(publicDir, "index.html");
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: "index.html not found", publicDir, exists: fs.existsSync(publicDir) });
    }
});

module.exports = app;
