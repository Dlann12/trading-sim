/**
 * NusaTrade Sim — Constants, Initial State & Market Assets
 */
/**************************************************************
 * 1. CONSTANTS, MARKET ASSETS & INITIAL STATE (PRD SECTIONS 3-8)
 **************************************************************/
const STARTING_CAPITAL = 100000000; // Rp 100.000.000 virtual
let brokerFeeRate = 0.0015; // 0.15% default transaction fee
let simIntervalId = null;
let currentSimSpeed = 3500;
let currentView = 'dashboard';
let selectedAssetSymbol = 'BNUS';
let currentOrderSide = 'BUY';
let currentChartMode = 'line';
let currentLeaderboardTab = 'returnPct';
let isProcessingTrade = false; // Idempotency lock (PRD 4.4)
let pendingTradeOrder = null;

// Global Market Condition State
const marketCondition = {
    code: 'NORMAL',
    name: 'Pasar Normal (Stabil)',
    driftBias: 0.0005,
    volatilityMultiplier: 1.0
};

// 8 Fictional Indonesian Stocks for MVP (PRD 4.3)
const marketAssets = [
    {
        symbol: 'BNUS',
        name: 'PT Bank Nusantara Terbuka',
        sector: 'Perbankan',
        price: 9450,
        prevClose: 9325,
        high: 9550,
        low: 9275,
        volatility: 0.016,
        volume: 145200,
        history: [],
        ohlc: [],
        lastFlash: ''
    },
    {
        symbol: 'TLKD',
        name: 'PT Telkom Digital Indonesia',
        sector: 'Teknologi',
        price: 3820,
        prevClose: 3800,
        high: 3890,
        low: 3760,
        volatility: 0.020,
        volume: 289400,
        history: [],
        ohlc: [],
        lastFlash: ''
    },
    {
        symbol: 'GOTOX',
        name: 'PT GoTekno Ekosistem Nusantara',
        sector: 'Teknologi',
        price: 86,
        prevClose: 84,
        high: 91,
        low: 82,
        volatility: 0.045,
        volume: 1920500,
        history: [],
        ohlc: [],
        lastFlash: ''
    },
    {
        symbol: 'BRENX',
        name: 'PT Barito Energi Lestari Tbk',
        sector: 'Energi',
        price: 7650,
        prevClose: 7400,
        high: 7750,
        low: 7350,
        volatility: 0.036,
        volume: 410800,
        history: [],
        ohlc: [],
        lastFlash: ''
    },
    {
        symbol: 'ANTMX',
        name: 'PT Aneka Tambang Mulia Tbk',
        sector: 'Pertambangan',
        price: 1640,
        prevClose: 1665,
        high: 1690,
        low: 1620,
        volatility: 0.028,
        volume: 530100,
        history: [],
        ohlc: [],
        lastFlash: ''
    },
    {
        symbol: 'ASIIX',
        name: 'PT Astra Industri Nasional',
        sector: 'Otomotif',
        price: 5125,
        prevClose: 5100,
        high: 5175,
        low: 5050,
        volatility: 0.018,
        volume: 198300,
        history: [],
        ohlc: [],
        lastFlash: ''
    },
    {
        symbol: 'ICBPX',
        name: 'PT Indofood Makmur Sejahtera',
        sector: 'Konsumer',
        price: 10850,
        prevClose: 10800,
        high: 10950,
        low: 10750,
        volatility: 0.014,
        volume: 87400,
        history: [],
        ohlc: [],
        lastFlash: ''
    },
    {
        symbol: 'MEDCX',
        name: 'PT Medco Energi Global Tbk',
        sector: 'Energi',
        price: 1385,
        prevClose: 1350,
        high: 1410,
        low: 1340,
        volatility: 0.032,
        volume: 376900,
        history: [],
        ohlc: [],
        lastFlash: ''
    }
];

// Seed 35 historical price points & OHLC candles for each stock
function seedInitialMarketHistory() {
    marketAssets.forEach(asset => {
        let p = asset.prevClose * 0.97;
        asset.history = [];
        asset.ohlc = [];
        for (let i = 0; i < 34; i++) {
            const open = p;
            const delta = (Math.random() - 0.48) * asset.volatility * p;
            const close = Math.max(50, Math.round(open + delta));
            const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.008));
            const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.008));
            p = close;
            asset.history.push(close);
            asset.ohlc.push({ open, high, low, close });
        }
        asset.history.push(asset.price);
        asset.ohlc.push({
            open: p,
            high: Math.max(p, asset.price),
            low: Math.min(p, asset.price),
            close: asset.price
        });
    });
}

