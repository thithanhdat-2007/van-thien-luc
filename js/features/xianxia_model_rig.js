/**
 * ==============================================================================
 * HỆ THỐNG MODEL 2D TIÊN HIỆP ĐA LỚP & TIẾN HÓA CẢNH GIỚI (XIANXIA 2D RIG ENGINE)
 * Kiến trúc 5 lớp tách biệt: Pedestal -> Back Aura -> Body -> Weapon -> FX
 * ==============================================================================
 */

(function () {
    'use strict';

    // 1. CÁC ĐẾ LINH TRẬN VECTOR NGUYÊN BẢN (PEDESTAL SVG TEMPLATES)
    const PEDESTALS = {
        // Giai đoạn 1: Sương trắng mỏng dưới chân phàm nhân
        mist: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="pedMistGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.6"/>
                        <stop offset="60%" stop-color="#bae6fd" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <ellipse cx="100" cy="100" rx="90" ry="90" fill="url(#pedMistGrad)"/>
                <ellipse cx="100" cy="100" rx="60" ry="60" fill="none" stroke="#bae6fd" stroke-width="1.2" stroke-dasharray="4,6" opacity="0.5"/>
            </svg>
        `,
        // Giai đoạn 2: Bát Quái Linh Trận Lam Quang
        baguaCyan: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="pedBaguaGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
                        <stop offset="70%" stop-color="#0284c7" stop-opacity="0.15"/>
                        <stop offset="100%" stop-color="#0369a1" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="92" fill="url(#pedBaguaGrad)"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.85"/>
                <circle cx="100" cy="100" r="74" fill="none" stroke="#7dd3fc" stroke-width="1.5" stroke-dasharray="8,6" opacity="0.9"/>
                <circle cx="100" cy="100" r="54" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.75"/>
                <!-- 8 Quẻ Bát Quái phù văn -->
                <g stroke="#38bdf8" stroke-width="2.5" opacity="0.9">
                    <line x1="100" y1="14" x2="100" y2="24"/>
                    <line x1="100" y1="176" x2="100" y2="186"/>
                    <line x1="14" y1="100" x2="24" y2="100"/>
                    <line x1="176" y1="100" x2="186" y2="100"/>
                    <line x1="38" y1="38" x2="45" y2="45"/>
                    <line x1="162" y1="162" x2="155" y2="155"/>
                    <line x1="162" y1="38" x2="155" y2="45"/>
                    <line x1="38" y1="162" x2="45" y2="155"/>
                </g>
                <!-- Thái Cực Đồ Trung Tâm -->
                <circle cx="100" cy="100" r="32" fill="none" stroke="#38bdf8" stroke-width="1.8"/>
                <path d="M 100 68 A 16 16 0 0 1 100 100 A 16 16 0 0 0 100 132 A 32 32 0 0 1 100 68 Z" fill="#38bdf8" opacity="0.75"/>
                <circle cx="100" cy="84" r="4.5" fill="#0284c7"/>
                <circle cx="100" cy="116" r="4.5" fill="#e0f2fe"/>
            </svg>
        `,
        // Giai đoạn 3: Thập Nhị Phẩm Băng Liên Đài & Bát Quái Hoàng Kim
        lotusGold: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="pedGoldLotusGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.6"/>
                        <stop offset="50%" stop-color="#facc15" stop-opacity="0.3"/>
                        <stop offset="85%" stop-color="#ca8a04" stop-opacity="0.12"/>
                        <stop offset="100%" stop-color="#854d0e" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="95" fill="url(#pedGoldLotusGrad)"/>
                <circle cx="100" cy="100" r="92" fill="none" stroke="#fde047" stroke-width="2.5" opacity="0.95"/>
                <circle cx="100" cy="100" r="80" fill="none" stroke="#facc15" stroke-width="1.8" stroke-dasharray="10,6" opacity="0.9"/>
                <!-- 12 Cánh Sen Băng Tinh Hoàng Kim -->
                <g fill="none" stroke="#fef08a" stroke-width="2" opacity="0.95">
                    <path d="M 100 15 C 90 45, 90 70, 100 85 C 110 70, 110 45, 100 15 Z" fill="#facc15" fill-opacity="0.25"/>
                    <path d="M 100 185 C 90 155, 90 130, 100 115 C 110 130, 110 155, 100 185 Z" fill="#facc15" fill-opacity="0.25"/>
                    <path d="M 15 100 C 45 90, 70 90, 85 100 C 70 110, 45 110, 15 100 Z" fill="#facc15" fill-opacity="0.25"/>
                    <path d="M 185 100 C 155 90, 130 90, 115 100 C 130 110, 155 110, 185 100 Z" fill="#facc15" fill-opacity="0.25"/>
                </g>
                <!-- Tâm Liên Đài Phát Quang -->
                <circle cx="100" cy="100" r="38" fill="none" stroke="#fde047" stroke-width="2"/>
                <circle cx="100" cy="100" r="18" fill="#fef08a" opacity="0.8"/>
            </svg>
        `,
        // Quái vật / Boss: Huyết Ma Pháp Trận
        demonBlood: `
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="pedDemonGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.6"/>
                        <stop offset="60%" stop-color="#9f1239" stop-opacity="0.25"/>
                        <stop offset="100%" stop-color="#4c0519" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="92" fill="url(#pedDemonGrad)"/>
                <circle cx="100" cy="100" r="88" fill="none" stroke="#f43f5e" stroke-width="2" opacity="0.9"/>
                <circle cx="100" cy="100" r="72" fill="none" stroke="#be123c" stroke-width="1.8" stroke-dasharray="8,5" opacity="0.85"/>
                <!-- Huyết Ma Phù Triện & Gai Sừng -->
                <polygon points="100,18 171,142 29,142" fill="none" stroke="#fda4af" stroke-width="1.6" opacity="0.8"/>
                <polygon points="100,182 29,58 171,58" fill="none" stroke="#fda4af" stroke-width="1.6" opacity="0.8"/>
                <circle cx="100" cy="100" r="28" fill="#881337" opacity="0.8" stroke="#f43f5e" stroke-width="2"/>
                <circle cx="100" cy="100" r="10" fill="#fef08a"/>
            </svg>
        `
    };

    // 2. HÀO QUANG & PHI KIẾM XOAY TRÒN SAU LƯNG (BACK AURA TEMPLATES)
    const BACK_AURAS = {
        none: `<div class="rig-aura-glow"></div>`,
        swords3: `
            <div class="rig-aura-glow"></div>
            <div class="rig-aura-wheel">
                <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
                    <!-- 3 Thanh Phi Kiếm Lam Quang Hộ Thể -->
                    <g transform="translate(110, 110)">
                        <g transform="rotate(0) translate(0, -78)">
                            <path d="M 0 -22 L 4 0 L 0 22 L -4 0 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
                        </g>
                        <g transform="rotate(120) translate(0, -78)">
                            <path d="M 0 -22 L 4 0 L 0 22 L -4 0 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
                        </g>
                        <g transform="rotate(240) translate(0, -78)">
                            <path d="M 0 -22 L 4 0 L 0 22 L -4 0 Z" fill="#38bdf8" stroke="#ffffff" stroke-width="1"/>
                        </g>
                    </g>
                </svg>
            </div>
        `,
        swords6Gold: `
            <div class="rig-aura-glow glow--gold"></div>
            <div class="rig-aura-wheel">
                <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
                    <!-- Vòng Thái Cực Hỗn Độn Pháp Luân Hoàng Kim -->
                    <circle cx="110" cy="110" r="76" fill="none" stroke="#fde047" stroke-width="2" stroke-dasharray="8,6" opacity="0.85"/>
                    <circle cx="110" cy="110" r="58" fill="none" stroke="#facc15" stroke-width="1.5" opacity="0.75"/>
                    <!-- 6 Thanh Thần Kiếm Kim Quang -->
                    <g transform="translate(110, 110)">
                        <g transform="rotate(0) translate(0, -82)"><path d="M 0 -26 L 5 0 L 0 26 L -5 0 Z" fill="#fde047" stroke="#ffffff" stroke-width="1.2"/></g>
                        <g transform="rotate(60) translate(0, -82)"><path d="M 0 -26 L 5 0 L 0 26 L -5 0 Z" fill="#fde047" stroke="#ffffff" stroke-width="1.2"/></g>
                        <g transform="rotate(120) translate(0, -82)"><path d="M 0 -26 L 5 0 L 0 26 L -5 0 Z" fill="#fde047" stroke="#ffffff" stroke-width="1.2"/></g>
                        <g transform="rotate(180) translate(0, -82)"><path d="M 0 -26 L 5 0 L 0 26 L -5 0 Z" fill="#fde047" stroke="#ffffff" stroke-width="1.2"/></g>
                        <g transform="rotate(240) translate(0, -82)"><path d="M 0 -26 L 5 0 L 0 26 L -5 0 Z" fill="#fde047" stroke="#ffffff" stroke-width="1.2"/></g>
                        <g transform="rotate(300) translate(0, -82)"><path d="M 0 -26 L 5 0 L 0 26 L -5 0 Z" fill="#fde047" stroke="#ffffff" stroke-width="1.2"/></g>
                    </g>
                </svg>
            </div>
        `,
        demonRune: `
            <div class="rig-aura-glow glow--demon"></div>
            <div class="rig-aura-wheel">
                <svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="110" cy="110" r="82" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="10,6" opacity="0.9"/>
                    <!-- 4 Huyết Nhận Ma Tộc -->
                    <g transform="translate(110, 110)">
                        <g transform="rotate(0) translate(0, -85)"><path d="M 0 -28 L 6 0 L 0 28 L -6 0 Z" fill="#e11d48" stroke="#fef08a" stroke-width="1.2"/></g>
                        <g transform="rotate(90) translate(0, -85)"><path d="M 0 -28 L 6 0 L 0 28 L -6 0 Z" fill="#e11d48" stroke="#fef08a" stroke-width="1.2"/></g>
                        <g transform="rotate(180) translate(0, -85)"><path d="M 0 -28 L 6 0 L 0 28 L -6 0 Z" fill="#e11d48" stroke="#fef08a" stroke-width="1.2"/></g>
                        <g transform="rotate(270) translate(0, -85)"><path d="M 0 -28 L 6 0 L 0 28 L -6 0 Z" fill="#e11d48" stroke="#fef08a" stroke-width="1.2"/></g>
                    </g>
                </svg>
            </div>
        `
    };

    // 3. THẦN BINH / PHÁP BẢO CẦM TAY (WEAPON TEMPLATES)
    const WEAPONS = {
        // Kiếm sắt mộc mạc
        ironSword: `
            <svg width="42" height="110" viewBox="0 0 42 110" xmlns="http://www.w3.org/2000/svg">
                <path d="M 21 0 L 26 80 L 32 82 L 21 86 L 10 82 L 16 80 Z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1"/>
                <rect x="18" y="86" width="6" height="20" fill="#475569" rx="2"/>
                <circle cx="21" cy="108" r="3" fill="#cbd5e1"/>
            </svg>
        `,
        // Thanh Phong Linh Kiếm
        cyanSpiritSword: `
            <svg width="46" height="120" viewBox="0 0 46 120" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="wpBladeGrad" x1="0" y1="0" x2="0" y2="100%">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="40%" stop-color="#7dd3fc"/>
                        <stop offset="100%" stop-color="#0284c7"/>
                    </linearGradient>
                </defs>
                <path d="M 23 0 L 29 85 L 36 88 L 23 92 L 10 88 L 17 85 Z" fill="url(#wpBladeGrad)" stroke="#bae6fd" stroke-width="1.2"/>
                <path d="M 12 88 C 23 85, 23 85, 34 88 L 30 94 L 16 94 Z" fill="#ca8a04"/>
                <rect x="20" y="94" width="6" height="22" fill="#0f172a" stroke="#facc15" stroke-width="1" rx="2"/>
                <circle cx="23" cy="118" r="3.5" fill="#facc15"/>
            </svg>
        `,
        // Tru Tiên Thần Kiếm / Hiên Viên Kiếm
        goldDivineSword: `
            <svg width="50" height="130" viewBox="0 0 50 130" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="wpGoldGrad" x1="0" y1="0" x2="0" y2="100%">
                        <stop offset="0%" stop-color="#ffffff"/>
                        <stop offset="30%" stop-color="#fef08a"/>
                        <stop offset="70%" stop-color="#facc15"/>
                        <stop offset="100%" stop-color="#ca8a04"/>
                    </linearGradient>
                </defs>
                <path d="M 25 0 L 32 92 L 40 96 L 25 100 L 10 96 L 18 92 Z" fill="url(#wpGoldGrad)" stroke="#ffffff" stroke-width="1.5"/>
                <line x1="25" y1="8" x2="25" y2="92" stroke="#ca8a04" stroke-width="2"/>
                <path d="M 8 96 C 25 90, 25 90, 42 96 L 36 102 L 14 102 Z" fill="#eab308" stroke="#fef08a" stroke-width="1"/>
                <rect x="21" y="102" width="8" height="24" fill="#1e1b4b" stroke="#fde047" stroke-width="1.2" rx="2"/>
                <circle cx="25" cy="128" r="4.5" fill="#fde047"/>
            </svg>
        `,
        // Huyết Ma Ma Nhận (Boss)
        demonBlade: `
            <svg width="50" height="130" viewBox="0 0 50 130" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="wpDemonGrad" x1="0" y1="0" x2="0" y2="100%">
                        <stop offset="0%" stop-color="#fda4af"/>
                        <stop offset="35%" stop-color="#f43f5e"/>
                        <stop offset="80%" stop-color="#9f1239"/>
                        <stop offset="100%" stop-color="#4c0519"/>
                    </linearGradient>
                </defs>
                <path d="M 25 0 C 35 30, 45 70, 32 94 L 40 98 L 25 102 L 10 98 L 18 94 C 5 70, 15 30, 25 0 Z" fill="url(#wpDemonGrad)" stroke="#fef08a" stroke-width="1.2"/>
                <rect x="21" y="102" width="8" height="24" fill="#0f070a" stroke="#e11d48" stroke-width="1.2" rx="2"/>
                <circle cx="25" cy="128" r="4.5" fill="#f59e0b"/>
            </svg>
        `
    };

    /**
     * HÀM TIẾN HÓA NGOẠI HÌNH THEO CẢNH GIỚI (REALM VISUAL EVOLUTION)
     * @param {string} realmName - Tên cảnh giới (Luyện Khí, Trúc Cơ, Kim Đan, Nguyên Anh, Hóa Thần...)
     * @param {string} gender - Giới tính ('male' hoặc 'female')
     * @returns {Object} Cấu hình 5 lớp của Model Rig
     */
    function getCultivatorVisualConfig(realmName = '', gender = 'male') {
        const realmStr = String(realmName || '').toLowerCase();

        // Giai đoạn 3: Nguyên Anh, Hóa Thần, Luyện Hư, Hợp Thể, Đại Thừa, Độ Kiếp...
        if (
            realmStr.includes('hóa thần') ||
            realmStr.includes('hoa than') ||
            realmStr.includes('nguyên anh') ||
            realmStr.includes('nguyen anh') ||
            realmStr.includes('luyện hư') ||
            realmStr.includes('hợp thể') ||
            realmStr.includes('đại thừa') ||
            realmStr.includes('độ kiếp') ||
            realmStr.includes('tiên đế')
        ) {
            return {
                stage: 3,
                title: 'Chí Tôn Thần Cảnh',
                pedestalSvg: PEDESTALS.lotusGold,
                pedestalClass: '',
                backAuraSvg: BACK_AURAS.swords6Gold,
                bodyImage: './assets/images/sprite_player_swordsman.svg',
                weaponSvg: WEAPONS.goldDivineSword,
                weaponClass: 'weapon--right',
                swordsCount: 6
            };
        }

        // Giai đoạn 2: Trúc Cơ, Kim Đan
        if (
            realmStr.includes('trúc cơ') ||
            realmStr.includes('truc co') ||
            realmStr.includes('kim đan') ||
            realmStr.includes('kim dan')
        ) {
            return {
                stage: 2,
                title: 'Kim Đan Chân Nhân',
                pedestalSvg: PEDESTALS.baguaCyan,
                pedestalClass: '',
                backAuraSvg: BACK_AURAS.swords3,
                bodyImage: './assets/images/sprite_player_swordsman.svg',
                weaponSvg: WEAPONS.cyanSpiritSword,
                weaponClass: 'weapon--right',
                swordsCount: 3
            };
        }

        // Giai đoạn 1 (Mặc định): Phàm Nhân, Luyện Khí Kỳ
        return {
            stage: 1,
            title: 'Luyện Khí Tu Sĩ',
            pedestalSvg: PEDESTALS.mist,
            pedestalClass: '',
            backAuraSvg: BACK_AURAS.none,
            bodyImage: './assets/images/sprite_player_swordsman.svg',
            weaponSvg: WEAPONS.ironSword,
            weaponClass: 'weapon--right',
            swordsCount: 0
        };
    }

    /**
     * HÀM TIẾN HÓA MODEL QUÁI VẬT / BOSS THEO TẦNG TRẤN YÊU THÁP
     * @param {number} floor - Số tầng hiện tại (1 -> 50+)
     * @param {string} bossName - Tên Boss
     * @returns {Object} Cấu hình 5 lớp của Boss Rig
     */
    function getMonsterVisualConfig(floor = 1, bossName = '') {
        const isLandmark = (floor % 10 === 0);

        if (isLandmark) {
            // Mốc tầng 10, 20, 30...: Đại Ma Hoàng / Huyết Dực Ma Hoàng
            return {
                stage: 2,
                title: bossName || `Huyết Dực Ma Hoàng (Tầng ${floor})`,
                pedestalSvg: PEDESTALS.demonBlood,
                pedestalClass: 'pedestal--demon',
                backAuraSvg: BACK_AURAS.demonRune,
                bodyImage: './assets/images/sprite_boss_demon.svg',
                weaponSvg: WEAPONS.demonBlade,
                weaponClass: 'weapon--left weapon--demon',
                isBoss: true
            };
        }

        // Tầng thường (1-9, 11-19...): Tiểu Yêu / Ám Lang / Ma Thú
        return {
            stage: 1,
            title: bossName || `U Minh Ma Thú (Tầng ${floor})`,
            pedestalSvg: PEDESTALS.demonBlood,
            pedestalClass: 'pedestal--demon',
            backAuraSvg: BACK_AURAS.none,
            bodyImage: './assets/images/sprite_boss_demon.svg',
            weaponSvg: WEAPONS.demonBlade,
            weaponClass: 'weapon--left weapon--demon',
            isBoss: true
        };
    }

    /**
     * TẠO CHUỖI HTML 5 LỚP HOÀN CHỈNH CHO .xianxia-model-rig
     */
    function createXianxiaModelRigHTML(config, options = {}) {
        const idAttr = options.id ? `id="${options.id}"` : '';
        const extraClass = options.extraClass ? ` ${options.extraClass}` : '';
        const bodyImgId = options.bodyImgId ? `id="${options.bodyImgId}"` : '';

        return `
            <div class="xianxia-model-rig${extraClass}" ${idAttr}>
                <!-- LỚP 1: ĐẾ LINH TRẬN DƯỚI CHÂN -->
                <div class="rig-layer-pedestal ${config.pedestalClass || ''}">
                    ${config.pedestalSvg || ''}
                </div>

                <!-- LỚP 2: HÀO QUANG & PHÁP TƯỚNG SAU LƯNG -->
                <div class="rig-layer-back-aura">
                    ${config.backAuraSvg || ''}
                </div>

                <!-- LỚP 3: THÂN THỂ 2D MANHUA CHI TIẾT CAO -->
                <div class="rig-layer-body">
                    <img src="${config.bodyImage}" alt="${config.title || 'Tu Sĩ'}" class="rig-body-img sprite-entity-img" ${bodyImgId} />
                </div>

                <!-- LỚP 4: THẦN BINH / PHÁP BẢO CẦM TAY -->
                <div class="rig-layer-weapon ${config.weaponClass || 'weapon--right'}">
                    ${config.weaponSvg || ''}
                </div>

                <!-- LỚP 5: HIỆU ỨNG PHẢN HỒI CHIẾN ĐẤU -->
                <div class="rig-layer-fx"></div>
            </div>
        `.trim();
    }

    /**
     * GẮN HOẶC CẬP NHẬT MODEL RIG VÀO MỘT CONTAINER ELEMENT
     */
    function renderXianxiaModelRig(container, config, options = {}) {
        if (!container) return;
        container.innerHTML = createXianxiaModelRigHTML(config, options);
    }

    /**
     * KÍCH HOẠT HIỆU ỨNG PHẢN HỒI CHIẾN ĐẤU (GPU CSS ANIMATION)
     * @param {HTMLElement|string} rigOrId - DOM element hoặc selector
     * @param {'lunge'|'hit'|'dodge'} animType - Loại hiệu ứng
     * @param {boolean} isBoss - Là boss hay player
     */
    function triggerRigCombatAnim(rigOrId, animType, isBoss = false) {
        const rigEl = typeof rigOrId === 'string' ? document.querySelector(rigOrId) : rigOrId;
        if (!rigEl) return;

        if (animType === 'lunge') {
            const cls = isBoss ? 'anim-lunge-slash-boss' : 'anim-lunge-slash-player';
            rigEl.classList.remove('anim-lunge-slash-boss', 'anim-lunge-slash-player');
            void rigEl.offsetWidth; // Trigger reflow
            rigEl.classList.add(cls);
            setTimeout(() => rigEl.classList.remove(cls), 440);
        } else if (animType === 'hit') {
            rigEl.classList.remove('anim-hit-flash', 'rig-hit-flash');
            void rigEl.offsetWidth;
            rigEl.classList.add('rig-hit-flash');
            setTimeout(() => rigEl.classList.remove('rig-hit-flash'), 300);
        } else if (animType === 'dodge') {
            rigEl.classList.remove('anim-shadow-dodge');
            void rigEl.offsetWidth;
            rigEl.classList.add('anim-shadow-dodge');
            setTimeout(() => rigEl.classList.remove('anim-shadow-dodge'), 400);
        }
    }

    // EXPORTS RA GLOBAL SCOPE
    window.getCultivatorVisualConfig = getCultivatorVisualConfig;
    window.getMonsterVisualConfig = getMonsterVisualConfig;
    window.createXianxiaModelRigHTML = createXianxiaModelRigHTML;
    window.renderXianxiaModelRig = renderXianxiaModelRig;
    window.triggerRigCombatAnim = triggerRigCombatAnim;

    globalThis.getCultivatorVisualConfig = getCultivatorVisualConfig;
    globalThis.getMonsterVisualConfig = getMonsterVisualConfig;
    globalThis.createXianxiaModelRigHTML = createXianxiaModelRigHTML;
    globalThis.renderXianxiaModelRig = renderXianxiaModelRig;
    globalThis.triggerRigCombatAnim = triggerRigCombatAnim;
})();
