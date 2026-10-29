/**
 * NusaTrade Sim — Formatting, Price Engine & Atomic Trading System
 */
/**************************************************************
 * 2. FORMATTING & BUSINESS RULE CALCULATIONS (PRD SECTION 8)
 **************************************************************/
function formatIDR(amount) {
    const rounded = Math.round(amount);
    const sign = rounded < 0 ? '-' : '';
    return sign + 'Rp ' + Math.abs(rounded).toLocaleString('id-ID');
}

function formatSignedIDR(amount) {
    const rounded = Math.round(amount);
    if (rounded > 0) return '+Rp ' + rounded.toLocaleString('id-ID');
    if (rounded < 0) return '-Rp ' + Math.abs(rounded).toLocaleString('id-ID');
    return 'Rp 0';
}

function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getAssetBySymbol(symbol) {
    return marketAssets.find(a => a.symbol === symbol);
}

// PRD Section 8 Business Rules: Portfolio Value, Cost Basis, Unrealized P/L, Return %
function getAccountMetrics(user) {
    let totalMarketValue = 0;
    let totalCostBasis = 0;

    Object.keys(user.holdings).forEach(symbol => {
        const pos = user.holdings[symbol];
        if (pos && pos.units > 0) {
            const asset = getAssetBySymbol(symbol);
            const currentPrice = asset ? asset.price : pos.avgPrice;
            totalMarketValue += pos.units * currentPrice;
            totalCostBasis += pos.units * pos.avgPrice;
        }
    });

    const unrealizedPnL = totalMarketValue - totalCostBasis;
    const totalEquity = user.cash + totalMarketValue;
    const totalPnL = totalEquity - STARTING_CAPITAL;
    const returnPct = ((totalEquity - STARTING_CAPITAL) / STARTING_CAPITAL) * 100;

    return {
        cash: user.cash,
        totalMarketValue,
        totalCostBasis,
        unrealizedPnL,
        realizedPnL: user.realizedPnL,
        totalEquity,
        totalPnL,
        returnPct
    };
}

function calculateLevelFromXp(xp) {
    // Every 250 XP increases 1 level
    return Math.floor(xp / 250) + 1;
}

/**************************************************************
 * 3. REAL-TIME PRICE SIMULATION ENGINE (PRD 4.3)
 **************************************************************/
function simulateMarketTick() {
    marketAssets.forEach(asset => {
        const openPrice = asset.price;
        const effectiveVol = asset.volatility * marketCondition.volatilityMultiplier;
        const randomShock = (Math.random() - 0.495) * 2 * effectiveVol;
        const percentMove = marketCondition.driftBias + randomShock;

        let newPrice = Math.round(openPrice * (1 + percentMove));
        if (newPrice < 50) newPrice = 50; // Floor price

        // Ensure occasional movement so ticks feel responsive
        if (newPrice === openPrice) {
            newPrice += (Math.random() > 0.48 ? 1 : -1) * Math.max(1, Math.round(openPrice * 0.002));
        }

        asset.lastFlash = newPrice >= openPrice ? 'up' : 'down';
        asset.price = newPrice;
        if (newPrice > asset.high) asset.high = newPrice;
        if (newPrice < asset.low) asset.low = newPrice;
        asset.volume += Math.floor(Math.random() * 4500) + 200;

        asset.history.push(newPrice);
        if (asset.history.length > 45) asset.history.shift();

        const high = Math.max(openPrice, newPrice) + Math.round(openPrice * 0.003 * Math.random());
        const low = Math.max(50, Math.min(openPrice, newPrice) - Math.round(openPrice * 0.003 * Math.random()));
        asset.ohlc.push({ open: openPrice, high, low, close: newPrice });
        if (asset.ohlc.length > 45) asset.ohlc.shift();
    });

    // Update Rivals slightly for lively Leaderboard
    rivalTraders.forEach(rival => {
        const move = (Math.random() - 0.485) * 0.004;
        rival.equity = Math.round(rival.equity * (1 + move));
    });

    // Record active player's equity snapshot
    const user = currentUser();
    const metrics = getAccountMetrics(user);
    user.equityHistory.push(metrics.totalEquity);
    if (user.equityHistory.length > 45) user.equityHistory.shift();

    // Check if price movements unlocked return-based missions
    evaluateMissionsAndXp();

    // Refresh UI without reloading page (PRD 5 Performance)
    refreshAllActiveViews();
}