// Missions Definition (PRD 4.6)
const missionsCatalog = [
    {
        id: 'm_first_tx',
        title: 'Langkah Pertama',
        desc: 'Lakukan transaksi beli atau jual pertama Anda di pasar simulasi.',
        xp: 100,
        badgeTitle: 'Market Explorer',
        check: (u) => u.transactions.length >= 1,
        progress: (u) => ({ current: Math.min(1, u.transactions.length), target: 1 })
    },
    {
        id: 'm_watchlist_3',
        title: 'Riset Pasar Aktif',
        desc: 'Tambahkan minimal 3 aset saham ke dalam daftar Watchlist Anda.',
        xp: 75,
        badgeTitle: 'Chart Watcher',
        check: (u) => u.watchlist.length >= 3,
        progress: (u) => ({ current: Math.min(3, u.watchlist.length), target: 3 })
    },
    {
        id: 'm_five_tx',
        title: 'Trader Aktif',
        desc: 'Selesaikan minimal 5 transaksi valid tanpa kegagalan.',
        xp: 150,
        badgeTitle: 'Active Executor',
        check: (u) => u.transactions.length >= 5,
        progress: (u) => ({ current: Math.min(5, u.transactions.length), target: 5 })
    },
    {
        id: 'm_diversify_3',
        title: 'Manajer Risiko (Diversifikasi)',
        desc: 'Miliki minimal 3 saham berbeda secara bersamaan di dalam portofolio.',
        xp: 150,
        badgeTitle: 'Risk Diversifier',
        check: (u) => Object.keys(u.holdings).filter(k => u.holdings[k].units > 0).length >= 3,
        progress: (u) => ({
            current: Math.min(3, Object.keys(u.holdings).filter(k => u.holdings[k].units > 0).length),
            target: 3
        })
    },
    {
        id: 'm_cash_discipline',
        title: 'Disiplin Manajemen Kas',
        desc: 'Pertahankan saldo kas positif minimal Rp 20.000.000 setelah melakukan 3 transaksi.',
        xp: 125,
        badgeTitle: 'Capital Guardian',
        check: (u) => u.transactions.length >= 3 && u.cash >= 20000000,
        progress: (u) => ({ current: u.cash >= 20000000 ? Math.min(3, u.transactions.length) : 0, target: 3 })
    },
    {
        id: 'm_first_realized_profit',
        title: 'Cuan Terealisasi Pertama',
        desc: 'Bukukan Realized Profit positif dari transaksi penjualan saham (SELL).',
        xp: 175,
        badgeTitle: 'Profit Maker',
        check: (u) => u.realizedPnL > 0,
        progress: (u) => ({ current: u.realizedPnL > 0 ? 1 : 0, target: 1 })
    },
    {
        id: 'm_positive_return',
        title: 'Strategi Portofolio Unggul',
        desc: 'Capai persentase Return Portofolio total minimal +1.00% di atas modal awal.',
        xp: 250,
        badgeTitle: 'Tycoon Nusantara',
        check: (u) => getAccountMetrics(u).returnPct >= 1.0,
        progress: (u) => ({
            current: Math.max(0, Math.min(1, Number(getAccountMetrics(u).returnPct.toFixed(2)))),
            target: 1
        })
    }
];

// Player Accounts Store (Supports Multi-Account Switching per PRD 4.1)
const playerAccounts = [
    createNewAccountObject('USR-001', 'Trader_Nusa', 'fa-user-astronaut', 'bg-indigo-600')
];
let activeAccountIndex = 0;

function createNewAccountObject(id, username, avatarIcon, avatarBg) {
    return {
        id,
        username,
        avatarIcon,
        avatarBg,
        xp: 0,
        level: 1,
        activeTitle: 'Novice Trader',
        unlockedTitles: ['Novice Trader'],
        cash: STARTING_CAPITAL,
        realizedPnL: 0,
        watchlist: ['BNUS', 'TLKD'],
        holdings: {}, // symbol -> { units, avgPrice }
        transactions: [],
        completedMissions: [],
        equityHistory: [STARTING_CAPITAL, STARTING_CAPITAL]
    };
}

function currentUser() {
    return playerAccounts[activeAccountIndex];
}

// Simulated Rival Traders for Leaderboard (PRD 4.8 - Same Rp 100.000.000 Starting Capital)
const rivalTraders = [
    { username: 'Alya_QuantID', title: 'Tycoon Nusantara', avatar: 'fa-crown', bg: 'bg-amber-600', equity: 104850000, xp: 680, missions: 6 },
    { username: 'Budi_ValueInvest', title: 'Risk Diversifier', avatar: 'fa-dragon', bg: 'bg-emerald-600', equity: 102340000, xp: 450, missions: 5 },
    { username: 'Citra_Momentum', title: 'Profit Maker', avatar: 'fa-bolt', bg: 'bg-cyan-600', equity: 101120000, xp: 350, missions: 4 },
    { username: 'Dimas_Swing', title: 'Market Explorer', avatar: 'fa-robot', bg: 'bg-indigo-600', equity: 99450000, xp: 200, missions: 2 },
    { username: 'Eka_Scalper', title: 'Novice Trader', avatar: 'fa-user-astronaut', bg: 'bg-rose-600', equity: 97890000, xp: 100, missions: 1 }
];

// Admin Audit Logs (PRD 4.10 & Section 7 `audit_logs`)
const adminAuditLogs = [
    { time: getFormattedTime(), actor: 'SYSTEM', action: 'INIT_ENGINE', detail: 'Mesin simulasi harga diinisialisasi dengan 8 aset saham fiktif & modal awal Rp100.000.000.' }
];

function logAudit(actor, action, detail) {
    adminAuditLogs.unshift({
        time: getFormattedTime(),
        actor,
        action,
        detail
    });
    if (currentView === 'admin') renderAdminAuditLogs();
}

