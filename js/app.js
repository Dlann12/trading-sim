/**
 * NusaTrade Sim — UI View Renderers, Event Handlers & Initialization
 */
/**************************************************************
 * 6. UI RENDERERS FOR ALL 10+ VIEWS
 **************************************************************/
function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    // Highlight active sidebar button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.dataset.nav === viewName) {
            btn.className = 'nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 transition';
        } else {
            btn.className = 'nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800/60 hover:text-white transition';
        }
    });

    // Close mobile sidebar if open
    const sb = document.getElementById('appSidebar');
    const bd = document.getElementById('sidebarBackdrop');
    if (!sb.classList.contains('-translate-x-full')) {
        sb.classList.add('-translate-x-full');
        bd.classList.add('hidden');
    }

    refreshAllActiveViews();
}

function toggleMobileSidebar() {
    const sb = document.getElementById('appSidebar');
    const bd = document.getElementById('sidebarBackdrop');
    sb.classList.toggle('-translate-x-full');
    bd.classList.toggle('hidden');
}

function refreshAllActiveViews() {
    updateHeaderAndSidebarStats();
    renderLiveTickerTape();

    if (currentView === 'dashboard') {
        renderDashboardView();
    } else if (currentView === 'market') {
        renderMarketList();
        renderSelectedAssetDetail();
    } else if (currentView === 'portfolio') {
        renderPortfolioView();
    } else if (currentView === 'history') {
        renderTransactionHistory();
    } else if (currentView === 'missions') {
        renderMissionsView();
    } else if (currentView === 'leaderboard') {
        renderLeaderboardView();
    } else if (currentView === 'profile') {
        renderProfileView();
    } else if (currentView === 'admin') {
        renderAdminAuditLogs();
    }
}

function updateHeaderAndSidebarStats() {
    const user = currentUser();
    const metrics = getAccountMetrics(user);
    const activeHoldingsCount = Object.keys(user.holdings).filter(k => user.holdings[k].units > 0).length;

    document.getElementById('headerCashBalance').textContent = formatIDR(user.cash);
    document.getElementById('headerUsername').textContent = user.username;
    document.getElementById('headerLevelBadge').textContent = `Lv.${user.level}`;
    document.getElementById('headerAvatar').className = `w-7 h-7 rounded-lg ${user.avatarBg} flex items-center justify-center text-white font-bold text-xs`;
    document.getElementById('headerAvatar').innerHTML = `<i class="fa-solid ${user.avatarIcon}"></i>`;

    const xpIntoLevel = user.xp % 250;
    const xpPct = Math.min(100, Math.max(6, Math.round((xpIntoLevel / 250) * 100)));
    document.getElementById('headerXpBar').style.width = `${xpPct}%`;
    document.getElementById('sidebarXpBar').style.width = `${xpPct}%`;
    document.getElementById('sidebarPlayerTitle').textContent = user.activeTitle;
    document.getElementById('sidebarXpText').textContent = `${user.xp} XP (Lv.${user.level})`;

    document.getElementById('navHoldingsCount').textContent = activeHoldingsCount;
    document.getElementById('navMissionsBadge').textContent = `${user.completedMissions.length}/${missionsCatalog.length}`;
}

function renderLiveTickerTape() {
    const container = document.getElementById('liveTickerTape');
    const itemsHtml = marketAssets.map(a => {
        const diff = a.price - a.prevClose;
        const pct = ((diff / a.prevClose) * 100).toFixed(2);
        const color = diff >= 0 ? 'text-emerald-400' : 'text-rose-400';
        const icon = diff >= 0 ? 'fa-caret-up' : 'fa-caret-down';
        return `
            <div onclick="selectAssetForTrading('${a.symbol}')" class="flex items-center gap-2 cursor-pointer hover:opacity-80">
                <span class="font-bold text-white">${a.symbol}</span>
                <span class="text-gray-300">${formatIDR(a.price)}</span>
                <span class="${color} flex items-center gap-1"><i class="fa-solid ${icon}"></i> ${diff >= 0 ? '+' : ''}${pct}%</span>
            </div>
        `;
    }).join('<span class="text-gray-700">|</span>');
    // Duplicate for seamless marquee loop
    container.innerHTML = itemsHtml + '<span class="text-gray-700 mx-4">|</span>' + itemsHtml;
}

