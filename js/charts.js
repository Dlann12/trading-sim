/**
 * NusaTrade Sim — Interactive High-DPI Canvas Charts (Line & Candlestick)
 */
/**************************************************************
 * 9. INTERACTIVE HTML5 CANVAS CHARTS (RESIZABLE & HIGH-DPI)
 **************************************************************/
function drawPortfolioEquityChart() {
    const canvas = document.getElementById('portfolioEquityCanvas');
    if (!canvas || currentView !== 'dashboard') return;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const series = currentUser().equityHistory;
    if (!series || series.length < 2) return;

    const minVal = Math.min(...series, STARTING_CAPITAL) * 0.996;
    const maxVal = Math.max(...series, STARTING_CAPITAL) * 1.004;
    const range = Math.max(1, maxVal - minVal);

    const padLeft = 14;
    const padRight = 14;
    const padTop = 18;
    const padBottom = 22;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Subtle Grid Lines
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = padTop + (plotH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - padRight, y);
        ctx.stroke();
    }

    // Baseline Rp 100.000.000 Dashed Line
    const baseY = padTop + plotH - ((STARTING_CAPITAL - minVal) / range) * plotH;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#6b7280';
    ctx.beginPath();
    ctx.moveTo(padLeft, baseY);
    ctx.lineTo(w - padRight, baseY);
    ctx.stroke();
    ctx.restore();

    const latest = series[series.length - 1];
    const isPositive = latest >= STARTING_CAPITAL;
    const strokeColor = isPositive ? '#10b981' : '#f43f5e';

    // Plot Equity Line
    ctx.beginPath();
    series.forEach((val, idx) => {
        const x = padLeft + (idx / (series.length - 1)) * plotW;
        const y = padTop + plotH - ((val - minVal) / range) * plotH;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Gradient Fill
    ctx.lineTo(padLeft + plotW, padTop + plotH);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
    grad.addColorStop(0, isPositive ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)');
    grad.addColorStop(1, 'rgba(11, 15, 25, 0.0)');
    ctx.fillStyle = grad;
    ctx.fill();
}

function drawSelectedAssetChart() {
    const canvas = document.getElementById('assetPriceCanvas');
    if (!canvas || currentView !== 'market') return;
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const asset = getAssetBySymbol(selectedAssetSymbol);
    if (!asset) return;

    const padLeft = 14;
    const padRight = 65;
    const padTop = 16;
    const padBottom = 20;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const prices = asset.history;
    const minVal = Math.min(...prices) * 0.992;
    const maxVal = Math.max(...prices) * 1.008;
    const range = Math.max(1, maxVal - minVal);

    // Grid + Right Axis Labels
    ctx.strokeStyle = '#1f2937';
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px JetBrains Mono';
    for (let i = 0; i <= 4; i++) {
        const y = padTop + (plotH / 4) * i;
        const priceLabel = Math.round(maxVal - (range / 4) * i);
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - padRight, y);
        ctx.stroke();
        ctx.fillText(priceLabel.toLocaleString('id-ID'), w - padRight + 6, y + 3);
    }

    if (currentChartMode === 'line') {
        const isUp = asset.price >= asset.prevClose;
        const color = isUp ? '#10b981' : '#f43f5e';

        ctx.beginPath();
        prices.forEach((p, idx) => {
            const x = padLeft + (idx / (prices.length - 1)) * plotW;
            const y = padTop + plotH - ((p - minVal) / range) * plotH;
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.lineTo(padLeft + plotW, padTop + plotH);
        ctx.lineTo(padLeft, padTop + plotH);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
        grad.addColorStop(0, isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)');
        grad.addColorStop(1, 'rgba(11, 15, 25, 0.0)');
        ctx.fillStyle = grad;
        ctx.fill();
    } else {
        // Candlestick Mode
        const candles = asset.ohlc;
        const step = plotW / candles.length;
        const candleW = Math.max(3, step * 0.6);

        candles.forEach((c, idx) => {
            const cx = padLeft + idx * step + step / 2;
            const highY = padTop + plotH - ((c.high - minVal) / range) * plotH;
            const lowY = padTop + plotH - ((c.low - minVal) / range) * plotH;
            const openY = padTop + plotH - ((c.open - minVal) / range) * plotH;
            const closeY = padTop + plotH - ((c.close - minVal) / range) * plotH;

            const isBull = c.close >= c.open;
            ctx.strokeStyle = isBull ? '#10b981' : '#f43f5e';
            ctx.fillStyle = isBull ? '#10b981' : '#f43f5e';

            // Wick
            ctx.beginPath();
            ctx.moveTo(cx, highY);
            ctx.lineTo(cx, lowY);
            ctx.stroke();

            // Body
            const topY = Math.min(openY, closeY);
            const bodyH = Math.max(2, Math.abs(closeY - openY));
            ctx.fillRect(cx - candleW / 2, topY, candleW, bodyH);
        });
    }

    // Draw Average Buy Price (Cost Basis) Reference Line if Player owns this stock
    const pos = currentUser().holdings[asset.symbol];
    if (pos && pos.units > 0 && pos.avgPrice >= minVal && pos.avgPrice <= maxVal) {
        const avgY = padTop + plotH - ((pos.avgPrice - minVal) / range) * plotH;
        ctx.save();
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(padLeft, avgY);
        ctx.lineTo(w - padRight, avgY);
        ctx.stroke();
        ctx.fillStyle = '#818cf8';
        ctx.fillText('Avg Beli', padLeft + 6, avgY - 5);
        ctx.restore();
    }
}