function setSimSpeed(ms) {
    currentSimSpeed = ms;
    if (simIntervalId) {
        clearInterval(simIntervalId);
        simIntervalId = null;
    }
    // Update button active styles
    const map = { 0: 'speedBtn0', 3500: 'speedBtn1', 1800: 'speedBtn2', 800: 'speedBtn5' };
    ['speedBtn0', 'speedBtn1', 'speedBtn2', 'speedBtn5'].forEach(id => {
        const el = document.getElementById(id);
        el.className = 'px-2 py-1 rounded-md text-gray-400 hover:text-white transition';
    });
    if (map[ms]) {
        document.getElementById(map[ms]).className = 'px-2 py-1 rounded-md bg-indigo-600 text-white font-semibold transition';
    }

    if (ms > 0) {
        simIntervalId = setInterval(simulateMarketTick, ms);
    }
}

function manualTick() {
    simulateMarketTick();
    showToast('info', 'Tick Pasar Dieksekusi', 'Harga seluruh aset telah diperbarui +1 siklus.');
}

/**************************************************************
 * 4. ATOMIC BUY & SELL TRADING SYSTEM (PRD 4.4 & SECTION 8)
 **************************************************************/
function setOrderSide(side) {
    currentOrderSide = side;
    const buyTab = document.getElementById('tabOrderBuy');
    const sellTab = document.getElementById('tabOrderSell');
    const submitBtn = document.getElementById('submitOrderBtn');

    if (side === 'BUY') {
        buyTab.className = 'flex-1 sm:w-36 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 text-gray-950 shadow-lg shadow-emerald-500/20 transition';
        sellTab.className = 'flex-1 sm:w-36 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gray-800 text-gray-300 hover:text-white transition';
        submitBtn.className = 'w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-extrabold text-sm tracking-wide transition shadow-lg shadow-emerald-500/20';
        submitBtn.textContent = `KONFIRMASI BELI (${selectedAssetSymbol})`;
    } else {
        sellTab.className = 'flex-1 sm:w-36 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition';
        buyTab.className = 'flex-1 sm:w-36 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gray-800 text-gray-300 hover:text-white transition';
        submitBtn.className = 'w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-sm tracking-wide transition shadow-lg shadow-rose-500/20';
        submitBtn.textContent = `KONFIRMASI JUAL (${selectedAssetSymbol})`;
    }
    updateOrderPreview();
}

function adjustOrderUnits(delta) {
    const input = document.getElementById('orderUnitsInput');
    const current = parseInt(input.value, 10) || 0;
    input.value = Math.max(1, current + delta);
    updateOrderPreview();
}

function setOrderPercentage(pct) {
    const user = currentUser();
    const asset = getAssetBySymbol(selectedAssetSymbol);
    if (!asset) return;

    const input = document.getElementById('orderUnitsInput');
    if (currentOrderSide === 'BUY') {
        const maxAffordableUnits = Math.floor((user.cash * pct) / (asset.price * (1 + brokerFeeRate)));
        input.value = Math.max(1, maxAffordableUnits);
    } else {
        const owned = user.holdings[selectedAssetSymbol]?.units || 0;
        input.value = Math.max(1, Math.floor(owned * pct));
    }
    updateOrderPreview();
}