// VIEW 2: DASHBOARD RENDERER
function renderDashboardView() {
    const user = currentUser();
    const m = getAccountMetrics(user);

    document.getElementById('dashTitleBadge').textContent = user.activeTitle;
    document.getElementById('dashTotalEquity').textContent = formatIDR(m.totalEquity);
    document.getElementById('dashCashBalance').textContent = formatIDR(m.cash);

    const assetRatio = m.totalEquity > 0 ? Math.round((m.totalMarketValue / m.totalEquity) * 100) : 0;
    document.getElementById('dashHoldingsRatio').textContent = `${assetRatio}% Aset`;
    document.getElementById('dashCashRatio').textContent = `${100 - assetRatio}% Kas`;

    const pnlEl = document.getElementById('dashTotalPnL');
    pnlEl.textContent = formatSignedIDR(m.totalPnL);
    pnlEl.className = `font-mono text-xl sm:text-2xl font-bold ${m.totalPnL > 0 ? 'text-emerald-400' : m.totalPnL < 0 ? 'text-rose-400' : 'text-gray-200'}`;

    document.getElementById('dashUnrealizedMini').textContent = `Unrealized: ${formatSignedIDR(m.unrealizedPnL)}`;
    document.getElementById('dashRealizedMini').textContent = `Realized: ${formatSignedIDR(m.realizedPnL)}`;

    const retEl = document.getElementById('dashReturnPct');
    retEl.textContent = `${m.returnPct >= 0 ? '+' : ''}${m.returnPct.toFixed(2)}%`;
    retEl.className = `font-mono text-xl sm:text-2xl font-bold ${m.returnPct > 0 ? 'text-emerald-400' : m.returnPct < 0 ? 'text-rose-400' : 'text-gray-200'}`;

    // Calculate player rank among rivals
    const allEquities = [...rivalTraders.map(r => r.equity), m.totalEquity].sort((a, b) => b - a);
    const rank = allEquities.indexOf(m.totalEquity) + 1;
    document.getElementById('dashRankMini').textContent = `Peringkat #${rank} dari ${allEquities.length}`;

    // Watchlist
    const wlContainer = document.getElementById('dashWatchlistContainer');
    if (user.watchlist.length === 0) {
        wlContainer.innerHTML = `<div class="text-xs text-gray-500 py-6 text-center">Belum ada aset di Watchlist. Klik ikon bintang di Market.</div>`;
    } else {
        wlContainer.innerHTML = user.watchlist.map(sym => {
            const a = getAssetBySymbol(sym);
            if (!a) return '';
            const diff = a.price - a.prevClose;
            const pct = ((diff / a.prevClose) * 100).toFixed(2);
            const color = diff >= 0 ? 'text-emerald-400' : 'text-rose-400';
            return `
                <div onclick="selectAssetForTrading('${a.symbol}')" class="cursor-pointer bg-[#0b0f19] hover:bg-gray-800/70 border border-gray-800 rounded-xl p-3 flex items-center justify-between transition">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-bold text-xs text-white">${a.symbol}</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">${a.sector}</span>
                        </div>
                        <span class="text-[11px] text-gray-400 truncate block max-w-[150px]">${a.name}</span>
                    </div>
                    <div class="text-right font-mono">
                        <div class="text-xs font-bold text-white">${formatIDR(a.price)}</div>
                        <div class="text-[11px] ${color}">${diff >= 0 ? '+' : ''}${pct}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Owned Holdings Summary
    const holdContainer = document.getElementById('dashHoldingsContainer');
    const ownedSymbols = Object.keys(user.holdings).filter(s => user.holdings[s].units > 0);
    if (ownedSymbols.length === 0) {
        holdContainer.innerHTML = `
            <div class="bg-[#0b0f19] border border-gray-800/80 rounded-xl p-6 text-center space-y-2">
                <p class="text-xs text-gray-400">Anda belum memiliki saham di portofolio.</p>
                <button onclick="switchView('market')" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition">Beli Saham Pertama &rarr;</button>
            </div>
        `;
    } else {
        holdContainer.innerHTML = ownedSymbols.map(sym => {
            const pos = user.holdings[sym];
            const a = getAssetBySymbol(sym);
            const mktVal = pos.units * a.price;
            const uPnL = mktVal - (pos.units * pos.avgPrice);
            const uPct = ((uPnL / (pos.units * pos.avgPrice)) * 100).toFixed(2);
            const color = uPnL >= 0 ? 'text-emerald-400' : 'text-rose-400';
            return `
                <div onclick="selectAssetForTrading('${sym}')" class="cursor-pointer bg-[#0b0f19] hover:bg-gray-800/60 border border-gray-800 rounded-xl p-3 flex items-center justify-between transition">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-bold text-xs text-white">${sym}</span>
                            <span class="text-xs text-gray-400 font-mono">${pos.units.toLocaleString('id-ID')} unit @ ${formatIDR(pos.avgPrice)}</span>
                        </div>
                        <span class="text-[11px] text-gray-500">Harga Pasar: ${formatIDR(a.price)}</span>
                    </div>
                    <div class="text-right font-mono">
                        <div class="text-xs font-bold text-white">${formatIDR(mktVal)}</div>
                        <div class="text-[11px] ${color}">${formatSignedIDR(uPnL)} (${uPnL >= 0 ? '+' : ''}${uPct}%)</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Recent 5 Transactions
    const recentContainer = document.getElementById('dashRecentTxContainer');
    if (user.transactions.length === 0) {
        recentContainer.innerHTML = `<div class="bg-[#0b0f19] border border-gray-800/80 rounded-xl p-6 text-center text-xs text-gray-400">Belum ada riwayat transaksi.</div>`;
    } else {
        recentContainer.innerHTML = user.transactions.slice(0, 5).map(tx => `
            <div class="bg-[#0b0f19] border border-gray-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                <div class="flex items-center gap-2.5">
                    <span class="px-2 py-0.5 rounded font-bold text-[10px] ${tx.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">${tx.type}</span>
                    <div>
                        <div class="font-bold text-white">${tx.symbol} <span class="text-gray-400 font-normal">x${tx.units.toLocaleString('id-ID')}</span></div>
                        <div class="text-[10px] text-gray-500">${tx.time} • @ ${formatIDR(tx.price)}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold ${tx.type === 'BUY' ? 'text-gray-200' : 'text-cyan-300'}">${formatIDR(tx.total)}</div>
                    <div class="text-[10px] text-gray-500">Fee: ${formatIDR(tx.fee)}</div>
                </div>
            </div>
        `).join('');
    }

    drawPortfolioEquityChart();
}

// VIEW 3: MARKET & ASSET DETAIL RENDERER
function selectAssetForTrading(symbol) {
    selectedAssetSymbol = symbol;
    if (currentView !== 'market') {
        switchView('market');
    } else {
        renderMarketList();
        renderSelectedAssetDetail();
    }
}

function renderMarketList() {
    const search = (document.getElementById('marketSearchInput')?.value || '').toLowerCase();
    const sector = document.getElementById('marketSectorFilter')?.value || 'ALL';
    const user = currentUser();

    const filtered = marketAssets.filter(a => {
        const matchSearch = a.symbol.toLowerCase().includes(search) || a.name.toLowerCase().includes(search);
        const matchSector = sector === 'ALL' || a.sector === sector;
        return matchSearch && matchSector;
    });

    const container = document.getElementById('marketAssetList');
    container.innerHTML = filtered.map(a => {
        const diff = a.price - a.prevClose;
        const pct = ((diff / a.prevClose) * 100).toFixed(2);
        const isSelected = a.symbol === selectedAssetSymbol;
        const isWatched = user.watchlist.includes(a.symbol);
        const owned = user.holdings[a.symbol]?.units || 0;
        const flashClass = a.lastFlash === 'up' ? 'flash-up' : a.lastFlash === 'down' ? 'flash-down' : '';

        return `
            <div onclick="selectAssetForTrading('${a.symbol}')" class="cursor-pointer p-3.5 sm:px-4 flex items-center justify-between transition ${isSelected ? 'bg-indigo-600/15 border-l-4 border-l-indigo-500' : 'hover:bg-gray-800/40'} ${flashClass}">
                <div class="flex items-center gap-3">
                    <button onclick="event.stopPropagation(); toggleWatchlistSymbol('${a.symbol}')" class="text-xs ${isWatched ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}">
                        <i class="fa-solid fa-star"></i>
                    </button>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-mono font-bold text-sm text-white">${a.symbol}</span>
                            <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">${a.sector}</span>
                            ${owned > 0 ? `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">${owned}u</span>` : ''}
                        </div>
                        <p class="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-[220px]">${a.name}</p>
                    </div>
                </div>
                <div class="text-right font-mono">
                    <div class="text-sm font-bold text-white">${formatIDR(a.price)}</div>
                    <div class="text-xs ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                        ${diff >= 0 ? '+' : ''}${formatIDR(diff)} (${diff >= 0 ? '+' : ''}${pct}%)
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setChartMode(mode) {
    currentChartMode = mode;
    document.getElementById('chartModeLine').className = mode === 'line'
        ? 'px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium transition'
        : 'px-2.5 py-1 rounded-md text-gray-400 hover:text-white transition';
    document.getElementById('chartModeCandle').className = mode === 'candle'
        ? 'px-2.5 py-1 rounded-md bg-indigo-600 text-white font-medium transition'
        : 'px-2.5 py-1 rounded-md text-gray-400 hover:text-white transition';
    drawSelectedAssetChart();
}

function renderSelectedAssetDetail() {
    const asset = getAssetBySymbol(selectedAssetSymbol);
    if (!asset) return;
    const user = currentUser();

    const diff = asset.price - asset.prevClose;
    const pct = ((diff / asset.prevClose) * 100).toFixed(2);
    const isWatched = user.watchlist.includes(asset.symbol);

    document.getElementById('detailWatchlistBtn').className = `w-10 h-10 rounded-xl flex items-center justify-center transition ${isWatched ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-gray-800 text-gray-400 hover:text-white'}`;
    document.getElementById('detailAssetSymbol').textContent = asset.symbol;
    document.getElementById('detailAssetSector').textContent = asset.sector;
    document.getElementById('detailAssetName').textContent = asset.name;

    const volLabel = asset.volatility >= 0.03 ? 'Tinggi' : asset.volatility >= 0.02 ? 'Sedang' : 'Rendah';
    document.getElementById('detailAssetVolatility').textContent = `Volatilitas: ${volLabel} (${(asset.volatility * 100).toFixed(1)}%)`;

    document.getElementById('detailAssetPrice').textContent = formatIDR(asset.price);
    const changeEl = document.getElementById('detailAssetChange');
    changeEl.textContent = `${formatSignedIDR(diff)} (${diff >= 0 ? '+' : ''}${pct}%)`;
    changeEl.className = `font-mono text-xs font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;

    document.getElementById('detailHighPrice').textContent = formatIDR(asset.high);
    document.getElementById('detailLowPrice').textContent = formatIDR(asset.low);
    document.getElementById('detailVolume').textContent = asset.volume.toLocaleString('id-ID');

    // Player's current position in this asset
    const pos = user.holdings[asset.symbol];
    if (pos && pos.units > 0) {
        const mktVal = pos.units * asset.price;
        const uPnL = mktVal - (pos.units * pos.avgPrice);
        const uPct = ((uPnL / (pos.units * pos.avgPrice)) * 100).toFixed(2);
        document.getElementById('posOwnedUnits').textContent = `${pos.units.toLocaleString('id-ID')} Unit`;
        document.getElementById('posAvgPrice').textContent = formatIDR(pos.avgPrice);
        document.getElementById('posMarketValue').textContent = formatIDR(mktVal);
        const uEl = document.getElementById('posUnrealizedPnL');
        uEl.textContent = `${formatSignedIDR(uPnL)} (${uPnL >= 0 ? '+' : ''}${uPct}%)`;
        uEl.className = `font-mono font-bold ${uPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    } else {
        document.getElementById('posOwnedUnits').textContent = '0 Unit';
        document.getElementById('posAvgPrice').textContent = 'Rp 0';
        document.getElementById('posMarketValue').textContent = 'Rp 0';
        const uEl = document.getElementById('posUnrealizedPnL');
        uEl.textContent = 'Rp 0 (0.00%)';
        uEl.className = 'font-mono font-bold text-gray-500';
    }

    updateOrderPreview();
    drawSelectedAssetChart();
}

// VIEW 4: PORTFOLIO MANAGEMENT RENDERER
function renderPortfolioView() {
    const user = currentUser();
    const m = getAccountMetrics(user);

    document.getElementById('portTotalCostBasis').textContent = formatIDR(m.totalCostBasis);
    document.getElementById('portTotalMarketValue').textContent = formatIDR(m.totalMarketValue);

    const uPct = m.totalCostBasis > 0 ? ((m.unrealizedPnL / m.totalCostBasis) * 100).toFixed(2) : '0.00';
    const uEl = document.getElementById('portTotalUnrealized');
    uEl.textContent = `${formatSignedIDR(m.unrealizedPnL)} (${m.unrealizedPnL >= 0 ? '+' : ''}${uPct}%)`;
    uEl.className = `font-mono text-lg sm:text-xl font-bold mt-1 ${m.unrealizedPnL > 0 ? 'text-emerald-400' : m.unrealizedPnL < 0 ? 'text-rose-400' : 'text-gray-200'}`;

    const rEl = document.getElementById('portTotalRealized');
    rEl.textContent = formatSignedIDR(m.realizedPnL);
    rEl.className = `font-mono text-lg sm:text-xl font-bold mt-1 ${m.realizedPnL > 0 ? 'text-emerald-400' : m.realizedPnL < 0 ? 'text-rose-400' : 'text-gray-200'}`;

    // Allocation Bar
    const bar = document.getElementById('portAllocationBar');
    const legend = document.getElementById('portAllocationLegend');
    const cashPct = Math.max(0, (m.cash / m.totalEquity) * 100);
    const palette = ['bg-indigo-500', 'bg-cyan-400', 'bg-amber-400', 'bg-rose-400', 'bg-purple-500', 'bg-teal-400'];

    let barHtml = `<div style="width:${cashPct.toFixed(1)}%" class="bg-emerald-500 h-full" title="Kas: ${cashPct.toFixed(1)}%"></div>`;
    let legendHtml = `<div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span>Kas Virtual (${cashPct.toFixed(1)}%)</span></div>`;

    const ownedSymbols = Object.keys(user.holdings).filter(s => user.holdings[s].units > 0);
    ownedSymbols.forEach((sym, idx) => {
        const pos = user.holdings[sym];
        const asset = getAssetBySymbol(sym);
        const val = pos.units * asset.price;
        const pct = (val / m.totalEquity) * 100;
        const colorClass = palette[idx % palette.length];
        barHtml += `<div style="width:${pct.toFixed(1)}%" class="${colorClass} h-full" title="${sym}: ${pct.toFixed(1)}%"></div>`;
        legendHtml += `<div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full ${colorClass}"></span><span>${sym} (${pct.toFixed(1)}%)</span></div>`;
    });

    bar.innerHTML = barHtml;
    legend.innerHTML = legendHtml;
    document.getElementById('portAllocationSummaryText').textContent = `${cashPct.toFixed(1)}% Kas • ${(100 - cashPct).toFixed(1)}% Saham`;

    // Holdings Table
    const tbody = document.getElementById('portfolioHoldingsTableBody');
    if (ownedSymbols.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-10 text-center text-gray-500 font-sans">Portofolio Anda masih kosong. Silakan beli aset di halaman Market & Trading.</td></tr>`;
    } else {
        tbody.innerHTML = ownedSymbols.map(sym => {
            const pos = user.holdings[sym];
            const a = getAssetBySymbol(sym);
            const costBasisTotal = pos.units * pos.avgPrice;
            const marketVal = pos.units * a.price;
            const uPnL = marketVal - costBasisTotal;
            const retPct = ((uPnL / costBasisTotal) * 100).toFixed(2);
            const color = uPnL >= 0 ? 'text-emerald-400' : 'text-rose-400';

            return `
                <tr class="hover:bg-gray-800/40 transition">
                    <td class="py-3.5 px-4 font-sans">
                        <div class="font-bold text-white font-mono">${sym}</div>
                        <div class="text-xs text-gray-400">${a.name}</div>
                    </td>
                    <td class="py-3.5 px-4 text-right font-bold text-white">${pos.units.toLocaleString('id-ID')}</td>
                    <td class="py-3.5 px-4 text-right text-gray-300">${formatIDR(pos.avgPrice)}</td>
                    <td class="py-3.5 px-4 text-right text-white">${formatIDR(a.price)}</td>
                    <td class="py-3.5 px-4 text-right font-bold text-indigo-300">${formatIDR(marketVal)}</td>
                    <td class="py-3.5 px-4 text-right font-bold ${color}">${formatSignedIDR(uPnL)}</td>
                    <td class="py-3.5 px-4 text-right font-bold ${color}">${uPnL >= 0 ? '+' : ''}${retPct}%</td>
                    <td class="py-3.5 px-4 text-center font-sans">
                        <button onclick="selectAssetForTrading('${sym}'); setOrderSide('SELL');" class="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition">
                            Jual / Trade
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

// VIEW 5: TRANSACTION HISTORY RENDERER
function renderTransactionHistory() {
    const user = currentUser();
    const typeFilter = document.getElementById('historyFilterType').value;
    const assetSelect = document.getElementById('historyFilterAsset');
    const currentAssetFilter = assetSelect.value;

    // Populate asset dropdown
    assetSelect.innerHTML = `<option value="ALL">Semua Aset</option>` + marketAssets.map(a =>
        `<option value="${a.symbol}" ${currentAssetFilter === a.symbol ? 'selected' : ''}>${a.symbol} - ${a.name}</option>`
    ).join('');

    const filtered = user.transactions.filter(tx => {
        const matchType = typeFilter === 'ALL' || tx.type === typeFilter;
        const matchAsset = currentAssetFilter === 'ALL' || tx.symbol === currentAssetFilter;
        return matchType && matchAsset;
    });

    const tbody = document.getElementById('transactionHistoryTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-10 text-center text-gray-500 font-sans">Tidak ada catatan transaksi yang sesuai filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(tx => {
        const pnlText = tx.type === 'SELL' ? formatSignedIDR(tx.realizedPnL) : '—';
        const pnlColor = tx.type === 'SELL' ? (tx.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-gray-500';
        return `
            <tr class="hover:bg-gray-800/40">
                <td class="py-3 px-4">
                    <div class="text-white font-bold">${tx.id}</div>
                    <div class="text-[11px] text-gray-500">${tx.time}</div>
                </td>
                <td class="py-3 px-4 font-sans">
                    <div class="font-mono font-bold text-white">${tx.symbol}</div>
                    <div class="text-xs text-gray-400">${tx.name}</div>
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}">${tx.type}</span>
                </td>
                <td class="py-3 px-4 text-right text-white">${tx.units.toLocaleString('id-ID')}</td>
                <td class="py-3 px-4 text-right text-gray-300">${formatIDR(tx.price)}</td>
                <td class="py-3 px-4 text-right text-amber-400">${formatIDR(tx.fee)}</td>
                <td class="py-3 px-4 text-right font-bold ${pnlColor}">${pnlText}</td>
                <td class="py-3 px-4 text-right font-bold text-white">${formatIDR(tx.total)}</td>
            </tr>
        `;
    }).join('');
}

// VIEW 6: MISSIONS & ACHIEVEMENTS RENDERER
function renderMissionsView() {
    const user = currentUser();
    document.getElementById('missionHeaderStats').textContent = `Level ${user.level} — ${user.xp} XP`;

    const grid = document.getElementById('missionsGridContainer');
    grid.innerHTML = missionsCatalog.map(m => {
        const isDone = user.completedMissions.includes(m.id);
        const prog = m.progress(user);
        const pct = Math.min(100, Math.round((prog.current / prog.target) * 100));

        return `
            <div class="bg-[#111827] border ${isDone ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-gray-800'} rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500 text-gray-950' : 'bg-gray-800 text-indigo-400'}">
                            <i class="fa-solid ${isDone ? 'fa-check' : 'fa-bullseye'}"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-sm sm:text-base">${m.title}</h3>
                            <p class="text-xs text-gray-400 mt-0.5">${m.desc}</p>
                        </div>
                    </div>
                    <span class="font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/20 text-indigo-300'} shrink-0">
                        +${m.xp} XP
                    </span>
                </div>

                <div class="space-y-1.5">
                    <div class="flex justify-between text-xs font-mono">
                        <span class="text-gray-400">Reward Gelar: <strong class="text-gray-200">${m.badgeTitle}</strong></span>
                        <span class="${isDone ? 'text-emerald-400 font-bold' : 'text-gray-400'}">${isDone ? 'SELESAI' : `${prog.current} / ${prog.target}`}</span>
                    </div>
                    <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div class="h-full ${isDone ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all duration-300" style="width: ${isDone ? 100 : pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Badges & Titles Showcase
    const allTitles = ['Novice Trader', ...missionsCatalog.map(m => m.badgeTitle)];
    const achGrid = document.getElementById('achievementsGridContainer');
    achGrid.innerHTML = allTitles.map(title => {
        const unlocked = user.unlockedTitles.includes(title);
        const isActive = user.activeTitle === title;
        return `
            <div onclick="${unlocked ? `changeActiveTitle('${title}')` : ''}" class="${unlocked ? 'cursor-pointer hover:border-indigo-500/50' : 'opacity-50'} bg-[#0b0f19] border ${isActive ? 'border-indigo-500' : 'border-gray-800'} rounded-xl p-4 flex items-center justify-between transition">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center ${unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-600'}">
                        <i class="fa-solid ${unlocked ? 'fa-award' : 'fa-lock'}"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-white">${title}</div>
                        <div class="text-[10px] ${unlocked ? 'text-emerald-400' : 'text-gray-500'}">${isActive ? 'Sedang Dipakai' : unlocked ? 'Terbuka (Klik Pakai)' : 'Terkunci'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// VIEW 7: LEADERBOARD RENDERER
function setLeaderboardTab(tab) {
    currentLeaderboardTab = tab;
    ['returnPct', 'totalProfit', 'xp', 'missions'].forEach(t => {
        const btn = document.getElementById(`lbTab-${t}`);
        btn.className = t === tab
            ? 'lb-tab px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white transition'
            : 'lb-tab px-3 py-1.5 rounded-lg font-semibold text-gray-400 hover:text-white transition';
    });
    renderLeaderboardView();
}

function renderLeaderboardView() {
    const user = currentUser();
    const m = getAccountMetrics(user);

    const entries = [
        {
            isPlayer: true,
            username: user.username + ' (Anda)',
            title: user.activeTitle,
            avatar: user.avatarIcon,
            bg: user.avatarBg,
            level: user.level,
            xp: user.xp,
            missions: user.completedMissions.length,
            equity: m.totalEquity,
            profit: m.totalPnL,
            returnPct: m.returnPct
        },
        ...rivalTraders.map(r => ({
            isPlayer: false,
            username: r.username,
            title: r.title,
            avatar: r.avatar,
            bg: r.bg,
            level: calculateLevelFromXp(r.xp),
            xp: r.xp,
            missions: r.missions,
            equity: r.equity,
            profit: r.equity - STARTING_CAPITAL,
            returnPct: ((r.equity - STARTING_CAPITAL) / STARTING_CAPITAL) * 100
        }))
    ];

    entries.sort((a, b) => {
        if (currentLeaderboardTab === 'returnPct') return b.returnPct - a.returnPct;
        if (currentLeaderboardTab === 'totalProfit') return b.profit - a.profit;
        if (currentLeaderboardTab === 'xp') return b.xp - a.xp;
        return b.missions - a.missions;
    });

    const tbody = document.getElementById('leaderboardTableBody');
    tbody.innerHTML = entries.map((e, idx) => {
        const rank = idx + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        const color = e.profit >= 0 ? 'text-emerald-400' : 'text-rose-400';

        return `
            <tr class="${e.isPlayer ? 'bg-indigo-600/15 border-l-4 border-l-indigo-500' : 'hover:bg-gray-800/40'} transition">
                <td class="py-3.5 px-4 font-mono font-bold text-white">${medal}</td>
                <td class="py-3.5 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg ${e.bg} text-white flex items-center justify-center text-xs">
                            <i class="fa-solid ${e.avatar}"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white">${e.username}</div>
                            <div class="text-[11px] text-indigo-300">${e.title}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3.5 px-4 text-center font-mono">
                    <span class="text-white font-bold">Lv.${e.level}</span>
                    <span class="text-xs text-gray-400 block">${e.xp} XP</span>
                </td>
                <td class="py-3.5 px-4 text-center font-mono font-bold text-cyan-400">${e.missions}</td>
                <td class="py-3.5 px-4 text-right font-mono font-bold text-white">${formatIDR(e.equity)}</td>
                <td class="py-3.5 px-4 text-right font-mono font-bold ${color}">${formatSignedIDR(e.profit)}</td>
                <td class="py-3.5 px-4 text-right font-mono font-bold ${color}">${e.returnPct >= 0 ? '+' : ''}${e.returnPct.toFixed(2)}%</td>
            </tr>
        `;
    }).join('');
}

// VIEW 8: USER PROFILE RENDERER
function renderProfileView() {
    const user = currentUser();
    document.getElementById('profileDisplayUsername').textContent = user.username;
    document.getElementById('profileDisplayTitle').textContent = user.activeTitle;
    document.getElementById('profileAccountId').textContent = `ID Akun: ${user.id}`;
    document.getElementById('profileUsernameInput').value = user.username;

    const avatarEl = document.getElementById('profileAvatarPreview');
    avatarEl.className = `w-16 h-16 rounded-2xl ${user.avatarBg} flex items-center justify-center text-white text-2xl font-bold shadow-lg`;
    avatarEl.innerHTML = `<i class="fa-solid ${user.avatarIcon}"></i>`;

    const titleSelect = document.getElementById('profileTitleSelect');
    titleSelect.innerHTML = user.unlockedTitles.map(t =>
        `<option value="${t}" ${t === user.activeTitle ? 'selected' : ''}>${t}</option>`
    ).join('');

    const totalVol = user.transactions.reduce((acc, tx) => acc + tx.total, 0);
    const totalFees = user.transactions.reduce((acc, tx) => acc + tx.fee, 0);

    document.getElementById('profStatLevel').textContent = `Lv. ${user.level} (${user.xp} XP)`;
    document.getElementById('profStatTxCount').textContent = `${user.transactions.length} Transaksi`;
    document.getElementById('profStatVolume').textContent = formatIDR(totalVol);
    document.getElementById('profStatFees').textContent = formatIDR(totalFees);
    document.getElementById('profStatRealized').textContent = formatSignedIDR(user.realizedPnL);
    document.getElementById('profStatMissions').textContent = `${user.completedMissions.length} / ${missionsCatalog.length}`;
}

function selectAvatar(icon, bg) {
    const user = currentUser();
    user.avatarIcon = icon;
    user.avatarBg = bg;
    refreshAllActiveViews();
    showToast('info', 'Avatar Diperbarui', 'Avatar profil Anda telah diubah.');
}

function changeActiveTitle(newTitle) {
    const user = currentUser();
    if (user.unlockedTitles.includes(newTitle)) {
        user.activeTitle = newTitle;
        refreshAllActiveViews();
        showToast('info', 'Gelar Pemain Aktif', `Gelar Anda sekarang: "${newTitle}".`);
    }
}

function saveProfileChanges() {
    const user = currentUser();
    const newName = document.getElementById('profileUsernameInput').value.trim();
    if (!newName) return;

    const duplicate = playerAccounts.some((acc, idx) => idx !== activeAccountIndex && acc.username.toLowerCase() === newName.toLowerCase());
    if (duplicate) {
        showToast('error', 'Username Sudah Digunakan', 'Pilih username unik yang belum dipakai akun lain (PRD 4.1).');
        return;
    }
    user.username = newName;
    refreshAllActiveViews();
    showToast('success', 'Profil Tersimpan', `Username diperbarui menjadi ${newName}.`);
}

function openResetConfirmationModal() {
    const m = document.getElementById('resetConfirmModal');
    m.classList.remove('hidden');
    m.classList.add('flex');
}

function closeResetConfirmationModal() {
    const m = document.getElementById('resetConfirmModal');
    m.classList.add('hidden');
    m.classList.remove('flex');
}

function confirmResetPortfolio() {
    const user = currentUser();
    user.cash = STARTING_CAPITAL;
    user.realizedPnL = 0;
    user.holdings = {};
    user.transactions = [];
    user.equityHistory = [STARTING_CAPITAL, STARTING_CAPITAL];
    closeResetConfirmationModal();
    logAudit(user.username, 'RESET_PORTFOLIO', 'Pemain mereset portofolio kembali ke modal awal Rp100.000.000.');
    refreshAllActiveViews();
    showToast('info', 'Portofolio Direset', 'Saldo kas dikembalikan ke Rp 100.000.000.');
}



/**************************************************************
 * 10. TOAST NOTIFICATIONS & INITIALIZATION
 **************************************************************/
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    const styles = {
        success: 'border-emerald-500/50 bg-[#111827]/95 text-emerald-400 fa-circle-check',
        error: 'border-rose-500/50 bg-[#111827]/95 text-rose-400 fa-circle-exclamation',
        mission: 'border-indigo-500/60 bg-indigo-950/95 text-amber-400 fa-trophy',
        info: 'border-cyan-500/40 bg-[#111827]/95 text-cyan-400 fa-circle-info'
    };
    const st = styles[type] || styles.info;
    const iconClass = st.split(' ').pop();

    toast.className = `pointer-events-auto border ${st} rounded-xl p-3.5 shadow-xl flex items-start gap-3 transition-all duration-300`;
    toast.innerHTML = `
        <i class="fa-solid ${iconClass} text-base mt-0.5"></i>
        <div class="flex-1">
            <div class="text-xs font-bold text-white">${title}</div>
            <div class="text-[11px] text-gray-300 mt-0.5">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
    }, 3600);
}

window.addEventListener('resize', () => {
    drawPortfolioEquityChart();
    drawSelectedAssetChart();
});

window.onload = function () {
    seedInitialMarketHistory();
    switchView('dashboard');
    setSimSpeed(3500);
};
</script>
