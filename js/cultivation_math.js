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

    return Object.freeze({ manaCap, spiritCap, clampResources });
})();
if (typeof window !== 'undefined') window.CultivationMathEngine = CultivationMathEngine;
if (typeof module !== 'undefined') module.exports = CultivationMathEngine;
