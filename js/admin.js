/**
 * NusaTrade Sim — Missions, Authentication & Admin Panel Controllers
 */
/**************************************************************
 * 5. MISSIONS, ACHIEVEMENTS, XP & LEVEL SYSTEM (PRD 4.6 & 4.7)
 **************************************************************/
function evaluateMissionsAndXp() {
    const user = currentUser();
    let newlyCompleted = false;

    missionsCatalog.forEach(mission => {
        if (!user.completedMissions.includes(mission.id)) {
            if (mission.check(user)) {
                user.completedMissions.push(mission.id);
                user.xp += mission.xp;
                if (mission.badgeTitle && !user.unlockedTitles.includes(mission.badgeTitle)) {
                    user.unlockedTitles.push(mission.badgeTitle);
                    user.activeTitle = mission.badgeTitle;
                }
                newlyCompleted = true;
                showToast('mission', `Misi Selesai: ${mission.title}!`, `Anda mendapatkan +${mission.xp} XP & Gelar "${mission.badgeTitle}".`);
            }
        }
    });

    const newLevel = calculateLevelFromXp(user.xp);
    if (newLevel > user.level) {
        user.level = newLevel;
        showToast('mission', `Level Up! Sekarang Level ${user.level}`, 'Terus tingkatkan literasi finansial & manajemen risiko Anda!');
    }

    if (newlyCompleted) {
        updateHeaderAndSidebarStats();
    }
}

function toggleWatchlistSelected() {
    toggleWatchlistSymbol(selectedAssetSymbol);
}

function toggleWatchlistSymbol(symbol) {
    const user = currentUser();
    const idx = user.watchlist.indexOf(symbol);
    if (idx === -1) {
        user.watchlist.push(symbol);
        showToast('info', 'Ditambahkan ke Watchlist', `Saham ${symbol} kini dipantau di Dashboard.`);
    } else {
        user.watchlist.splice(idx, 1);
    }
    evaluateMissionsAndXp();
    refreshAllActiveViews();
}



/**************************************************************
 * 7. AUTHENTICATION & MULTI-ACCOUNT SWITCHER (PRD 4.1)
 **************************************************************/