function updateOrderPreview() {
    const user = currentUser();
    const asset = getAssetBySymbol(selectedAssetSymbol);
    if (!asset) return;

    const unitsInput = document.getElementById('orderUnitsInput');
    const units = Math.max(0, parseInt(unitsInput.value, 10) || 0);
    const subtotal = units * asset.price;
    const fee = Math.round(subtotal * brokerFeeRate);
    const total = currentOrderSide === 'BUY' ? (subtotal + fee) : Math.max(0, subtotal - fee);

    const availLabel = document.getElementById('orderAvailableLabel');
    const availVal = document.getElementById('orderAvailableValue');
    const ownedUnits = user.holdings[selectedAssetSymbol]?.units || 0;

    if (currentOrderSide === 'BUY') {
        availLabel.textContent = 'Saldo Kas Tersedia:';
        availVal.textContent = formatIDR(user.cash);
        document.getElementById('previewTotalLabel').textContent = 'Estimasi Total Biaya:';
    } else {
        availLabel.textContent = 'Unit Saham Dimiliki:';
        availVal.textContent = `${ownedUnits.toLocaleString('id-ID')} Unit`;
        document.getElementById('previewTotalLabel').textContent = 'Estimasi Hasil Bersih:';
    }

    document.getElementById('previewExecPrice').textContent = formatIDR(asset.price);
    document.getElementById('previewUnitsCount').textContent = units.toLocaleString('id-ID');
    document.getElementById('previewSubtotal').textContent = formatIDR(subtotal);
    document.getElementById('previewFeeRate').textContent = (brokerFeeRate * 100).toFixed(2);
    document.getElementById('previewFeeAmount').textContent = formatIDR(fee);
    document.getElementById('previewTotalValue').textContent = formatIDR(total);

    // Real-time Validation Preview
    const msgBox = document.getElementById('orderValidationMessage');
    const submitBtn = document.getElementById('submitOrderBtn');
    msgBox.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    if (units <= 0) {
        msgBox.textContent = 'Jumlah unit harus minimal 1 unit.';
        msgBox.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else if (currentOrderSide === 'BUY' && total > user.cash) {
        msgBox.textContent = `Saldo kas virtual tidak mencukupi. Kurang ${formatIDR(total - user.cash)}.`;
        msgBox.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else if (currentOrderSide === 'SELL' && units > ownedUnits) {
        msgBox.textContent = `Anda hanya memiliki ${ownedUnits} unit ${selectedAssetSymbol}. Tidak dapat menjual melebihi kepemilikan.`;
        msgBox.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function initiateTradeExecution() {
    if (isProcessingTrade) return; // Idempotency guard (PRD 4.4)
    const asset = getAssetBySymbol(selectedAssetSymbol);
    const units = parseInt(document.getElementById('orderUnitsInput').value, 10) || 0;
    if (!asset || units <= 0) return;

    const subtotal = units * asset.price;
    const fee = Math.round(subtotal * brokerFeeRate);
    const total = currentOrderSide === 'BUY' ? (subtotal + fee) : (subtotal - fee);

    pendingTradeOrder = {
        symbol: asset.symbol,
        name: asset.name,
        side: currentOrderSide,
        units,
        price: asset.price,
        subtotal,
        fee,
        total
    };

    const requireConfirm = document.getElementById('confirmBeforeTradeToggle').checked;
    if (requireConfirm) {
        openTradeConfirmModal(pendingTradeOrder);
    } else {
        executeConfirmedTrade();
    }
}

function openTradeConfirmModal(order) {
    const modal = document.getElementById('tradeConfirmModal');
    const title = document.getElementById('modalOrderTitle');
    const summary = document.getElementById('modalOrderSummary');
    const confirmBtn = document.getElementById('modalConfirmExecBtn');

    title.textContent = order.side === 'BUY'
        ? `Konfirmasi Pembelian ${order.symbol}`
        : `Konfirmasi Penjualan ${order.symbol}`;

    summary.innerHTML = `
        <div class="flex justify-between"><span>Aset:</span><strong class="text-white">${order.symbol} — ${order.name}</strong></div>
        <div class="flex justify-between"><span>Jenis Transaksi:</span><strong class="${order.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}">${order.side}</strong></div>
        <div class="flex justify-between"><span>Jumlah Unit:</span><strong class="text-white">${order.units.toLocaleString('id-ID')} Unit</strong></div>
        <div class="flex justify-between"><span>Harga Eksekusi:</span><strong class="text-white">${formatIDR(order.price)}</strong></div>
        <div class="flex justify-between"><span>Biaya Broker (${(brokerFeeRate * 100).toFixed(2)}%):</span><strong class="text-amber-400">${formatIDR(order.fee)}</strong></div>
        <div class="border-t border-gray-800 pt-2 flex justify-between text-sm">
            <span>${order.side === 'BUY' ? 'Total Biaya Dipotong:' : 'Hasil Bersih Diterima:'}</span>
            <strong class="${order.side === 'BUY' ? 'text-emerald-400' : 'text-cyan-400'}">${formatIDR(order.total)}</strong>
        </div>
    `;

    confirmBtn.className = order.side === 'BUY'
        ? 'flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-xs'
        : 'flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeTradeConfirmModal() {
    const modal = document.getElementById('tradeConfirmModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Atomic Execution Function (PRD 4.4 & Section 8)
function executeConfirmedTrade() {
    if (isProcessingTrade || !pendingTradeOrder) return;
    isProcessingTrade = true;
    closeTradeConfirmModal();

    try {
        const user = currentUser();
        const asset = getAssetBySymbol(pendingTradeOrder.symbol);
        // Always use authoritative current market price at execution moment
        const execPrice = asset.price;
        const units = pendingTradeOrder.units;
        const side = pendingTradeOrder.side;
        const subtotal = units * execPrice;
        const fee = Math.round(subtotal * brokerFeeRate);

        if (side === 'BUY') {
            const totalCost = subtotal + fee;
            if (totalCost > user.cash) {
                logAudit(user.username, 'REJECTED_BUY', `Gagal beli ${units} ${asset.symbol}: Saldo tidak cukup.`);
                showToast('error', 'Transaksi Gagal', 'Saldo kas virtual tidak mencukupi untuk transaksi ini.');
                isProcessingTrade = false;
                return;
            }

            // Atomic Balance & Holding Cost Basis Update
            const prevHolding = user.holdings[asset.symbol] || { units: 0, avgPrice: 0 };
            const prevTotalCost = prevHolding.units * prevHolding.avgPrice;
            const newUnits = prevHolding.units + units;
            // Cost basis includes purchase price + fee
            const newAvgPrice = (prevTotalCost + totalCost) / newUnits;

            user.cash -= totalCost;
            user.holdings[asset.symbol] = {
                units: newUnits,
                avgPrice: newAvgPrice
            };

            const txRecord = {
                id: 'TX-' + (1000 + user.transactions.length + 1),
                time: getFormattedTime(),
                symbol: asset.symbol,
                name: asset.name,
                type: 'BUY',
                units,
                price: execPrice,
                fee,
                realizedPnL: 0,
                total: totalCost
            };
            user.transactions.unshift(txRecord);
            showToast('success', `Beli ${asset.symbol} Berhasil`, `${units.toLocaleString('id-ID')} unit dibeli pada ${formatIDR(execPrice)}.`);

        } else {
            // SELL Validation
            const prevHolding = user.holdings[asset.symbol];
            if (!prevHolding || prevHolding.units < units) {
                logAudit(user.username, 'REJECTED_SELL', `Gagal jual ${units} ${asset.symbol}: Unit melebihi kepemilikan.`);
                showToast('error', 'Transaksi Ditolak', 'Jumlah unit yang dijual melebihi kepemilikan Anda.');
                isProcessingTrade = false;
                return;
            }

            const netProceeds = subtotal - fee;
            const costBasisSold = units * prevHolding.avgPrice;
            const tradeRealizedPnL = netProceeds - costBasisSold;

            // Atomic Update
            user.cash += netProceeds;
            user.realizedPnL += tradeRealizedPnL;
            prevHolding.units -= units;
            if (prevHolding.units === 0) {
                delete user.holdings[asset.symbol];
            }

            const txRecord = {
                id: 'TX-' + (1000 + user.transactions.length + 1),
                time: getFormattedTime(),
                symbol: asset.symbol,
                name: asset.name,
                type: 'SELL',
                units,
                price: execPrice,
                fee,
                realizedPnL: tradeRealizedPnL,
                total: netProceeds
            };
            user.transactions.unshift(txRecord);

            const pnlSign = tradeRealizedPnL >= 0 ? `+${formatIDR(tradeRealizedPnL)}` : formatIDR(tradeRealizedPnL);
            showToast('success', `Jual ${asset.symbol} Berhasil`, `${units.toLocaleString('id-ID')} unit terjual. Realized P/L: ${pnlSign}`);
        }

        // Record updated equity snapshot immediately
        const metrics = getAccountMetrics(user);
        user.equityHistory.push(metrics.totalEquity);

        // Check missions & XP rewards
        evaluateMissionsAndXp();
        refreshAllActiveViews();
    } finally {
        pendingTradeOrder = null;
        isProcessingTrade = false;
    }
}

