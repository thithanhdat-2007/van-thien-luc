/**
 * ============================================================================
 * VẤN THIÊN LỤC — HỆ THỐNG "Ổ CẮM" TÀI NGUYÊN ẢNH ĐỒNG BỘ (ASSET REGISTRY)
 * File: js/assets_manifest.js
 * 
 * 1. Định nghĩa danh mục đường dẫn chuẩn cho toàn bộ hình ảnh 2D trong game.
 * 2. Hàm tự động gắn ảnh kèm cơ chế fallback thông minh (không bao giờ vỡ ảnh).
 * 3. Tự động áp dụng object-fit: contain và filter: drop-shadow chuẩn tiên hiệp.
 * ============================================================================
 */

(() => {
    'use strict';

    const DEFAULT_FALLBACK_SVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100%' height='100%' fill='%230f172a'/><circle cx='50' cy='50' r='42' fill='none' stroke='%2338bdf8' stroke-width='2'/><circle cx='50' cy='50' r='32' fill='%231e293b' stroke='%23f59e0b' stroke-width='1.5'/><text x='50' y='57' font-size='24' text-anchor='middle' fill='%2338bdf8'>☯</text></svg>";

    const ASSETS_MANIFEST = {
        // 1. NHÂN VẬT (BẢN THỂ TU SĨ) THEO 9 ĐẠI CẢNH GIỚI (NAM & NỮ)
        characters: {
            male: {
                luyen_khi: "./assets/images/char_male_luyen_khi.png",
                truc_co: "./assets/images/char_male_truc_co.png",
                ket_dan: "./assets/images/char_male_ket_dan.png",
                nguyen_anh: "./assets/images/char_male_nguyen_anh.png",
                hoa_than: "./assets/images/char_male_hoa_than.png",
                luyen_hu: "./assets/images/char_male_luyen_hu.png",
                hop_the: "./assets/images/char_male_hop_the.png",
                dai_thua: "./assets/images/char_male_dai_thua.png",
                do_kiep: "./assets/images/char_male_do_kiep.png",
                default: "./assets/images/avatar_lone_cultivator.jpg"
            },
            female: {
                luyen_khi: "./assets/images/char_female_luyen_khi.png",
                truc_co: "./assets/images/char_female_truc_co.png",
                ket_dan: "./assets/images/char_female_ket_dan.png",
                nguyen_anh: "./assets/images/char_female_nguyen_anh.png",
                hoa_than: "./assets/images/char_female_hoa_than.png",
                luyen_hu: "./assets/images/char_female_luyen_hu.png",
                hop_the: "./assets/images/char_female_hop_the.png",
                dai_thua: "./assets/images/char_female_dai_thua.png",
                do_kiep: "./assets/images/char_female_do_kiep.png",
                default: "./assets/images/image_11.png"
            }
        },

        // 2. ĐẠO LỮ (KHUÊ PHÒNG)
        companions: {
            lieu_nhu_yen: "./assets/images/companion_lieu_nhu_yen.png",
            bach_to_trinh: "./assets/images/companion_bach_to_trinh.png",
            nam_cung_uyen: "./assets/images/companion_nam_cung_uyen.png",
            tu_linh: "./assets/images/companion_tu_linh.png",
            dao_co: "./assets/images/companion_dao_co.png",
            default: "./assets/images/pet_fox.jpg"
        },

        // 3. LINH THÚ (TIỂU SỦNG)
        pets: {
            tieu_bach: "./assets/images/pet_fox.jpg",
            cuu_vi_thien_ho: "./assets/images/pet_cuu_vi.png",
            hac_long: "./assets/images/pet_hac_long.png",
            kim_bang: "./assets/images/pet_kim_bang.png",
            ky_lan: "./assets/images/pet_ky_lan.png",
            huyen_vu: "./assets/images/pet_huyen_vu.png",
            default: "./assets/images/pet_fox.jpg"
        },

        // 4. BOSS TRẤN YÊU THÁP
        bosses: {
            tier_1: "./assets/images/sprite_boss_demon.svg",
            tier_2: "./assets/images/boss_ancient_demon.jpg",
            tier_3: "./assets/images/boss_flame_beast.png",
            tier_4: "./assets/images/boss_frost_dragon.png",
            tier_5_floor_50: "./assets/images/boss_huyet_ma_than.png",
            default: "./assets/images/sprite_boss_demon.svg"
        },

        // 5. BỐI CẢNH THẾ GIỚI (BACKGROUNDS)
        backgrounds: {
            ha_gioi: "./assets/images/bg_hagioi_co.png",
            linh_gioi: "./assets/images/bg_linh_gioi.jpg",
            demon_tower: "./assets/images/bg_demon_tower.jpg",
            tribulation: "./assets/images/bg_tribulation_storm.jpg",
            dong_phu: "./assets/images/bg_lofi_dongphu.jpg",
            sect: "./assets/images/bg_thanh_van_sect.jpg",
            peak: "./assets/images/bg_tu_tieu_peak.jpg",
            default: "./assets/images/bg_hagioi_co.png"
        },

        // 6. CƠ SỞ ĐỘNG PHỦ (LÒ ĐAN & LÒ RÈN)
        facilities: {
            cauldron_basic: "./assets/images/cauldron_basic.png",
            cauldron_advanced: "./assets/images/cauldron_advanced.png",
            cauldron_celestial: "./assets/images/cauldron_celestial.png",
            forge_basic: "./assets/images/forge_basic.png",
            forge_advanced: "./assets/images/forge_advanced.png",
            forge_divine: "./assets/images/forge_divine.png",
            default: "./assets/images/cauldron_basic.png"
        },

        // 7. PHÁP BẢO & ĐAN DƯỢC & NGUYÊN LIỆU (ITEMS & ICONS)
        items: {
            pill_qi: "./assets/images/item_qi_pill_bottle.jpg",
            pill_breakthrough: "./assets/images/pill_breakthrough.png",
            pill_hoa_than: "./assets/images/pill_hoa_than.png",
            pill_thanh_tam: "./assets/images/pill_thanh_tam.png",
            sword_bamboo: "./assets/images/item_bamboo_sword.jpg",
            sword_chaos: "./assets/images/sword_chaos.png",
            shield_turtle: "./assets/images/shield_turtle.png",
            armor_celestial: "./assets/images/armor_celestial.png",
            boots_wind: "./assets/images/boots_wind.png",
            ring_storage: "./assets/images/ring_storage.png",
            talisman_jade: "./assets/images/talisman_jade.png",
            scroll: "./assets/images/item_bamboo_scroll.jpg",
            scroll_chaos: "./assets/images/scroll_chaos.png",
            mirror: "./assets/images/mirror_bagua.jpg",
            stone_spirit: "./assets/images/stone_spirit.png",
            stone_chaos: "./assets/images/stone_chaos.png",
            herb_spirit: "./assets/images/herb_spirit.png",
            iron_mystic: "./assets/images/iron_mystic.png",
            default: "./assets/images/item_qi_pill_bottle.jpg"
        }
    };

    /**
     * Lấy đường dẫn ảnh từ ASSETS_MANIFEST
     */
    function getAssetUrl(category, key, fallback = null) {
        try {
            const cat = ASSETS_MANIFEST[category];
            if (!cat) return fallback || window.DEFAULT_IMG_FALLBACK || DEFAULT_FALLBACK_SVG;
            if (category === 'characters' && typeof key === 'object') {
                const gender = key.gender || 'female';
                const realm = key.realm || 'default';
                return cat[gender]?.[realm] || cat[gender]?.default || fallback || DEFAULT_FALLBACK_SVG;
            }
            const val = cat[key] || cat.default;
            return val || fallback || window.DEFAULT_IMG_FALLBACK || DEFAULT_FALLBACK_SVG;
        } catch (_) {
            return fallback || window.DEFAULT_IMG_FALLBACK || DEFAULT_FALLBACK_SVG;
        }
    }

    /**
     * Gắn ảnh an toàn vào phần tử <img> với cơ chế tự động fallback nếu chưa có file
     */
    function bindImageWithFallback(imgEl, targetSrc, fallbackSrc = null) {
        if (!imgEl) return;
        const finalFallback = fallbackSrc || window.DEFAULT_IMG_FALLBACK || DEFAULT_FALLBACK_SVG;
        imgEl.onerror = function() {
            this.onerror = null;
            this.src = finalFallback;
        };
        imgEl.src = targetSrc;
    }

    /**
     * Tự động inject CSS tối ưu cho toàn bộ ảnh nhân vật, linh thú và boss:
     * - object-fit: contain (không méo, không bị cắt xén)
     * - filter: drop-shadow (đứng khớp tự nhiên trên mặt đất khi thay ảnh PNG tách nền)
     */
    function injectAssetStyles() {
        if (document.getElementById('assets-manifest-styles')) return;
        const style = document.createElement('style');
        style.id = 'assets-manifest-styles';
        style.textContent = `
            /* Chuẩn hóa hiển thị PNG tách nền cho Nhân Vật, Linh Thú và Boss */
            #char-main-img,
            .character-avatar,
            .character-sprite,
            .sprite-entity-img,
            #player-sprite-img,
            #boss-sprite-img,
            .companion-portrait-img,
            #companion-main-img,
            #ui-pet-img,
            .pet-avatar-img,
            .cultivator-avatar-img,
            .fighter-stage-slot img {
                object-fit: contain !important;
                object-position: center bottom !important;
                filter: drop-shadow(0 15px 18px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 10px rgba(251, 191, 36, 0.25)) !important;
                transition: filter 0.3s ease, transform 0.3s ease;
            }

            #char-main-img:hover,
            .companion-portrait-img:hover {
                filter: drop-shadow(0 18px 22px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 18px rgba(251, 191, 36, 0.55)) !important;
            }

            /* Scrollbar mỏng thẩm mỹ cao cho toàn bộ danh sách popup dài */
            .custom-scrollbar::-webkit-scrollbar,
            .overflow-y-auto::-webkit-scrollbar,
            .popup-content::-webkit-scrollbar,
            .game-page::-webkit-scrollbar,
            .feature-popup::-webkit-scrollbar,
            #cultivation-log::-webkit-scrollbar,
            .market-list::-webkit-scrollbar,
            .sect-content::-webkit-scrollbar {
                width: 5px !important;
                height: 5px !important;
            }

            .custom-scrollbar::-webkit-scrollbar-track,
            .overflow-y-auto::-webkit-scrollbar-track,
            .popup-content::-webkit-scrollbar-track,
            .game-page::-webkit-scrollbar-track,
            .feature-popup::-webkit-scrollbar-track,
            #cultivation-log::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.5) !important;
                border-radius: 4px !important;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb,
            .overflow-y-auto::-webkit-scrollbar-thumb,
            .popup-content::-webkit-scrollbar-thumb,
            .game-page::-webkit-scrollbar-thumb,
            .feature-popup::-webkit-scrollbar-thumb,
            #cultivation-log::-webkit-scrollbar-thumb {
                background: rgba(245, 158, 11, 0.45) !important;
                border-radius: 4px !important;
                border: 1px solid rgba(251, 191, 36, 0.3) !important;
            }

            .custom-scrollbar::-webkit-scrollbar-thumb:hover,
            .overflow-y-auto::-webkit-scrollbar-thumb:hover,
            .popup-content::-webkit-scrollbar-thumb:hover,
            .game-page::-webkit-scrollbar-thumb:hover,
            .feature-popup::-webkit-scrollbar-thumb:hover,
            #cultivation-log::-webkit-scrollbar-thumb:hover {
                background: rgba(245, 158, 11, 0.75) !important;
            }

            /* Đảm bảo bố cục PC Laptop 1366x768, 1600x900, 1920x1080 không bị đè chữ hay tràn cuộn ngang */
            html, body {
                overflow-x: hidden !important;
                max-width: 100vw !important;
            }

            /* Font chữ Tiên Hiệp Cổ Phong sắc nét */
            h1, h2, h3, h4, .font-serif, .xianxia-title, .game-title-logo {
                font-family: 'Cinzel', 'Playfair Display', serif !important;
            }

            /* Số liệu dạng tabular-nums chống rung lắc giật nhảy khung */
            .font-mono, [font-family*="Mono"], .tabular-nums, #idle-rate-badge, #ui-cp-val, #celestial-omen-time, .stat-value, .currency-val {
                font-family: 'Roboto Mono', monospace !important;
                font-variant-numeric: tabular-nums !important;
                font-feature-settings: "tnum" 1 !important;
            }

            /* Chuyển động mở/đóng mượt mà cho toàn bộ Modal và Sub-tab (0.15s fade + scale nhẹ) */
            .feature-popup, .game-page, .modal-backdrop, .profile-account-overlay, .encounter-card, #modal-cam-nang {
                transition: opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }

            @media (min-width: 1024px) and (max-width: 1400px) {
                #left-panel, .left-panel-col {
                    width: 290px !important;
                    max-width: 290px !important;
                }
                #right-panel, .right-panel-col {
                    width: 280px !important;
                    max-width: 280px !important;
                }
                #center-avatar {
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                }
                #tu-vi-bar {
                    max-width: 760px !important;
                    bottom: 58px !important;
                }
                #bottom-menu {
                    padding: 5px 12px !important;
                }
            }

            @media (min-width: 1401px) {
                #left-panel, .left-panel-col {
                    width: 290px !important;
                    max-width: 290px !important;
                }
                #right-panel, .right-panel-col {
                    width: 280px !important;
                    max-width: 280px !important;
                }
                #tu-vi-bar {
                    max-width: 790px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAssetStyles);
    } else {
        injectAssetStyles();
    }

    // Đăng ký toàn cục
    ASSETS_MANIFEST.DEFAULT_FALLBACK_SVG = DEFAULT_FALLBACK_SVG;
    if (typeof window !== 'undefined') {
        window.ASSETS_MANIFEST = ASSETS_MANIFEST;
        window.DEFAULT_IMG_FALLBACK = DEFAULT_FALLBACK_SVG;
        window.getAssetUrl = getAssetUrl;
        window.bindImageWithFallback = bindImageWithFallback;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.ASSETS_MANIFEST = ASSETS_MANIFEST;
        globalThis.DEFAULT_IMG_FALLBACK = DEFAULT_FALLBACK_SVG;
        globalThis.getAssetUrl = getAssetUrl;
        globalThis.bindImageWithFallback = bindImageWithFallback;
    }
})();