function openAuthModal() {
    renderAccountsModalList();
    const modal = document.getElementById('authModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function renderAccountsModalList() {
    const container = document.getElementById('accountsListContainer');
    container.innerHTML = playerAccounts.map((acc, idx) => {
        const m = getAccountMetrics(acc);
        const isCurrent = idx === activeAccountIndex;
        return `
            <div onclick="switchUserAccount(${idx})" class="cursor-pointer p-3 rounded-xl border ${isCurrent ? 'border-indigo-500 bg-indigo-600/15' : 'border-gray-800 bg-[#0b0f19] hover:bg-gray-800'} flex items-center justify-between transition">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg ${acc.avatarBg} text-white flex items-center justify-center text-xs">
                        <i class="fa-solid ${acc.avatarIcon}"></i>
                    </div>
                    <div>
                        <div class="text-xs font-bold text-white">${acc.username} ${isCurrent ? '<span class="text-[10px] text-emerald-400">(Aktif)</span>' : ''}</div>
                        <div class="text-[10px] text-gray-400 font-mono">${acc.id} • Lv.${acc.level}</div>
                    </div>
                </div>
                <div class="text-right font-mono">
                    <div class="text-xs font-bold text-emerald-400">${formatIDR(m.totalEquity)}</div>
                    <div class="text-[10px] text-gray-400">${acc.transactions.length} Transaksi</div>
                </div>
            </div>
        `;
    }).join('');
}

function switchUserAccount(index) {
    activeAccountIndex = index;
    closeAuthModal();
    refreshAllActiveViews();
    showToast('success', 'Berhasil Masuk Akun', `Sekarang bermain sebagai ${currentUser().username}.`);
}

function registerNewAccount() {
    const input = document.getElementById('newAccountUsername');
    const errBox = document.getElementById('authErrorMsg');
    const username = input.value.trim();
    errBox.classList.add('hidden');

    if (username.length < 3) {
        errBox.textContent = 'Username minimal 3 karakter.';
        errBox.classList.remove('hidden');
        return;
    }
    const exists = playerAccounts.some(a => a.username.toLowerCase() === username.toLowerCase());
    if (exists) {
        errBox.textContent = 'Username sudah terdaftar. Gunakan username unik lainnya (PRD 4.1).';
        errBox.classList.remove('hidden');
        return;
    }

    const newId = `USR-00${playerAccounts.length + 1}`;
    const newAcc = createNewAccountObject(newId, username, 'fa-dragon', 'bg-emerald-600');
    playerAccounts.push(newAcc);
    activeAccountIndex = playerAccounts.length - 1;
    input.value = '';
    logAudit('AUTH_SYSTEM', 'REGISTER_USER', `Akun baru terdaftar: ${username} (${newId}) dengan modal Rp100.000.000.`);
    closeAuthModal();
    refreshAllActiveViews();
    showToast('success', 'Registrasi Berhasil!', `Selamat datang ${username}! Modal Rp 100.000.000 siap digunakan.`);
}

/**************************************************************
 * 8. ADMIN PANEL CONTROLLERS (PRD 4.10)
 **************************************************************/
function adminTriggerMarketEvent(code, name, driftBias, volMult) {
    marketCondition.code = code;
    marketCondition.name = name;
    marketCondition.driftBias = driftBias;
    marketCondition.volatilityMultiplier = volMult;

    const nameEl = document.getElementById('currentMarketEventName');
    const dotEl = document.getElementById('marketPulseDot');
    nameEl.textContent = name;

    if (code === 'BULL') {
        nameEl.className = 'font-semibold text-emerald-400';
        dotEl.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-ping';
    } else if (code === 'BEAR') {
        nameEl.className = 'font-semibold text-rose-400';
        dotEl.className = 'w-2 h-2 rounded-full bg-rose-400 animate-ping';
    } else if (code === 'VOLATILE') {
        nameEl.className = 'font-semibold text-amber-400';
        dotEl.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
    } else {
        nameEl.className = 'font-semibold text-emerald-400';
        dotEl.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
    }

    logAudit('SYSTEM_ADMIN', 'SET_MARKET_EVENT', `Kondisi pasar diubah ke "${name}" (Drift: ${driftBias}, VolMult: ${volMult}x)`);
    simulateMarketTick();
    showToast('info', 'Event Pasar Diaktifkan', name);
}

function adminUpdateFeeRate() {
    const val = parseFloat(document.getElementById('adminFeeInput').value);
    if (isNaN(val) || val < 0 || val > 5) return;
    brokerFeeRate = val / 100;
    logAudit('SYSTEM_ADMIN', 'UPDATE_FEE', `Biaya transaksi broker diubah menjadi ${val.toFixed(2)}%`);
    showToast('success', 'Parameter Diperbarui', `Biaya transaksi simulasi kini ${val.toFixed(2)}%.`);
}

function adminAddAsset() {
    const sym = document.getElementById('adminNewSymbol').value.trim().toUpperCase();
    const name = document.getElementById('adminNewName').value.trim();
    const sector = document.getElementById('adminNewSector').value;
    const price = parseInt(document.getElementById('adminNewPrice').value, 10) || 1000;
    const vol = parseFloat(document.getElementById('adminNewVolatility').value) || 0.02;

    if (!sym || sym.length < 3 || !name) {
        showToast('error', 'Data Tidak Lengkap', 'Isi kode simbol dan nama perusahaan fiktif.');
        return;
    }
    if (getAssetBySymbol(sym)) {
        showToast('error', 'Simbol Sudah Ada', `Aset dengan simbol ${sym} sudah terdaftar.`);
        return;
    }

    const newAsset = {
        symbol: sym,
        name,
        sector,
        price,
        prevClose: price,
        high: price,
        low: price,
        volatility: vol,
        volume: 50000,
        history: Array(35).fill(price),
        ohlc: Array(35).fill({ open: price, high: price, low: price, close: price }),
        lastFlash: 'up'
    };
    marketAssets.push(newAsset);
    logAudit('SYSTEM_ADMIN', 'CREATE_ASSET_IPO', `Listing aset fiktif baru: ${sym} (${name}) @ ${formatIDR(price)}`);
    document.getElementById('adminNewSymbol').value = '';
    document.getElementById('adminNewName').value = '';
    refreshAllActiveViews();
    showToast('success', `IPO ${sym} Berhasil!`, `${name} kini tersedia untuk diperdagangkan di Market.`);
}

function adminCreateMission() {
    const title = document.getElementById('adminMissionTitle').value.trim();
    const desc = document.getElementById('adminMissionDesc').value.trim();
    const target = parseInt(document.getElementById('adminMissionTarget').value, 10) || 5;
    const xp = parseInt(document.getElementById('adminMissionXp').value, 10) || 100;

    if (!title || !desc) {
        showToast('error', 'Input Misi Kurang', 'Masukkan judul dan deskripsi misi.');
        return;
    }
    const id = 'm_custom_' + Date.now();
    missionsCatalog.push({
        id,
        title,
        desc,
        xp,
        badgeTitle: title,
        check: (u) => u.transactions.length >= target,
        progress: (u) => ({ current: Math.min(target, u.transactions.length), target })
    });
    logAudit('SYSTEM_ADMIN', 'CREATE_MISSION', `Misi baru ditambahkan: "${title}" (+${xp} XP)`);
    document.getElementById('adminMissionTitle').value = '';
    document.getElementById('adminMissionDesc').value = '';
    evaluateMissionsAndXp();
    refreshAllActiveViews();
    showToast('success', 'Misi Baru Ditambahkan', `Misi "${title}" telah aktif untuk seluruh pemain.`);
}

function renderAdminAuditLogs() {
    const container = document.getElementById('adminAuditLogContainer');
    container.innerHTML = adminAuditLogs.map(log => `
        <div class="flex flex-wrap items-center gap-2 py-1 border-b border-gray-800/60">
            <span class="text-gray-500">[${log.time}]</span>
            <span class="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">${log.actor}</span>
            <span class="text-amber-400 font-semibold">${log.action}</span>
            <span class="text-gray-300">${log.detail}</span>
        </div>
    `).join('');
}

