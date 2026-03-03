/**
 * app.js — SPA Router + Page Renderers
 */
(function () {
    "use strict";

    const $content = document.getElementById("content");
    const $pageTitle = document.getElementById("pageTitle");
    const $fileBadge = document.getElementById("fileBadge");
    const $timeBadge = document.getElementById("timeBadge");
    const $updateText = document.getElementById("updateText");
    const $menuToggle = document.getElementById("menuToggle");
    const $sidebar = document.getElementById("sidebar");

    let lastTs = null;
    let cachedMeta = null;

    // ─── Mobile menu toggle ───
    $menuToggle.addEventListener("click", () => $sidebar.classList.toggle("open"));
    document.addEventListener("click", (e) => {
        if (
            $sidebar.classList.contains("open") &&
            !$sidebar.contains(e.target) &&
            e.target !== $menuToggle
        ) {
            $sidebar.classList.remove("open");
        }
    });

    // ─── Helpers ───
    const fmt = (v, d = 2) =>
        v == null || isNaN(v) ? "—" : Number(v).toFixed(d);
    const fmtPct = (v) => (v == null || isNaN(v) ? "—" : (v * 100).toFixed(1) + "%");
    const fmtLakh = (v) => {
        if (v == null || isNaN(v)) return "—";
        if (v >= 100000) return (v / 100000).toFixed(1) + "L Cr";
        if (v >= 1000) return (v / 1000).toFixed(1) + "K Cr";
        return fmt(v, 1) + " Cr";
    };
    const clr = (v) => (v > 0 ? "positive" : v < 0 ? "negative" : "");
    const trapBadge = (level) => {
        const l = (level || "").toLowerCase();
        if (l === "high") return '<span class="badge badge-low">High Risk</span>';
        if (l === "medium") return '<span class="badge badge-medium">Medium</span>';
        return '<span class="badge badge-high">Low Risk</span>';
    };
    const scoreFill = (score, max = 1) => {
        const pct = Math.min(100, Math.max(0, ((score || 0) / max) * 100));
        const c = pct >= 60 ? "#22c55e" : pct >= 35 ? "#f59e0b" : "#ef4444";
        return `<div class="score-bar-wrap">
      <div class="score-bar"><div class="score-bar-fill" style="width:${pct}%;background:${c}"></div></div>
      <span class="score-val" style="color:${c}">${fmtPct(score)}</span>
    </div>`;
    };

    // ─── Routes ───
    const routes = {
        "/": { title: "Dashboard", render: renderDashboard },
        "/portfolio": { title: "Portfolio 25", render: renderPortfolio },
        "/top-picks": { title: "Top Picks", render: renderTopPicks },
        "/stocks": { title: "Stock Explorer", render: renderStocks },
        "/sectors": { title: "Sector Allocation", render: renderSectors },
        "/methodology": { title: "Methodology", render: renderMethodology },
    };

    function navigate() {
        const hash = (location.hash || "#/").replace("#", "");
        const route = routes[hash] || routes["/"];
        $pageTitle.textContent = route.title;
        document
            .querySelectorAll(".nav-item")
            .forEach((el) =>
                el.classList.toggle("active", el.getAttribute("href") === "#" + hash)
            );
        $sidebar.classList.remove("open");
        Charts.destroyAll();
        $content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading data…</p></div>';
        route.render();
    }

    window.addEventListener("hashchange", navigate);

    // ─── Meta polling ───
    async function pollMeta() {
        try {
            cachedMeta = await API.meta();
            $fileBadge.textContent = cachedMeta.fileName || "";
            const d = cachedMeta.lastUpdated ? new Date(cachedMeta.lastUpdated) : null;
            $timeBadge.textContent = d ? d.toLocaleTimeString() : "";
            if (lastTs && lastTs !== cachedMeta.lastUpdated) {
                $updateText.textContent = "Updated!";
                setTimeout(() => ($updateText.textContent = "Synced"), 3000);
                navigate(); // refresh current view
            }
            lastTs = cachedMeta.lastUpdated;
        } catch (e) {
            $updateText.textContent = "Offline";
        }
    }
    setInterval(pollMeta, 10000);
    pollMeta();

    // ─── Sorting helper ───
    function attachSort(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const headers = table.querySelectorAll("thead th");
        headers.forEach((th, idx) => {
            th.addEventListener("click", () => {
                const tbody = table.querySelector("tbody");
                const rows = Array.from(tbody.querySelectorAll("tr"));
                const asc = !th.classList.contains("sort-asc");
                headers.forEach((h) => h.classList.remove("sort-asc", "sort-desc"));
                th.classList.add(asc ? "sort-asc" : "sort-desc");
                rows.sort((a, b) => {
                    let av = a.children[idx]?.textContent.trim().replace(/[₹,%]/g, "");
                    let bv = b.children[idx]?.textContent.trim().replace(/[₹,%]/g, "");
                    const an = parseFloat(av),
                        bn = parseFloat(bv);
                    if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
                    return asc ? av.localeCompare(bv) : bv.localeCompare(av);
                });
                rows.forEach((r) => tbody.appendChild(r));
            });
        });
    }

    // ══════════════════════════════════════
    //  DASHBOARD
    // ══════════════════════════════════════
    async function renderDashboard() {
        try {
            const [diag, portfolio, sectors] = await Promise.all([
                API.diagnostics(),
                API.portfolio(),
                API.sectors(),
            ]);
            const total = diag["Total stocks"] || 0;
            const pass = diag["Pass_All count"] || 0;
            const top25 = diag["Top25 (Pass) count"] || 0;
            const avgScore = diag["Avg FinalScore (Pass)"] || 0;
            const medScore = diag["Median FinalScore (Pass)"] || 0;
            const avgPE = diag["Avg P/E (Pass)"] || 0;
            const avgPB = diag["Avg P/B (Pass)"] || 0;
            const avgEV = diag["Avg EV/EBITDA (Pass)"] || 0;
            const avgDebt = diag["Avg Debt/Eq (Pass)"] || 0;
            const avgRet = diag["Avg 6m return % (Pass)"] || 0;

            $content.innerHTML = `
        <!-- Process Steps -->
        <div class="process-steps">
          <div class="step-card">
            <div class="step-num">01</div>
            <div class="step-title">Screen</div>
            <div class="step-desc">Filter ${total} stocks using value, quality & safety criteria from Screener.in</div>
          </div>
          <div class="step-card">
            <div class="step-num">02</div>
            <div class="step-title">Score</div>
            <div class="step-desc">Rank each stock across 5 factor pillars using percentile scoring</div>
          </div>
          <div class="step-card">
            <div class="step-num">03</div>
            <div class="step-title">Filter</div>
            <div class="step-desc">${pass} of ${total} stocks pass all quality gates (Value, Quality, Safety)</div>
          </div>
          <div class="step-card">
            <div class="step-num">04</div>
            <div class="step-title">Select</div>
            <div class="step-desc">Top ${top25} stocks ranked by FinalScore form the portfolio</div>
          </div>
          <div class="step-card">
            <div class="step-num">05</div>
            <div class="step-title">Allocate</div>
            <div class="step-desc">Equal-weight allocation across ${sectors.length} sectors</div>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Universe Size</div>
            <div class="stat-value">${total}</div>
            <div class="stat-sub">Stocks screened</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Pass All Filters</div>
            <div class="stat-value" style="color:var(--green)">${pass}</div>
            <div class="stat-sub">${((pass / total) * 100).toFixed(0)}% pass rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg FinalScore</div>
            <div class="stat-value" style="color:var(--accent-light)">${fmtPct(avgScore)}</div>
            <div class="stat-sub">Median: ${fmtPct(medScore)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg P/E</div>
            <div class="stat-value">${fmt(avgPE, 1)}×</div>
            <div class="stat-sub">Passing stocks</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg EV/EBITDA</div>
            <div class="stat-value">${fmt(avgEV, 1)}×</div>
            <div class="stat-sub">Passing stocks</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg 6M Return</div>
            <div class="stat-value ${clr(avgRet)}">${fmt(avgRet, 1)}%</div>
            <div class="stat-sub">Passing stocks</div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="chart-row">
          <div class="card">
            <div class="card-header"><span class="card-title">Sector Allocation</span></div>
            <div class="chart-container"><canvas id="dashDonut"></canvas></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Top 10 by FinalScore</span></div>
            <div class="chart-container"><canvas id="dashBar"></canvas></div>
          </div>
        </div>

        <!-- Top 5 Preview -->
        <div class="section-header">
          <span class="section-title">Portfolio Preview — Top 5</span>
          <a href="#/portfolio" style="color:var(--accent-light);font-size:.82rem;text-decoration:none">View all 25 →</a>
        </div>
        <div class="table-wrap">
          <table id="dashTable">
            <thead>
              <tr>
                <th>#</th><th>Company</th><th>Sector</th><th>CMP</th><th>Market Cap</th>
                <th>FinalScore</th><th>Value</th><th>Quality</th><th>Safety</th><th>Trap</th>
              </tr>
            </thead>
            <tbody>
              ${portfolio
                    .slice(0, 5)
                    .map(
                        (s) => `<tr>
                  <td>${s.rank}</td>
                  <td><strong>${s.company}</strong></td>
                  <td><span class="badge badge-accent">${s.sector || "—"}</span></td>
                  <td class="num">₹${fmt(s.cmp, 1)}</td>
                  <td class="num">${fmtLakh(s.marketCap)}</td>
                  <td>${scoreFill(s.finalScore)}</td>
                  <td>${scoreFill(s.valueScore)}</td>
                  <td>${scoreFill(s.qualityScore)}</td>
                  <td>${scoreFill(s.safetyScore)}</td>
                  <td>${trapBadge(s.trapLevel)}</td>
                </tr>`
                    )
                    .join("")}
            </tbody>
          </table>
        </div>
      `;

            // Charts
            if (sectors.length) {
                Charts.donut(
                    "dashDonut",
                    sectors.map((s) => s.sector),
                    sectors.map((s) => s.weight)
                );
            }
            const top10 = portfolio.slice(0, 10);
            Charts.bar(
                "dashBar",
                top10.map((s) => s.company),
                top10.map((s) => +(s.finalScore * 100).toFixed(1)),
                "FinalScore %"
            );
        } catch (e) {
            $content.innerHTML = `<p style="color:var(--red)">Error loading dashboard: ${e.message}</p>`;
        }
    }

    // ══════════════════════════════════════
    //  PORTFOLIO 25
    // ══════════════════════════════════════
    async function renderPortfolio() {
        try {
            const data = await API.portfolio();
            $content.innerHTML = `
        <div class="section-header">
          <div>
            <span class="section-title">Selected Portfolio — Top 25</span>
            <p class="section-subtitle">${data.length} stocks · Equal-weight allocation</p>
          </div>
        </div>
        <div class="table-wrap">
          <table id="portfolioTable">
            <thead>
              <tr>
                <th>#</th><th>Company</th><th>Sector</th><th>CMP</th><th>Mkt Cap</th>
                <th>P/E</th><th>P/B</th><th>EV/EBITDA</th><th>Debt/Eq</th>
                <th>FinalScore</th><th>Value</th><th>Quality</th><th>Safety</th>
                <th>Cash</th><th>Momentum</th><th>Trap</th><th>6M Ret</th><th>Wt%</th>
              </tr>
            </thead>
            <tbody>
              ${data
                    .map(
                        (s) => `<tr>
                  <td>${s.rank}</td>
                  <td><strong>${s.company}</strong><br><span style="font-size:.7rem;color:var(--text-muted)">${s.industry || ""}</span></td>
                  <td><span class="badge badge-accent">${s.sector || "—"}</span></td>
                  <td class="num">₹${fmt(s.cmp, 1)}</td>
                  <td class="num">${fmtLakh(s.marketCap)}</td>
                  <td class="num">${fmt(s.pe, 1)}</td>
                  <td class="num">${fmt(s.pb, 1)}</td>
                  <td class="num">${fmt(s.evEbitda, 1)}</td>
                  <td class="num">${fmt(s.debtEq, 2)}</td>
                  <td>${scoreFill(s.finalScore)}</td>
                  <td>${scoreFill(s.valueScore)}</td>
                  <td>${scoreFill(s.qualityScore)}</td>
                  <td>${scoreFill(s.safetyScore)}</td>
                  <td>${scoreFill(s.cashScore)}</td>
                  <td>${scoreFill(s.momentumScore)}</td>
                  <td>${trapBadge(s.trapLevel)}</td>
                  <td class="num ${clr(s.sixMReturn)}">${fmt(s.sixMReturn, 1)}%</td>
                  <td class="num">${s.weight != null ? (s.weight * 100).toFixed(0) + "%" : "—"}</td>
                </tr>`
                    )
                    .join("")}
            </tbody>
          </table>
        </div>
      `;
            attachSort("portfolioTable");
        } catch (e) {
            $content.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
        }
    }

    // ══════════════════════════════════════
    //  TOP PICKS
    // ══════════════════════════════════════
    async function renderTopPicks() {
        try {
            const data = await API.topPicks();
            $content.innerHTML = `
        <div class="section-header">
          <div>
            <span class="section-title">Top Picks — Detailed Fundamentals</span>
            <p class="section-subtitle">${data.length} stocks with full valuation breakdown</p>
          </div>
        </div>

        <!-- Radar chart for top 5 -->
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><span class="card-title">Score Radar — Top 5</span></div>
          <div class="chart-container" style="height:320px"><canvas id="radarTop5"></canvas></div>
        </div>

        <div class="table-wrap">
          <table id="topPicksTable">
            <thead>
              <tr>
                <th>#</th><th>Company</th><th>Sector</th><th>CMP</th><th>Mkt Cap</th>
                <th>P/E</th><th>Ind P/E</th><th>Rel PE</th>
                <th>P/B</th><th>Ind P/B</th><th>Rel PB</th>
                <th>EV/EBITDA</th><th>P/FCF</th><th>Earn Yld</th>
                <th>ROCE</th><th>ROE</th><th>Piotroski</th>
                <th>Debt/Eq</th><th>Int Cov</th><th>Altman Z</th>
                <th>Prom%</th><th>6M Ret</th><th>Score</th><th>Trap</th>
              </tr>
            </thead>
            <tbody>
              ${data
                    .map(
                        (s) => `<tr>
                  <td>${s.rank}</td>
                  <td><strong>${s.company}</strong></td>
                  <td><span class="badge badge-accent">${s.sector || "—"}</span></td>
                  <td class="num">₹${fmt(s.cmp, 1)}</td>
                  <td class="num">${fmtLakh(s.marketCap)}</td>
                  <td class="num">${fmt(s.pe, 1)}</td>
                  <td class="num">${fmt(s.indPE, 1)}</td>
                  <td class="num">${fmt(s.relPE, 2)}</td>
                  <td class="num">${fmt(s.pb, 1)}</td>
                  <td class="num">${fmt(s.indPB, 1)}</td>
                  <td class="num">${fmt(s.relPB, 2)}</td>
                  <td class="num">${fmt(s.evEbitda, 1)}</td>
                  <td class="num">${fmt(s.cmpFcf, 1)}</td>
                  <td class="num">${fmt(s.earningsYield, 1)}%</td>
                  <td class="num ${clr(s.roce)}">${fmt(s.roce, 1)}%</td>
                  <td class="num ${clr(s.roe)}">${fmt(s.roe, 1)}%</td>
                  <td class="num">${fmt(s.piotroski, 0)}</td>
                  <td class="num">${fmt(s.debtEq, 2)}</td>
                  <td class="num">${fmt(s.intCoverage, 1)}</td>
                  <td class="num">${fmt(s.altmanZ, 1)}</td>
                  <td class="num">${fmt(s.promoterHold, 1)}%</td>
                  <td class="num ${clr(s.sixMReturn)}">${fmt(s.sixMReturn, 1)}%</td>
                  <td>${scoreFill(s.finalScore)}</td>
                  <td>${trapBadge(s.trapLevel)}</td>
                </tr>`
                    )
                    .join("")}
            </tbody>
          </table>
        </div>
      `;
            attachSort("topPicksTable");

            // Radar for top 5
            const top5 = data.slice(0, 5);
            if (top5.length) {
                Charts.radar(
                    "radarTop5",
                    ["Value (P/E inv)", "Quality (ROCE)", "Safety (Alt Z)", "Yield", "Momentum"],
                    top5.map((s) => ({
                        label: s.company,
                        data: [
                            s.pe ? Math.min(1, 25 / s.pe) : 0,
                            s.roce ? Math.min(1, s.roce / 60) : 0,
                            s.altmanZ ? Math.min(1, s.altmanZ / 15) : 0,
                            s.earningsYield ? Math.min(1, s.earningsYield / 20) : 0,
                            s.sixMReturn != null ? Math.max(0, Math.min(1, (s.sixMReturn + 30) / 80)) : 0,
                        ],
                    }))
                );
            }
        } catch (e) {
            $content.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
        }
    }

    // ══════════════════════════════════════
    //  STOCK EXPLORER
    // ══════════════════════════════════════
    async function renderStocks() {
        try {
            const data = await API.stocks();
            let filtered = [...data];
            let sectorFilter = "All";

            const sectors = [...new Set(data.map((s) => s.sector).filter(Boolean))].sort();

            function renderTable() {
                const tbody = document.getElementById("stocksBody");
                const count = document.getElementById("stocksCount");
                if (!tbody) return;
                const q = (document.getElementById("stockSearch")?.value || "").toLowerCase();
                let list = filtered;
                if (q) {
                    list = list.filter(
                        (s) =>
                            (s.company || "").toLowerCase().includes(q) ||
                            (s.industry || "").toLowerCase().includes(q) ||
                            (s.sector || "").toLowerCase().includes(q)
                    );
                }
                count.textContent = `${list.length} stocks`;
                tbody.innerHTML = list
                    .map(
                        (s) => `<tr>
            <td>${s.sno}</td>
            <td><strong>${s.company}</strong><br><span style="font-size:.7rem;color:var(--text-muted)">${s.industry || ""}</span></td>
            <td><span class="badge badge-accent">${s.sector || "—"}</span></td>
            <td class="num">₹${fmt(s.cmp, 1)}</td>
            <td class="num">${fmtLakh(s.marketCap)}</td>
            <td class="num">${fmt(s.pe, 1)}</td>
            <td class="num">${fmt(s.pb, 1)}</td>
            <td class="num">${fmt(s.evEbitda, 1)}</td>
            <td class="num ${clr(s.roce)}">${fmt(s.roce, 1)}%</td>
            <td class="num ${clr(s.roe)}">${fmt(s.roe, 1)}%</td>
            <td class="num">${fmt(s.piotroski, 0)}</td>
            <td class="num">${fmt(s.debtEq, 2)}</td>
            <td class="num">${fmt(s.altmanZ, 1)}</td>
            <td class="num">${fmt(s.promoterHold, 1)}%</td>
            <td class="num ${clr(s.sixMReturn)}">${fmt(s.sixMReturn, 1)}%</td>
            <td>${s.finalScore != null ? scoreFill(s.finalScore) : "—"}</td>
            <td>${s.passAll === "Y" ? '<span class="badge badge-high">Pass</span>' : '<span class="badge badge-low">Fail</span>'}</td>
            <td>${s.trapLevel ? trapBadge(s.trapLevel) : "—"}</td>
          </tr>`
                    )
                    .join("");
                attachSort("stocksTable");
            }

            $content.innerHTML = `
        <div class="section-header">
          <div>
            <span class="section-title">Full Stock Universe</span>
            <p class="section-subtitle">${data.length} stocks from screener output</p>
          </div>
        </div>

        <div class="toolbar">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="stockSearch" placeholder="Search company, industry, or sector…">
          </div>
          <button class="filter-btn active" data-sector="All">All</button>
          ${sectors.map((s) => `<button class="filter-btn" data-sector="${s}">${s}</button>`).join("")}
          <span class="result-count" id="stocksCount">${data.length} stocks</span>
        </div>

        <div class="table-wrap" style="max-height:65vh;overflow-y:auto">
          <table id="stocksTable">
            <thead>
              <tr>
                <th>#</th><th>Company</th><th>Sector</th><th>CMP</th><th>Mkt Cap</th>
                <th>P/E</th><th>P/B</th><th>EV/EBITDA</th><th>ROCE</th><th>ROE</th>
                <th>Piotroski</th><th>Debt/Eq</th><th>Altman Z</th><th>Prom%</th>
                <th>6M Ret</th><th>FinalScore</th><th>Status</th><th>Trap</th>
              </tr>
            </thead>
            <tbody id="stocksBody"></tbody>
          </table>
        </div>
      `;

            renderTable();

            // Search
            document.getElementById("stockSearch").addEventListener("input", renderTable);

            // Sector filter
            document.querySelectorAll(".filter-btn").forEach((btn) => {
                btn.addEventListener("click", () => {
                    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
                    btn.classList.add("active");
                    const sec = btn.dataset.sector;
                    sectorFilter = sec;
                    filtered = sec === "All" ? [...data] : data.filter((s) => s.sector === sec);
                    renderTable();
                });
            });
        } catch (e) {
            $content.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
        }
    }

    // ══════════════════════════════════════
    //  SECTOR ALLOCATION
    // ══════════════════════════════════════
    async function renderSectors() {
        try {
            const [sectors, portfolio] = await Promise.all([API.sectors(), API.portfolio()]);

            $content.innerHTML = `
        <div class="section-header">
          <div>
            <span class="section-title">Sector Allocation</span>
            <p class="section-subtitle">Portfolio weight distribution across ${sectors.length} sectors</p>
          </div>
        </div>

        <div class="chart-row">
          <div class="card">
            <div class="card-header"><span class="card-title">Weight Distribution</span></div>
            <div class="chart-container"><canvas id="sectorDonut"></canvas></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Sector Weights (%)</span></div>
            <div class="chart-container"><canvas id="sectorBar"></canvas></div>
          </div>
        </div>

        <!-- Sector breakdown table -->
        <div class="card" style="margin-top:8px">
          <div class="card-header"><span class="card-title">Sector → Stocks Breakdown</span></div>
          ${sectors
                    .map((sec) => {
                        const stocks = portfolio.filter((s) => s.sector === sec.sector);
                        return `
              <div style="margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                  <span class="badge badge-accent">${sec.sector}</span>
                  <span style="font-size:.78rem;color:var(--text-muted)">${sec.weight}% · ${stocks.length} stocks</span>
                </div>
                ${stocks.length
                                ? `<div class="table-wrap"><table>
                    <thead><tr><th>Company</th><th>CMP</th><th>P/E</th><th>FinalScore</th><th>6M Ret</th></tr></thead>
                    <tbody>${stocks
                                    .map(
                                        (s) => `<tr>
                        <td><strong>${s.company}</strong></td>
                        <td class="num">₹${fmt(s.cmp, 1)}</td>
                        <td class="num">${fmt(s.pe, 1)}</td>
                        <td>${scoreFill(s.finalScore)}</td>
                        <td class="num ${clr(s.sixMReturn)}">${fmt(s.sixMReturn, 1)}%</td>
                      </tr>`
                                    )
                                    .join("")}
                    </tbody></table></div>`
                                : `<p style="color:var(--text-muted);font-size:.8rem">No stocks in this sector</p>`
                            }
              </div>`;
                    })
                    .join("")}
        </div>
      `;

            Charts.donut(
                "sectorDonut",
                sectors.map((s) => s.sector),
                sectors.map((s) => s.weight)
            );
            Charts.bar(
                "sectorBar",
                sectors.map((s) => s.sector),
                sectors.map((s) => s.weight),
                "Weight %",
                "#6366f1"
            );
        } catch (e) {
            $content.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
        }
    }

    // ══════════════════════════════════════
    //  METHODOLOGY
    // ══════════════════════════════════════
    async function renderMethodology() {
        try {
            const home = await API.home();

            $content.innerHTML = `
        <div class="section-header">
          <span class="section-title">${home.title || "Value Screener — Methodology"}</span>
        </div>

        <!-- Weight breakdown -->
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><span class="card-title">Score Weights</span></div>
          <div class="weight-pills">
            <div class="weight-pill">Value <span class="wp-pct">40%</span></div>
            <div class="weight-pill">Quality <span class="wp-pct">25%</span></div>
            <div class="weight-pill">Safety <span class="wp-pct">20%</span></div>
            <div class="weight-pill">Cash <span class="wp-pct">10%</span></div>
            <div class="weight-pill">Momentum <span class="wp-pct">5%</span></div>
          </div>
          <p style="margin-top:12px;font-size:.82rem;color:var(--text-muted)">${home.weights || ""}</p>
        </div>

        <!-- Weight visual bar -->
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><span class="card-title">Weight Visualization</span></div>
          <div class="chart-container" style="height:200px"><canvas id="weightBar"></canvas></div>
        </div>

        <!-- Screener filter -->
        <div class="method-section card" style="margin-bottom:24px">
          <div class="card-header"><span class="card-title">Initial Screener Filter</span></div>
          <div class="method-body" style="background:var(--bg-elevated);padding:16px;border-radius:var(--radius-sm);font-family:monospace;font-size:.78rem;line-height:1.8;color:var(--cyan)">${(home.screenerFilter || "").replace(/\n/g, "<br>")}</div>
        </div>

        <!-- Scoring logic -->
        <div class="method-section card">
          <div class="card-header"><span class="card-title">Scoring Logic & How to Read</span></div>
          <div class="method-body">${(home.scoringLogic || "").replace(/\n/g, "<br>")}</div>
        </div>
      `;

            Charts.verticalBar(
                "weightBar",
                ["Value", "Quality", "Safety", "Cash", "Momentum"],
                [{
                    label: "Weight %",
                    data: [40, 25, 20, 10, 5],
                }]
            );
        } catch (e) {
            $content.innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
        }
    }

    // ─── Init ───
    navigate();
})();
