/**
 * ============================================================================
 * VẤN THIÊN LỤC — HỆ SINH THÁI ĐỘNG PHỦ (DONG PHU ECOSYSTEM)
 * File: js/dong_phu_ecosystem.js
 * ============================================================================
 * Chuỗi cung ứng khép kín & liên thông dữ liệu cốt lõi:
 * 1. Tiên Môn Gia Viên (Nguồn cung): Tự động sản xuất Thảo Dược, Khoáng Thạch, Tu Vi.
 * 2. Luyện Đan Phòng (Tiêu thụ Thảo Dược): Trừ herbs -> Chế tạo pills vào kho đan dược.
 * 3. Luyện Khí Thất (Tiêu thụ Khoáng Thạch): Trừ materials -> Đúc tạo equipments.
 * 4. Khuê Phòng Đạo Lữ (Buff toàn cục & Tiêu thụ Đan Dược): Dùng pills làm quà tặng
 *    tăng hảo cảm, kích hoạt các buff Luyện Đan (+10%), Luyện Khí (-20% time), Gia Viên (+50%).
 * 5. UI Binding: Mọi trang đều đọc trực tiếp từ window.player / window.state.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    // =========================================================================
    // 1. KHỞI TẠO & ĐỒNG BỘ CẤU TRÚC OBJECT PLAYER TOÀN CỤC
    // =========================================================================
    function ensurePlayerEcosystemState() {
        if (!window.player) {
            window.player = (window.state && window.state.player) ? window.state.player : {};
        }

        // Đồng bộ các thuộc tính tài nguyên
        if (typeof window.state !== 'undefined') {
            if (typeof window.player.stones === 'undefined') window.player.stones = window.state.stones || 0;
            if (typeof window.player.tuVi === 'undefined') window.player.tuVi = window.state.exp || 0;
            if (typeof window.player.linhKhi === 'undefined') window.player.linhKhi = window.state.linhKhi || 0;
        }

        // Cấu trúc túi đồ 4 ngăn phân cấp
        if (!window.player.inventory) window.player.inventory = {};
        const inv = window.player.inventory;

        if (!Array.isArray(inv.herbs)) {
            inv.herbs = [
                { id: 'herb_thai_at', name: 'Thái Ất Linh Thảo', count: 18, desc: 'Linh thảo trăm năm hấp thu nhật nguyệt, nguyên liệu luyện Trúc Cơ Đan', icon: 'fa-seedling', quality: 'Hạ Phẩm' },
                { id: 'herb_tuyet_lien', name: 'Tuyết Liên Hoa', count: 8, desc: 'Bông sen mọc trên đỉnh hàn băng ngàn năm, nguyên liệu luyện Hồi Khí Đan', icon: 'fa-spa', quality: 'Trung Phẩm' },
                { id: 'herb_hoang_tinh', name: 'Hoàng Tinh Thảo', count: 12, desc: 'Thảo dược đại bổ khí huyết, tăng tu vi', icon: 'fa-leaf', quality: 'Hạ Phẩm' }
            ];
        }

        if (!Array.isArray(inv.materials)) {
            inv.materials = [
                { id: 'ore_huyen_thach', name: 'Huyền Thiết Thạch', count: 15, desc: 'Quặng sắt đen chứa địa linh, dùng đúc vũ khí sơ giai', icon: 'fa-gem', quality: 'Hạ Phẩm' },
                { id: 'ore_bach_ngoc', name: 'Bạch Ngọc Thạch', count: 6, desc: 'Ngọc thạch ôn nhuận dùng chế tạo Hộ Thân Kính', icon: 'fa-diamond', quality: 'Trung Phẩm' },
                { id: 'ore_tinh_thiet', name: 'Tinh Thiết', count: 10, desc: 'Kim loại tôi luyện nhiều lần, độ cứng cao', icon: 'fa-cubes', quality: 'Hạ Phẩm' }
            ];
        }

        if (!Array.isArray(inv.pills)) {
            inv.pills = [
                { id: 'pill_hoi_khi', name: 'Hồi Khí Đan', count: 5, desc: 'Hồi phục tức thì 500 Linh Lực, làm quà tặng Đạo Lữ (+150 Hảo Cảm)', grade: 'Hạ Phẩm', favorValue: 150 },
                { id: 'pill_truc_co', name: 'Trúc Cơ Đan', count: 2, desc: 'Đan dược phá cảnh Trúc Cơ, quà tặng quý giá (+400 Hảo Cảm)', grade: 'Trung Phẩm', favorValue: 400 }
            ];
        }

        if (!Array.isArray(inv.equipments)) {
            inv.equipments = [
                { id: 'wp_truc_kiem', name: 'Trúc Kiếm Cổ Linh', type: 'weapon', atk: 120, grade: 'Hạ Phẩm', desc: 'Kiếm trúc linh mộc chém sắt như chém bùn' }
            ];
        }

        // Danh sách Đạo Lữ toàn cục
        if (!Array.isArray(window.player.companions)) {
            window.player.companions = [
                {
                    id: 'lieu_nhu_yen',
                    name: 'Liễu Như Yên',
                    title: 'Thanh Vân Sư Muội',
                    avatar: './assets/images/pet_fox.jpg',
                    level: 3,
                    affection: 1800,
                    maxAffection: 3000,
                    buffDesc: 'Quản lý Gia Viên: +50% sản lượng; Tăng +15% Thân Pháp',
                    assignedNode: 'node_herb_garden'
                },
                {
                    id: 'ho_mi_nhi',
                    name: 'Hồ Mị Nhi',
                    title: 'Cửu Vĩ Thiên Hồ',
                    avatar: './assets/images/cultivator_avatar.png',
                    level: 3,
                    affection: 1500,
                    maxAffection: 3000,
                    buffDesc: 'Đan Đạo Tinh Thông: Tự động cộng +10% tỷ lệ thành công Luyện Đan',
                    assignedNode: null
                },
                {
                    id: 'bach_thien',
                    name: 'Bạch Thiển',
                    title: 'Băng Cung Tiên Tử',
                    avatar: './assets/images/dao_lu_avatar.jpg',
                    level: 5,
                    affection: 3000,
                    maxAffection: 5000,
                    buffDesc: 'Luyện Khí Đại Sư: Giảm 20% thời gian rèn đồ; +15% Bạo Kích',
                    assignedNode: 'node_ore_mine'
                }
            ];
        }

        // Đồng bộ ngược lại window.state
        if (typeof window.state !== 'undefined') {
            window.state.player = window.player;
            window.state.companions = window.player.companions;
        }
    }

    // =========================================================================
    // 2. TÍNH TOÁN BUFF TOÀN CỤC TỪ ĐẠO LỮ (calculateDongPhuBuffs)
    // =========================================================================
    function calculateDongPhuBuffs(playerObj) {
        const p = playerObj || window.player;
        if (!p || !Array.isArray(p.companions)) {
            return {
                alchemySuccessBonus: 0,
                forgeTimeReduction: 0,
                estateBonus: 0,
                critBonus: 0,
                speedBonus: 0
            };
        }

        let alchemySuccessBonus = 0;
        let forgeTimeReduction = 0;
        let estateBonus = 0;
        let critBonus = 0;
        let speedBonus = 0;

        p.companions.forEach(c => {
            // Hồ Mị Nhi: Cấp 3+ -> +10% tỷ lệ luyện đan; Cấp 5+ -> +20%
            if (c.id === 'ho_mi_nhi' || c.name.includes('Hồ Mị Nhi')) {
                if (c.level >= 5) alchemySuccessBonus += 0.20;
                else if (c.level >= 3) alchemySuccessBonus += 0.10;
                else if (c.level >= 1) alchemySuccessBonus += 0.05;
            }

            // Bạch Thiển: Cấp 3+ -> -10% thời gian rèn; Cấp 5+ -> -20% thời gian rèn & +15% bạo kích
            if (c.id === 'bach_thien' || c.name.includes('Bạch Thiển')) {
                if (c.level >= 5) {
                    forgeTimeReduction += 0.20;
                    critBonus += 15;
                } else if (c.level >= 3) {
                    forgeTimeReduction += 0.10;
                    critBonus += 8;
                }
            }

            // Liễu Như Yên: Cấp 3+ -> +50% sản lượng gia viên; Cấp 1+ -> +25%
            if (c.id === 'lieu_nhu_yen' || c.name.includes('Liễu Như Yên')) {
                if (c.level >= 3) {
                    estateBonus += 0.50;
                    speedBonus += 15;
                } else if (c.level >= 1) {
                    estateBonus += 0.25;
                    speedBonus += 8;
                }
            }
        });

        return {
            alchemySuccessBonus,
            forgeTimeReduction,
            estateBonus,
            critBonus,
            speedBonus
        };
    }
    window.calculateDongPhuBuffs = calculateDongPhuBuffs;

    // =========================================================================
    // 3. TIÊN MÔN GIA VIÊN (NGUỒN CUNG CẤP NGUYÊN LIỆU THÔ)
    // =========================================================================
    function collectGiaVien(nodeId) {
        ensurePlayerEcosystemState();
        const p = window.player;
        const buffs = calculateDongPhuBuffs(p);

        // Tìm node trong MasterDemos hoặc data nội bộ
        let targetNode = null;
        if (window.MasterDemos && window.MasterDemos.estateData) {
            targetNode = window.MasterDemos.estateData.nodes.find(n => n.id === nodeId);
        }

        if (!targetNode) {
            // Fallback thu thập mẫu nếu chưa render
            targetNode = {
                id: nodeId,
                name: nodeId === 'node_herb_garden' ? 'Dược Điền' : 'Linh Thạch Mỏ Quặng',
                accumulated: 10,
                resourceType: nodeId === 'node_herb_garden' ? 'herb' : 'stones'
            };
        }

        const rawAmount = Math.floor(targetNode.accumulated || 5);
        if (rawAmount <= 0) {
            showDongPhuToast('Linh bồn hiện chưa tích tụ đủ sản lượng để thu nạp.');
            return;
        }

        // Áp dụng bonus đạo lữ
        const bonusMultiplier = (targetNode.assignedCompanion ? 1.5 : 1.0) + (buffs.estateBonus || 0);
        const finalAmount = Math.max(1, Math.round(rawAmount * bonusMultiplier));
        targetNode.accumulated = 0;

        if (targetNode.id === 'node_herb_garden' || targetNode.resourceType === 'herb') {
            // Cộng thẳng vào player.inventory.herbs
            let herb = p.inventory.herbs.find(h => h.id === 'herb_thai_at');
            if (herb) herb.count += finalAmount;
            else p.inventory.herbs.push({ id: 'herb_thai_at', name: 'Thái Ất Linh Thảo', count: finalAmount, icon: 'fa-seedling', quality: 'Hạ Phẩm' });

            showDongPhuToast(`🌿 Đã thu hoạch +${finalAmount} Thái Ất Linh Thảo vào Kho Thảo Dược!`);
        } else if (targetNode.id === 'node_ore_mine' || targetNode.resourceType === 'stones') {
            // Cộng khoáng thạch vào player.inventory.materials & cộng linh thạch
            let ore = p.inventory.materials.find(m => m.id === 'ore_huyen_thach');
            if (ore) ore.count += Math.max(1, Math.round(finalAmount / 2));
            else p.inventory.materials.push({ id: 'ore_huyen_thach', name: 'Huyền Thiết Thạch', count: Math.max(1, Math.round(finalAmount / 2)), icon: 'fa-gem', quality: 'Hạ Phẩm' });

            const stonesGained = finalAmount * 150;
            p.stones = (p.stones || 0) + stonesGained;
            if (window.state) window.state.stones = (window.state.stones || 0) + stonesGained;

            showDongPhuToast(`💎 Đã khai thác +${Math.max(1, Math.round(finalAmount / 2))} Huyền Thiết Thạch và +${stonesGained.toLocaleString()} Linh Thạch!`);
        } else if (targetNode.id === 'node_spirit_tree' || targetNode.resourceType === 'exp') {
            // Cộng Tu Vi
            const expGained = finalAmount * 200;
            if (typeof window.addExp === 'function') window.addExp(expGained);
            else {
                p.tuVi = (p.tuVi || 0) + expGained;
                if (window.state) window.state.exp = (window.state.exp || 0) + expGained;
            }
            showDongPhuToast(`✨ Tụ Linh Mộc tẩm bổ đan điền, ngưng kết +${expGained.toLocaleString()} Tu Vi!`);
        } else if (targetNode.id === 'node_fish_pond' || targetNode.resourceType === 'liquid') {
            // Cộng Tẩy Tủy Dịch vào pills
            let liquid = p.inventory.pills.find(pi => pi.id === 'item_tay_tuy_dich');
            if (liquid) liquid.count += finalAmount;
            else p.inventory.pills.push({ id: 'item_tay_tuy_dich', name: 'Tẩy Tủy Dịch', count: finalAmount, grade: 'Trung Phẩm', favorValue: 250, desc: 'Linh dịch tẩy tủy phạt mao' });

            showDongPhuToast(`💧 Đã gạn lọc +${finalAmount} Tẩy Tủy Dịch vào Kho Đan Dược!`);
        }

        updateDongPhuUI();
        if (typeof window.updateHUD === 'function') window.updateHUD();
    }
    window.collectGiaVien = collectGiaVien;

    // =========================================================================
    // 4. LUYỆN ĐAN PHÒNG (TIÊU THỤ THẢO DƯỢC -> SẢN SINH TIÊN ĐAN)
    // =========================================================================
    function startAlchemy(recipeId) {
        ensurePlayerEcosystemState();
        const p = window.player;
        const buffs = calculateDongPhuBuffs(p);

        // Danh mục công thức đan dược
        const RECIPES = {
            'dan_hoi_khi': { id: 'dan_hoi_khi', name: 'Hồi Khí Đan', requiredHerbId: 'herb_thai_at', requiredCount: 3, baseChance: 0.85, favor: 150 },
            'dan_truc_co': { id: 'dan_truc_co', name: 'Trúc Cơ Đan', requiredHerbId: 'herb_tuyet_lien', requiredCount: 2, baseChance: 0.65, favor: 400 },
            'dan_tay_tuy': { id: 'dan_tay_tuy', name: 'Tẩy Tủy Đan', requiredHerbId: 'herb_hoang_tinh', requiredCount: 4, baseChance: 0.70, favor: 300 }
        };

        const recipe = RECIPES[recipeId] || RECIPES['dan_hoi_khi'];

        // 1. Kiểm tra tồn kho thảo dược thật từ Gia Viên
        const herbItem = p.inventory.herbs.find(h => h.id === recipe.requiredHerbId || h.count >= recipe.requiredCount);
        if (!herbItem || herbItem.count < recipe.requiredCount) {
            showDongPhuToast(`❌ Thất bại: Không đủ Thảo Dược! Cần ít nhất ${recipe.requiredCount} ${recipe.name.includes('Trúc Cơ') ? 'Tuyết Liên Hoa' : 'Thái Ất Linh Thảo'} do Gia Viên sản sinh.`);
            return false;
        }

        // 2. Trừ thảo dược khỏi túi
        herbItem.count -= recipe.requiredCount;

        // 3. Tính toán tỷ lệ thành công với Buff Đạo Lữ (Hồ Mị Nhi cấp 3: +10%)
        const totalChance = Math.min(0.98, recipe.baseChance + (buffs.alchemySuccessBonus || 0));
        const isSuccess = Math.random() <= totalChance;

        showDongPhuToast(`🔥 Lò Bát Quái bốc cháy! Đang vận chuyển chân hỏa luyện chế ${recipe.name}... (Tỉ lệ: ${Math.round(totalChance * 100)}%)`);

        setTimeout(() => {
            if (isSuccess) {
                // Đẩy thành phẩm vào player.inventory.pills
                let pill = p.inventory.pills.find(pi => pi.id === recipe.id);
                if (pill) pill.count += 1;
                else p.inventory.pills.push({ id: recipe.id, name: recipe.name, count: 1, grade: 'Hảo Hạng', favorValue: recipe.favor, desc: `Tiên đan luyện thành từ chân hỏa, quà tặng đạo lữ +${recipe.favor} Hảo Cảm` });

                showDongPhuToast(`🎉 THÀNH ĐAN! Lò mở xuất hiện 1 viên [${recipe.name}], đã cất vào Kho Đan Dược.`);
            } else {
                showDongPhuToast(`💥 Đan hỏa bất ổn, mẻ đan ${recipe.name} đã hóa thành tro tàn! Tích tụ thêm đan độc.`);
            }
            updateDongPhuUI();
        }, 1200);

        return true;
    }
    window.startAlchemy = startAlchemy;

    // =========================================================================
    // 5. LUYỆN KHÍ THẤT (TIÊU THỤ KHOÁNG THẠCH -> ĐÚC TẠO PHÁP BẢO)
    // =========================================================================
    function startForging(blueprintId) {
        ensurePlayerEcosystemState();
        const p = window.player;
        const buffs = calculateDongPhuBuffs(p);

        // Danh mục bản vẽ rèn đúc
        const BLUEPRINTS = {
            'bp_kiem': { id: 'bp_kiem', name: 'Thanh Phong Phi Kiếm', requiredMatId: 'ore_huyen_thach', requiredCount: 4, type: 'weapon', atk: 250 },
            'bp_giap': { id: 'bp_giap', name: 'Huyền Giáp Hộ Thân', requiredMatId: 'ore_bach_ngoc', requiredCount: 3, type: 'armor', def: 180 },
            'bp_chuoi': { id: 'bp_chuoi', name: 'Thái Hư Hộ Kính', requiredMatId: 'ore_tinh_thiet', requiredCount: 5, type: 'relic', def: 120 }
        };

        const bp = BLUEPRINTS[blueprintId] || BLUEPRINTS['bp_kiem'];

        // 1. Kiểm tra tồn kho Khoáng Thạch thật từ Gia Viên
        const matItem = p.inventory.materials.find(m => m.id === bp.requiredMatId || m.count >= bp.requiredCount);
        if (!matItem || matItem.count < bp.requiredCount) {
            showDongPhuToast(`❌ Thất bại: Không đủ Khoáng Thạch! Cần ít nhất ${bp.requiredCount} quặng do Mỏ Địa Mạch Gia Viên khai thác.`);
            return false;
        }

        // 2. Trừ khoáng thạch
        matItem.count -= bp.requiredCount;

        // 3. Thời gian rèn đồ có áp dụng buff Bạch Thiển (giảm 20%)
        const baseForgeTime = 1500;
        const actualForgeTime = Math.round(baseForgeTime * (1 - (buffs.forgeTimeReduction || 0)));

        showDongPhuToast(`🔨 Tiếng búa thiên công vang dội! Đang tôi rèn ${bp.name}... (Buff giảm thời gian: ${Math.round(buffs.forgeTimeReduction * 100)}%)`);

        setTimeout(() => {
            // Đẩy trang bị vào player.inventory.equipments
            p.inventory.equipments.push({
                id: bp.id + '_' + Date.now(),
                name: bp.name,
                type: bp.type,
                atk: bp.atk || 0,
                def: bp.def || 0,
                grade: (buffs.critBonus > 10 ? 'Cực Phẩm' : 'Thượng Phẩm'),
                desc: 'Thần binh rèn đúc từ địa hỏa động phủ'
            });

            showDongPhuToast(`⚔️ ĐÚC TẠO THÀNH CÔNG! [${bp.name}] xuất thế uy chấn bát hoang, đã chuyển vào Kho Trang Bị.`);
            updateDongPhuUI();
        }, actualForgeTime);

        return true;
    }
    window.startForging = startForging;

    // =========================================================================
    // 6. KHUÊ PHÒNG ĐẠO LỮ (TẶNG QUÀ BẰNG ĐAN DƯỢC & SONG TU VẤN ĐẠO)
    // =========================================================================
    function giftCompanionWithPill(companionId, pillId) {
        ensurePlayerEcosystemState();
        const p = window.player;

        const companion = p.companions.find(c => c.id === companionId) || p.companions[0];
        if (!companion) return;

        // Tìm viên đan trong player.inventory.pills
        let pillIndex = p.inventory.pills.findIndex(pi => pi.id === pillId && pi.count > 0);
        if (pillIndex === -1) {
            pillIndex = p.inventory.pills.findIndex(pi => pi.count > 0);
        }

        if (pillIndex === -1) {
            showDongPhuToast('❌ Hết đan dược! Hãy vào Luyện Đan Phòng luyện thêm tiên đan để làm quà tặng nàng.');
            return;
        }

        const pill = p.inventory.pills[pillIndex];
        pill.count -= 1;
        const gainedAffection = pill.favorValue || 200;

        companion.affection = (companion.affection || 0) + gainedAffection;
        if (pill.count <= 0) p.inventory.pills.splice(pillIndex, 1);

        // Nâng cấp độ Hảo Cảm
        let leveledUp = false;
        if (companion.affection >= companion.maxAffection && companion.level < 5) {
            companion.level += 1;
            companion.affection -= companion.maxAffection;
            companion.maxAffection = Math.round(companion.maxAffection * 1.5);
            leveledUp = true;
        }

        if (leveledUp) {
            showDongPhuToast(`💖 ${companion.name} tâm hoa nở rộ! Hảo cảm thăng lên [Cấp ${companion.level}], kích hoạt thêm chúc phúc toàn cục!`);
        } else {
            showDongPhuToast(`🎁 Đã tặng 1 viên [${pill.name}] cho ${companion.name} (+${gainedAffection} Hảo Cảm)!`);
        }

        updateDongPhuUI();
    }
    window.giftCompanionWithPill = giftCompanionWithPill;

    function dualCultivateWithCompanion(companionId) {
        ensurePlayerEcosystemState();
        const p = window.player;

        const companion = p.companions.find(c => c.id === companionId) || p.companions[0];
        if (!companion) return;

        const tuViGained = companion.level * 1200 + 800;
        if (typeof window.addExp === 'function') window.addExp(tuViGained);
        else p.tuVi = (p.tuVi || 0) + tuViGained;

        // Hồi phục Đạo Tâm
        if (typeof window.state !== 'undefined') {
            window.state.daoTam = Math.min(100, (window.state.daoTam || 80) + 10);
        }

        showDongPhuToast(`🌸 Cùng ${companion.name} Song Tu vấn đạo! Đạo tâm thanh tịnh, nhận +${tuViGained.toLocaleString()} Tu Vi & hồi phục Đạo Tâm!`);
        updateDongPhuUI();
        if (typeof window.updateHUD === 'function') window.updateHUD();
    }
    window.dualCultivateWithCompanion = dualCultivateWithCompanion;

    // =========================================================================
    // 7. GIAO DIỆN HIỂN THỊ CHUNG & UI BINDING TOÀN DIỆN
    // =========================================================================
    function updateDongPhuUI() {
        ensurePlayerEcosystemState();
        const p = window.player;
        const buffs = calculateDongPhuBuffs(p);

        // 1. Gia Viên Vault Shelf
        const elStones = document.getElementById('player-linh-thach');
        if (elStones) elStones.textContent = (p.stones || window.state?.stones || 0).toLocaleString();

        const elTuVi = document.getElementById('player-tu-vi');
        if (elTuVi) elTuVi.textContent = (p.tuVi || window.state?.exp || 0).toLocaleString();

        const elHerbs = document.getElementById('player-herbs');
        if (elHerbs) {
            const totalHerbs = p.inventory.herbs.reduce((sum, h) => sum + (h.count || 0), 0);
            elHerbs.textContent = totalHerbs;
        }

        const elOres = document.getElementById('player-ores');
        if (elOres) {
            const totalOres = p.inventory.materials.reduce((sum, m) => sum + (m.count || 0), 0);
            elOres.textContent = totalOres;
        }

        // 2. Luyện Đan - Kho Thảo Dược sẵn có
        const elAlchemyHerbsCount = document.getElementById('alchemy-inventory-herbs-count');
        if (elAlchemyHerbsCount) {
            const totalHerbs = p.inventory.herbs.reduce((sum, h) => sum + (h.count || 0), 0);
            elAlchemyHerbsCount.textContent = `${totalHerbs} bó`;
        }

        const elAlchemyPillsCount = document.getElementById('alchemy-inventory-pills-count');
        if (elAlchemyPillsCount) {
            const totalPills = p.inventory.pills.reduce((sum, pi) => sum + (pi.count || 0), 0);
            elAlchemyPillsCount.textContent = `${totalPills} viên`;
        }

        // 3. Luyện Khí - Kho Khoáng Thạch sẵn có
        const elForgeMaterialsCount = document.getElementById('forge-inventory-ores-count');
        if (elForgeMaterialsCount) {
            const totalOres = p.inventory.materials.reduce((sum, m) => sum + (m.count || 0), 0);
            elForgeMaterialsCount.textContent = `${totalOres} khối`;
        }

        const elForgeEquipCount = document.getElementById('forge-inventory-equip-count');
        if (elForgeEquipCount) {
            elForgeEquipCount.textContent = `${p.inventory.equipments.length} món`;
        }

        // 4. Khuê Phòng - Hảo cảm & Đan Dược tặng quà
        const companion = p.companions[0];
        if (companion) {
            const elCompName = document.getElementById('comp-name-title');
            if (elCompName) elCompName.textContent = companion.name;

            const elCompRank = document.getElementById('comp-affection-rank-badge');
            if (elCompRank) elCompRank.textContent = `Tri Kỷ (Cấp ${companion.level})`;

            const elAffText = document.getElementById('affection-points-text');
            if (elAffText) elAffText.textContent = `${companion.affection.toLocaleString()} / ${companion.maxAffection.toLocaleString()}`;

            const elAffFill = document.getElementById('affection-fill');
            if (elAffFill) {
                const pct = Math.min(100, Math.round((companion.affection / companion.maxAffection) * 100));
                elAffFill.style.width = `${pct}%`;
            }
        }

        // 5. Cập nhật nhãn Buff toàn cục
        const elBuffAlchemy = document.getElementById('buff-val-alchemy');
        if (elBuffAlchemy) elBuffAlchemy.textContent = `+${Math.round(buffs.alchemySuccessBonus * 100)}% Thành Đan`;

        const elBuffForge = document.getElementById('buff-val-forge');
        if (elBuffForge) elBuffForge.textContent = `-${Math.round(buffs.forgeTimeReduction * 100)}% Thời Gian Rèn`;
    }
    window.updateDongPhuUI = updateDongPhuUI;

    function showDongPhuToast(msg) {
        let toast = document.getElementById('toast-bubble');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-bubble';
            toast.className = 'toast-bubble';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2600);
    }
    window.showDongPhuToast = showDongPhuToast;

    // =========================================================================
    // 8. TỰ ĐỘNG KHỞI CHẠY & BIND VÀO DOM
    // =========================================================================
    function initDongPhuEcosystem() {
        console.log('🏛️ [DongPhuEcosystem] Initializing unified Dong Phu supply chain...');
        ensurePlayerEcosystemState();
        updateDongPhuUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDongPhuEcosystem);
    } else {
        initDongPhuEcosystem();
    }

})(window, document);
