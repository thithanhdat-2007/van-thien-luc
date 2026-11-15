/* Shared numerical boundaries. Realm progression migration is handled separately. */
const CultivationMathEngine = (() => {
    'use strict';

    function nonNegative(value) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, number) : 0;
    }

    function manaCap(raw, realm = {}) {
        const major = nonNegative(realm.majorIndex);
        const minor = nonNegative(realm.minorIndex);
        const linearLimit = 500 * (major + 1) + 25 * minor;
        return Math.min(linearLimit, Math.floor(nonNegative(raw) / CULTIVATION_BALANCE_RULES.manaDivisor));
    }

    function spiritCap(realm = {}, arrayLevel = 1, thuyLevel = 0) {
        const realmIndex = nonNegative(realm.index ?? realm.majorIndex ?? 0);
        const baseCap = (typeof BASE_LINH_KHI_CAPACITY !== 'undefined' ? BASE_LINH_KHI_CAPACITY : 50000);
        return Math.floor(baseCap * Math.pow(1.5, realmIndex) + (nonNegative(thuyLevel) * 1000));
    }

    function clampResources(player, stats, spiritCapacity) {
        player.maxHp = nonNegative(stats.maxHp);
        player.maxMp = nonNegative(stats.maxMp);
        player.hp = Math.min(nonNegative(player.hp), player.maxHp);
        player.mp = Math.min(nonNegative(player.mp), player.maxMp);
        const maxLk = spiritCapacity !== undefined && Number.isFinite(Number(spiritCapacity)) && Number(spiritCapacity) > 0
            ? nonNegative(spiritCapacity)
            : (player.maxLinhKhi || 50000);
        player.maxLinhKhi = maxLk;
        player.linhKhi = Math.min(nonNegative(player.linhKhi), maxLk);
        if (player.spiritPool !== undefined) {
            player.spiritPool = Math.min(nonNegative(player.spiritPool), maxLk);
        }
        if (player.playerLinhCan) {
            player.playerLinhCan.linhKhi = player.linhKhi;
        }
    }

    function sanitizeResource(val, min = 0, max = Infinity, fallback = 0) {
        const num = Number(val);
        if (!Number.isFinite(num) || Number.isNaN(num)) return fallback;
        return Math.max(min, Math.min(max, num));
    }

    function clampPercent(val) {
        return sanitizeResource(val, 0, 100, 0);
    }

    function safeAdd(current, delta, min = 0, max = Infinity) {
        const safeCur = Number.isFinite(Number(current)) ? Number(current) : 0;
        const safeDelta = Number.isFinite(Number(delta)) ? Number(delta) : 0;
        return Math.max(min, Math.min(max, safeCur + safeDelta));
    }

    function sanitizeGameState(s) {
        if (!s || typeof s !== 'object') return s;
        s.stones = sanitizeResource(s.stones, 0, Infinity, 0);
        s.immortalJade = sanitizeResource(s.immortalJade ?? s.jade, 0, Infinity, 0);
        s.exp = sanitizeResource(s.exp, 0, Infinity, 0);
        s.maxExp = sanitizeResource(s.maxExp, 1, Infinity, 100);
        s.maxHp = sanitizeResource(s.maxHp, 1, Infinity, 1000);
        s.hp = sanitizeResource(s.hp, 0, s.maxHp, s.maxHp);
        s.maxMp = sanitizeResource(s.maxMp, 1, Infinity, 200);
        s.mp = sanitizeResource(s.mp, 0, s.maxMp, s.maxMp);
        s.atk = sanitizeResource(s.atk, 1, Infinity, 50);
        s.def = sanitizeResource(s.def, 0, Infinity, 20);
        s.speed = sanitizeResource(s.speed, 1, Infinity, 10);
        s.critRate = sanitizeResource(s.critRate, 0, 100, 5);
        s.realmIndex = sanitizeResource(s.realmIndex, 0, 100, 0);
        s.realmStage = sanitizeResource(s.realmStage, 0, 20, 0);
        return s;
    }

    function formatNumber(value, options = {}) {
        if (value === null || value === undefined || Number.isNaN(Number(value))) {
            return '0';
        }
        const val = Number(value);
        if (!Number.isFinite(val)) {
            return val > 0 ? '∞' : '-∞';
        }
        const isNegative = val < 0;
        const abs = Math.abs(val);

        if (abs < 10000) {
            const formatted = (options.decimals !== undefined)
                ? abs.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: options.decimals })
                : Math.round(abs).toLocaleString('vi-VN');
            return isNegative ? `-${formatted}` : formatted;
        }

        const tiers = [
            { unit: 1e24, symbol: 'Sp' },
            { unit: 1e21, symbol: 'Sx' },
            { unit: 1e18, symbol: 'Qi' },
            { unit: 1e15, symbol: 'Qa' },
            { unit: 1e12, symbol: 'T' },
            { unit: 1e9,  symbol: 'B' },
            { unit: 1e6,  symbol: 'M' },
            { unit: 1e3,  symbol: 'K' }
        ];

        const match = tiers.find(t => abs >= t.unit);
        if (!match) {
            return (isNegative ? '-' : '') + Math.round(abs).toLocaleString('vi-VN');
        }

        const scaled = abs / match.unit;
        const maxDecimals = options.decimals ?? (scaled >= 100 ? 1 : 2);
        let str = scaled.toFixed(maxDecimals);
        if (str.includes('.')) {
            str = str.replace(/\.?0+$/, '');
        }
        return (isNegative ? '-' : '') + str + match.symbol;
    }

    return Object.freeze({
        manaCap,
        spiritCap,
        clampResources,
        sanitizeResource,
        clampPercent,
        safeAdd,
        sanitizeGameState,
        formatNumber
    });
})();

if (typeof window !== 'undefined') {
    window.CultivationMathEngine = CultivationMathEngine;
    window.formatNumber = CultivationMathEngine.formatNumber;
    window.formatCultivationNumber = CultivationMathEngine.formatNumber;
    window.sanitizeResource = CultivationMathEngine.sanitizeResource;
    window.clampPercent = CultivationMathEngine.clampPercent;
    window.safeAdd = CultivationMathEngine.safeAdd;
    window.sanitizeGameState = CultivationMathEngine.sanitizeGameState;
}
if (typeof globalThis !== 'undefined') {
    globalThis.CultivationMathEngine = CultivationMathEngine;
    globalThis.formatNumber = CultivationMathEngine.formatNumber;
    globalThis.formatCultivationNumber = CultivationMathEngine.formatNumber;
    globalThis.sanitizeResource = CultivationMathEngine.sanitizeResource;
    globalThis.clampPercent = CultivationMathEngine.clampPercent;
    globalThis.safeAdd = CultivationMathEngine.safeAdd;
    globalThis.sanitizeGameState = CultivationMathEngine.sanitizeGameState;
}
if (typeof module !== 'undefined') module.exports = CultivationMathEngine;
