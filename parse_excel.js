/**
 * parse_excel.js
 * Reads the Stock Pick Excel workbook and converts all sheets to structured JSON.
 */
const XLSX = require("xlsx");
const path = require("path");

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const result = {};

  /* ─── Home / Methodology ─── */
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

  /* ─── Portfolio_25 ─── */
  const p25Ws = wb.Sheets["Portfolio_25"];
  if (p25Ws) {
    const raw = XLSX.utils.sheet_to_json(p25Ws, { defval: null });
    result.portfolio25 = raw
      .filter((r) => r["Rank"] != null)
      .map((r) => ({
        rank: r["Rank"],
        industry: r["Industry"],
        sector: r["Broad Sector"],
        company: r["Company"],
        name: r["Name"],
        marketCap: r["Mar Cap Rs.Cr."],
        cmp: r["CMP Rs."],
        finalScore: r["FinalScore"],
        valueScore: r["ValueScore"],
        qualityScore: r["QualityScore"],
        safetyScore: r["SafetyScore"],
        cashScore: r["CashScore"],
        momentumScore: r["MomentumScore"],
        trapLevel: r["TrapLevel"],
        pe: r["P/E"],
        pb: r["CMP / BV"],
        evEbitda: r["EV / EBITDA"],
        earningsYield: r["Earnings Yield %"],
        debtEq: r["Debt / Eq"],
        intCoverage: r["Int Coverage"],
        altmanZ: r["Altman Z Scr"],
        pledged: r["Pledged %"],
        promoterHold: r["Prom. Hold. %"],
        sixMReturn: r["6mth return %"],
        weight: r["Weight25"],
      }));
  }

  /* ─── Top_Picks ─── */
  const tpWs = wb.Sheets["Top_Picks"];
  if (tpWs) {
    const raw = XLSX.utils.sheet_to_json(tpWs, { defval: null });
    result.topPicks = raw
      .filter((r) => r["Rank"] != null)
      .map((r) => ({
        rank: r["Rank"],
        industry: r["Industry"],
        sector: r["Broad Sector"],
        company: r["Company"],
        name: r["Name"],
        cmp: r["CMP Rs."],
        marketCap: r["Mar Cap Rs.Cr."],
        pe: r["P/E"],
        indPE: r["Ind PE"],
        relPE: r["Rel_PE"],
        pb: r["CMP / BV"],
        indPB: r["Ind PBV"],
        relPB: r["Rel_PB"],
        evEbitda: r["EV / EBITDA"],
        cmpFcf: r["CMP / FCF"],
        earningsYield: r["Earnings Yield %"],
        roce: r["ROCE %"],
        roe: r["ROE %"],
        piotroski: r["Piotski Scr"],
        debtEq: r["Debt / Eq"],
        intCoverage: r["Int Coverage"],
        quickRatio: r["Quick Rat"],
        altmanZ: r["Altman Z Scr"],
        promoterHold: r["Prom. Hold. %"],
        pledged: r["Pledged %"],
        sixMReturn: r["6mth return %"],
        finalScore: r["FinalScore"],
        trapLevel: r["TrapLevel"],
      }));
  }

  /* ─── Sector Allocation ─── */
  const saWs = wb.Sheets["Sector Allocation "];
  if (saWs) {
    const raw = XLSX.utils.sheet_to_json(saWs, { defval: null });
    result.sectorAllocation = raw
      .filter((r) => r["Sector"] != null)
      .map((r) => ({
        sector: r["Sector"],
        weight: r["Weight_Percent"],
      }));
  }

  /* ─── data_dump (full universe) ─── */
  const ddWs = wb.Sheets["data_dump"];
  if (ddWs) {
    const raw = XLSX.utils.sheet_to_json(ddWs, { defval: null });
    result.dataDump = raw
      .filter((r) => r["S.No."] != null)
      .map((r) => ({
        sno: r["S.No."],
        industry: r["Industry"],
        sector: r["Broad Sector"],
        company: r["Company"],
        name: r["Name"],
        cmp: r["CMP Rs."],
        marketCap: r["Mar Cap Rs.Cr."],
        pe: r["P/E"],
        indPE: r["Ind PE"],
        pb: r["CMP / BV"],
        indPB: r["Ind PBV"],
        evEbitda: r["EV / EBITDA"],
        roce: r["ROCE %"],
        roe: r["ROE %"],
        roa: r["ROA 12M %"],
        gFactor: r["G Factor"],
        earningsYield: r["Earnings Yield %"],
        piotroski: r["Piotski Scr"],
        debtEq: r["Debt / Eq"],
        avgVol: r["Avg Vol 1Yr"],
        sixMReturn: r["6mth return %"],
        dma50: r["50 DMA Rs."],
        dma200: r["200 DMA Rs."],
        cfoOpr5: r["CF Opr 5Yrs Rs.Cr."],
        fcf5: r["Free Cash Flow 5Yrs Rs.Cr."],
        fcf3: r["Free Cash Flow 3Yrs Rs.Cr."],
        cmpFcf: r["CMP / FCF"],
        intCoverage: r["Int Coverage"],
        quickRatio: r["Quick Rat"],
        altmanZ: r["Altman Z Scr"],
        promoterHold: r["Prom. Hold. %"],
        pledged: r["Pledged %"],
        valueScore: r["ValueScore (weighted)"],
        qualityScore: r["QualityScore (weighted)"],
        safetyScore: r["SafetyScore (weighted)"],
        cashScore: r["CashScore"],
        momentumScore: r["MomentumScore"],
        liquidityScore: r["LiquidityScore (AvgVol)"],
        valueTrapRisk: r["ValueTrapRisk"],
        trapLevel: r["TrapRisk Level"],
        finalScore: r["FinalScore"],
        universeOk: r["Universe_OK"],
        valueOk: r["Value_OK"],
        qualityOk: r["Quality_OK"],
        safetyOk: r["Safety_OK"],
        passAll: r["Pass_All"],
        rankPass: r["Rank_Pass"],
        weight: r["Suggested Weight (Top25)"],
      }));
  }

  /* ─── Diagnostics ─── */
  const diagWs = wb.Sheets["Diagnostics"];
  if (diagWs) {
    const raw = XLSX.utils.sheet_to_json(diagWs, { defval: null });
    result.diagnostics = {};
    raw.forEach((r) => {
      if (r["Metric"] != null) {
        result.diagnostics[r["Metric"]] = r["Value"];
      }
    });
  }

  /* ─── Industry_to_Sector mapping ─── */
  const isWs = wb.Sheets["Industry_to_Sector"];
  if (isWs) {
    const raw = XLSX.utils.sheet_to_json(isWs, { defval: null });
    result.industryToSector = raw
      .filter((r) => r["Industry"] != null)
      .map((r) => ({
        industry: r["Industry"],
        sector: r["Suggested Broad Sector"],
        notes: r["Notes (edit sector if needed)"],
      }));
  }

  return result;
}

module.exports = { parseExcel };
