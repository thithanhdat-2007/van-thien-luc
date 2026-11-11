/**
 * ============================================================================
 * VẤN THIÊN LỤC — HỆ THỐNG TƯƠNG TÁC GIAO DIỆN NÂNG CAO (UX/UI INTERACTION)
 * Module: interaction.js
 * 
 * 1. CƠ CHẾ KÉO THẢ (HTML5 DRAG & DROP)
 *    - Túi đồ -> Ô trang bị (Tự động nhận diện type, thay thế trang bị cũ)
 *    - Ô trang bị -> Túi đồ (Tháo trang bị)
 * 2. CƠ CHẾ NHẤP ĐÚP (QUICK ACTION - DBLCLICK)
 *    - Trong túi: Tự động mặc (nếu là trang bị) / Phục dụng (nếu là đan dược)
 *    - Trong ô trang bị: Tự động tháo trang bị về túi
 * 3. CƠ CHẾ MENU CHUỘT PHẢI (CUSTOM CONTEXT MENU)
 *    - Mặc / Tháo / Dùng
 *    - Bán nhận Linh Thạch (theo phẩm chất)
 *    - Vứt bỏ
 * 4. TOOLTIP BÁM CHUỘT & CHỐNG RÒ RỈ BỘ NHỚ (EVENT DELEGATION)
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    // Bảng giá bán vật phẩm theo phẩm chất (Linh Thạch)
    const RARITY_SELL_PRICES = {
        1: 50,       // Phàm phẩm
        2: 250,      // Linh phẩm
        3: 1000,     // Huyền phẩm
        4: 5000,     // Địa phẩm
        5: 25000,    // Thiên phẩm
        6: 100000    // Tiên phẩm
    };

    // Tên tiếng Việt của các ô trang bị
    const SLOT_LABELS = {
        weapon: 'Vũ Khí',
        armor: 'Đạo Bào',
        boots: 'Phi Hài',
        ring: 'Giới Chỉ',
        talisman: 'Ngọc Bội',
        artifact: 'Bản Mệnh'
    };

    let currentDragItem = null;
    let contextMenuItemId = null;

    /**
     * Ẩn tooltip an toàn
     */
    function safeHideItemTooltip() {
        if (typeof hideItemTooltip === 'function') {
            hideItemTooltip();
        } else if (typeof window !== 'undefined' && typeof window.hideItemTooltip === 'function') {
            window.hideItemTooltip();
        } else {
            const tip = document.getElementById('rpg-item-tooltip');
            if (tip) tip.classList.add('hidden');
        }
    }

    /**
     * Lấy dữ liệu vật phẩm từ state hiện tại
     */
    function getItemFromState(itemId) {
        if (!itemId) return null;
        const s = (typeof state !== 'undefined' ? state : (window.state || null));
        if (!s || !Array.isArray(s.inventory)) return null;
        return s.inventory.find(i => i.id === itemId) || null;
    }

    /**
     * 1. HÀM MẶC TRANG BỊ (EQUIP ITEM)
     */
    function equipItem(itemId) {
        const s = (typeof state !== 'undefined' ? state : (window.state || null));
        if (!s) return false;
        const item = s.inventory.find(i => i.id === itemId);
        if (!item || !item.slot) return false;

        // Kiểm tra khóa tính năng Bản Mệnh Pháp Bảo
        if (item.slot === 'artifact') {
            if (typeof rejectLockedFeature === 'function' && rejectLockedFeature('btn_phap_bao_ban_menh')) return false;
            if (typeof REALMS !== 'undefined' && s.realmIndex != null && REALMS[s.realmIndex]?.majorIndex < 2 && !item.equipped) {
                if (typeof addLog === 'function') {
                    addLog("⚠️ Bản Mệnh Pháp Bảo cần đạt đến <span class='text-gold-300 font-bold'>Kim Đan Kỳ</span> mới có thể ngự dụng!", "text-rose-400");
                }
                return false;
            }
        }

        // Nếu đã mặc món này rồi thì không cần làm gì
        if (item.equipped) return true;

        // Tháo món cũ cùng ô (nếu có)
        const oldEquipped = s.inventory.find(i => i.slot === item.slot && i.equipped && i.id !== item.id);
        if (oldEquipped) {
            oldEquipped.equipped = false;
        }

        item.equipped = true;
        if (s.equipment && typeof s.equipment === 'object') {
            s.equipment[item.slot] = item;
        }

        // Đồng bộ GameState & tính toán lại chỉ số
        if (typeof syncGameState === 'function') syncGameState(s);
        if (typeof calculateTotalStats === 'function') {
            const tot = calculateTotalStats(s);
            if (tot) {
                s.atk = tot.atk;
                s.def = tot.def;
                s.maxHp = tot.maxHp;
                s.maxMp = tot.maxMp;
                s.crit = tot.crit;
            }
        }

        if (typeof playSound === 'function') playSound('bell');
        if (typeof triggerSlotFlash === 'function') triggerSlotFlash(item.slot);

        if (typeof addLog === 'function') {
            addLog(`⚔️ <span class="text-amber-300 font-bold">[Trang Bị]</span> Đã mặc [${item.name}] vào ô <b>${SLOT_LABELS[item.slot] || item.slot}</b>!`, 'reward');
        }

        // Cập nhật giao diện
        if (typeof updateHUD === 'function') updateHUD();
        if (typeof renderRpgCharacterInventory === 'function') renderRpgCharacterInventory();
        if (typeof renderQuickEquipSlots === 'function') renderQuickEquipSlots();

        return true;
    }

    /**
     * 2. HÀM THÁO TRANG BỊ (UNEQUIP ITEM)
     */
    function unequipItem(slotOrItemId) {
        const s = (typeof state !== 'undefined' ? state : (window.state || null));
        if (!s) return false;

        const item = s.inventory.find(i => (i.id === slotOrItemId || i.slot === slotOrItemId) && i.equipped);
        if (!item) return false;

        item.equipped = false;
        if (s.equipment && typeof s.equipment === 'object') {
            s.equipment[item.slot] = null;
        }

        // Đồng bộ GameState & tính toán lại chỉ số
        if (typeof syncGameState === 'function') syncGameState(s);
        if (typeof calculateTotalStats === 'function') {
            const tot = calculateTotalStats(s);
            if (tot) {
                s.atk = tot.atk;
                s.def = tot.def;
                s.maxHp = tot.maxHp;
                s.maxMp = tot.maxMp;
                s.crit = tot.crit;
            }
        }

        if (typeof playSound === 'function') playSound('bell');
        if (typeof triggerSlotFlash === 'function') triggerSlotFlash(item.slot);

        if (typeof addLog === 'function') {
            addLog(`📦 <span class="text-slate-300">[Tháo Trang Bị]</span> Đã tháo [${item.name}] đưa về Túi Đồ.`, 'text-slate-400');
        }

        // Cập nhật giao diện
        if (typeof updateHUD === 'function') updateHUD();
        if (typeof renderRpgCharacterInventory === 'function') renderRpgCharacterInventory();
        if (typeof renderQuickEquipSlots === 'function') renderQuickEquipSlots();

        return true;
    }

    /**
     * 3. HÀM BÁN VẬT PHẨM (SELL ITEM FOR SPIRIT STONES)
     */
    function sellInventoryItem(itemId, amount = 1) {
        const s = (typeof state !== 'undefined' ? state : (window.state || null));
        if (!s) return false;

        const item = s.inventory.find(i => i.id === itemId);
        if (!item || item.count <= 0) return false;

        // Nếu đang mặc thì tháo ra trước khi bán
        if (item.equipped) {
            item.equipped = false;
        if (s.equipment && typeof s.equipment === 'object') {
            s.equipment[item.slot] = null;
        }
        }

        const rarity = Math.min(6, Math.max(1, item.rarity || 1));
        const unitPrice = RARITY_SELL_PRICES[rarity] || 50;
        const sellQty = Math.min(item.count, Math.max(1, amount));
        const totalGain = unitPrice * sellQty;

        item.count -= sellQty;
        s.stones = (s.stones || 0) + totalGain;

        // Nếu hết thì xóa khỏi túi đồ
        if (item.count <= 0) {
            const idx = s.inventory.indexOf(item);
            if (idx > -1) s.inventory.splice(idx, 1);
        }

        // Đồng bộ & tính lại chỉ số
        if (typeof syncGameState === 'function') syncGameState(s);
        if (typeof calculateTotalStats === 'function') {
            const tot = calculateTotalStats(s);
            if (tot) {
                s.atk = tot.atk;
                s.def = tot.def;
                s.maxHp = tot.maxHp;
                s.maxMp = tot.maxMp;
                s.crit = tot.crit;
            }
        }

        if (typeof playSound === 'function') playSound('bell');

        if (typeof addLog === 'function') {
            addLog(`💰 <span class="text-amber-300 font-bold">[Bán Vật Phẩm]</span> Đã bán ${sellQty}x [${item.name}], thu được <b>+${totalGain.toLocaleString('vi-VN')}</b> Linh Thạch!`, 'reward');
        }

        safeHideItemTooltip();
        hideCustomContextMenu();

        if (typeof updateHUD === 'function') updateHUD();
        if (typeof renderRpgCharacterInventory === 'function') renderRpgCharacterInventory();
        if (typeof renderQuickEquipSlots === 'function') renderQuickEquipSlots();

        return true;
    }

    /**
     * 4. HÀM VỨT BỎ VẬT PHẨM (DISCARD ITEM)
     */
    function discardInventoryItem(itemId, amount = 1) {
        const s = (typeof state !== 'undefined' ? state : (window.state || null));
        if (!s) return false;

        const item = s.inventory.find(i => i.id === itemId);
        if (!item || item.count <= 0) return false;

        // Cảnh báo nếu vật phẩm quý (Huyền phẩm trở lên)
        const rarity = item.rarity || 1;
        if (rarity >= 3) {
            const confirmDiscard = window.confirm(`Đạo hữu có chắc chắn muốn vứt bỏ vật phẩm quý hiếm [${item.name}] không? Hành động này không thể hoàn tác!`);
            if (!confirmDiscard) return false;
        }

        if (item.equipped) {
            item.equipped = false;
        if (s.equipment && typeof s.equipment === 'object') {
            s.equipment[item.slot] = null;
        }
        }

        const discardQty = Math.min(item.count, Math.max(1, amount));
        item.count -= discardQty;

        if (item.count <= 0) {
            const idx = s.inventory.indexOf(item);
            if (idx > -1) s.inventory.splice(idx, 1);
        }

        if (typeof syncGameState === 'function') syncGameState(s);
        if (typeof calculateTotalStats === 'function') {
            const tot = calculateTotalStats(s);
            if (tot) {
                s.atk = tot.atk;
                s.def = tot.def;
                s.maxHp = tot.maxHp;
                s.maxMp = tot.maxMp;
                s.crit = tot.crit;
            }
        }

        if (typeof addLog === 'function') {
            addLog(`🗑️ <span class="text-rose-400">[Vứt Bỏ]</span> Đã bỏ rơi ${discardQty}x [${item.name}].`, 'text-rose-400');
        }

        safeHideItemTooltip();
        hideCustomContextMenu();

        if (typeof updateHUD === 'function') updateHUD();
        if (typeof renderRpgCharacterInventory === 'function') renderRpgCharacterInventory();
        if (typeof renderQuickEquipSlots === 'function') renderQuickEquipSlots();

        return true;
    }

    /**
     * TẠO HOẶC LẤY MENU CHUỘT PHẢI TỰ ĐỊNH NGHĨA (CUSTOM CONTEXT MENU)
     */
    function getOrCreateContextMenu() {
        let menu = document.getElementById('custom-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'custom-context-menu';
            menu.className = 'hidden';
            document.body.appendChild(menu);
        }
        return menu;
    }

    /**
     * HIỂN THỊ CUSTOM CONTEXT MENU TẠI TỌA ĐỘ CHUỘT (CÓ CLAMP CHỐNG TRÀN MÀN HÌNH)
     */
    function showCustomContextMenu(event, itemId) {
        const item = getItemFromState(itemId);
        if (!item) return;

        contextMenuItemId = itemId;
        const menu = getOrCreateContextMenu();

        const rarity = Math.min(6, Math.max(1, item.rarity || 1));
        const sellPrice = RARITY_SELL_PRICES[rarity] || 50;

        let actionLabel = 'Sử Dụng';
        let actionIcon = 'fa-hand-sparkles';
        if (item.slot) {
            actionLabel = item.equipped ? 'Tháo Trang Bị' : 'Mặc Trang Bị';
            actionIcon = item.equipped ? 'fa-arrow-down-to-bracket' : 'fa-shirt';
        } else if (item.type === 'Đan Dược' || item.effect) {
            actionLabel = 'Phục Dụng';
            actionIcon = 'fa-pills';
        }

        menu.innerHTML = `
            <div class="px-2.5 py-1.5 border-b border-amber-500/25 mb-1 flex items-center justify-between">
                <span class="font-bold text-xs text-amber-300 truncate max-w-[140px]">${item.name}</span>
                <span class="text-[10px] font-mono text-slate-400">x${item.count}</span>
            </div>
            <button type="button" class="context-menu-item" onclick="window.handleContextMenuAction('action')">
                <i class="fa-solid ${actionIcon} text-amber-400 text-xs w-4 text-center"></i>
                <span>${actionLabel}</span>
            </button>
            <button type="button" class="context-menu-item" onclick="window.handleContextMenuAction('sell')">
                <i class="fa-solid fa-coins text-yellow-400 text-xs w-4 text-center"></i>
                <span>Bán (+${sellPrice.toLocaleString('vi-VN')} L.Thạch)</span>
            </button>
            <button type="button" class="context-menu-item danger" onclick="window.handleContextMenuAction('discard')">
                <i class="fa-solid fa-trash-can text-rose-400 text-xs w-4 text-center"></i>
                <span>Vứt Bỏ</span>
            </button>
        `;

        menu.classList.remove('hidden');

        // Tính toán clamp vị trí để không tràn mép màn hình
        const menuWidth = 200;
        const menuHeight = 155;
        const pad = 10;
        let x = event.clientX + 5;
        let y = event.clientY + 5;

        if (x + menuWidth > window.innerWidth - pad) {
            x = window.innerWidth - menuWidth - pad;
        }
        if (y + menuHeight > window.innerHeight - pad) {
            y = window.innerHeight - menuHeight - pad;
        }

        menu.style.left = `${Math.max(pad, x)}px`;
        menu.style.top = `${Math.max(pad, y)}px`;

        safeHideItemTooltip();
    }

    /**
     * ẨN CUSTOM CONTEXT MENU
     */
    function hideCustomContextMenu() {
        const menu = document.getElementById('custom-context-menu');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
        contextMenuItemId = null;
    }

    /**
     * XỬ LÝ HÀNH ĐỘNG TỪ CONTEXT MENU
     */
    function handleContextMenuAction(actionType) {
        if (!contextMenuItemId) return;
        const itemId = contextMenuItemId;
        const item = getItemFromState(itemId);
        if (!item) {
            hideCustomContextMenu();
            return;
        }

        if (actionType === 'action') {
            if (item.slot) {
                if (item.equipped) {
                    unequipItem(item.slot || item.id);
                } else {
                    equipItem(item.id);
                }
            } else if (item.type === 'Đan Dược' || item.effect) {
                if (typeof useInventoryItem === 'function') {
                    useInventoryItem(item.id);
                }
            } else {
                if (typeof addLog === 'function') {
                    addLog(`Vật phẩm [${item.name}] dùng cho đột phá hoặc chế tác linh đan/pháp bảo.`, 'text-slate-400');
                }
            }
        } else if (actionType === 'sell') {
            sellInventoryItem(itemId, 1);
        } else if (actionType === 'discard') {
            discardInventoryItem(itemId, 1);
        }

        hideCustomContextMenu();
    }

    /**
     * THIẾT LẬP TOÀN BỘ SỰ KIỆN GIAO DIỆN (EVENT DELEGATION DUY NHẤT TRÊN DOCUMENT)
     * Ngăn ngừa rò rỉ bộ nhớ (memory leaks) khi DOM bị re-render liên tục.
     */
    function setupInteractionListeners() {
        // --- 1. SỰ KIỆN DRAG & DROP ---

        // Bắt đầu kéo (dragstart)
        document.addEventListener('dragstart', (e) => {
            const dragTarget = e.target.closest('[draggable="true"], [data-item-id]');
            if (!dragTarget) return;

            const itemId = dragTarget.dataset.itemId;
            const slot = dragTarget.dataset.slot;
            const isEquipped = dragTarget.dataset.isEquipped === 'true';
            const itemType = dragTarget.dataset.itemType;

            if (!itemId) return;

            currentDragItem = {
                itemId,
                slot,
                isEquipped,
                itemType,
                sourceEl: dragTarget
            };

            try {
                e.dataTransfer.setData('text/plain', JSON.stringify({ itemId, slot, isEquipped, itemType }));
                e.dataTransfer.effectAllowed = 'move';
            } catch (err) {
                // Fallback nếu JSON lỗi
                e.dataTransfer.setData('text/plain', itemId);
            }

            // Thêm class .dragging tạo hiệu ứng mờ
            setTimeout(() => {
                if (dragTarget) dragTarget.classList.add('dragging');
            }, 10);

            // Ẩn tooltip khi bắt đầu kéo
            safeHideItemTooltip();
            hideCustomContextMenu();
        });

        // Kéo qua vùng thả (dragover)
        document.addEventListener('dragover', (e) => {
            if (!currentDragItem) return;

            const equipSlotDropzone = e.target.closest('.rpg-equip-slot, [data-drop-zone="equipment"]');
            const inventoryDropzone = e.target.closest('.inventory-grid, #rpg-inventory-grid, [data-drop-zone="inventory"], .custom-inventory-scrollbar');

            if (equipSlotDropzone) {
                // Kiểm tra xem món đồ có đúng ô không
                const targetSlot = equipSlotDropzone.dataset.slot;
                const canEquip = currentDragItem.slot && currentDragItem.slot === targetSlot;

                if (canEquip) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    equipSlotDropzone.classList.add('dropzone-valid-highlight');
                }
            } else if (inventoryDropzone) {
                // Nếu đang kéo từ trang bị ra túi đồ
                if (currentDragItem.isEquipped) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    inventoryDropzone.classList.add('dropzone-valid-highlight');
                }
            }
        });

        // Rời khỏi vùng thả (dragleave)
        document.addEventListener('dragleave', (e) => {
            const dropzone = e.target.closest('.dropzone-valid-highlight');
            if (dropzone && (!dropzone.contains(e.relatedTarget))) {
                dropzone.classList.remove('dropzone-valid-highlight');
            }
        });

        // Kết thúc kéo (dragend)
        document.addEventListener('dragend', () => {
            if (currentDragItem && currentDragItem.sourceEl) {
                currentDragItem.sourceEl.classList.remove('dragging');
            }
            document.querySelectorAll('.dropzone-valid-highlight').forEach(el => {
                el.classList.remove('dropzone-valid-highlight');
            });
            currentDragItem = null;
        });

        // Thả vật phẩm (drop)
        document.addEventListener('drop', (e) => {
            document.querySelectorAll('.dropzone-valid-highlight').forEach(el => {
                el.classList.remove('dropzone-valid-highlight');
            });

            if (!currentDragItem) return;

            const equipSlotDropzone = e.target.closest('.rpg-equip-slot, [data-drop-zone="equipment"]');
            const inventoryDropzone = e.target.closest('.inventory-grid, #rpg-inventory-grid, [data-drop-zone="inventory"], .custom-inventory-scrollbar');

            // Thả vào ô trang bị
            if (equipSlotDropzone) {
                e.preventDefault();
                const targetSlot = equipSlotDropzone.dataset.slot;
                const item = getItemFromState(currentDragItem.itemId);

                if (item && item.slot === targetSlot) {
                    equipItem(item.id);
                } else if (item) {
                    if (typeof addLog === 'function') {
                        addLog(`⚠️ [Không Khớp Vị Trí] [${item.name}] thuộc ô ${SLOT_LABELS[item.slot] || item.slot}, không thể trang bị vào ô ${SLOT_LABELS[targetSlot] || targetSlot}!`, 'text-rose-400');
                    }
                    if (typeof playSound === 'function') playSound('bell');
                }
            }
            // Thả vào túi đồ (để tháo)
            else if (inventoryDropzone) {
                if (currentDragItem.isEquipped) {
                    e.preventDefault();
                    unequipItem(currentDragItem.slot || currentDragItem.itemId);
                }
            }

            currentDragItem = null;
        });

        // --- 2. SỰ KIỆN NHẤP ĐÚP (DBLCLICK - QUICK ACTION) ---
        document.addEventListener('dblclick', (e) => {
            const target = e.target.closest('[data-item-id]');
            if (!target) return;

            const itemId = target.dataset.itemId;
            const item = getItemFromState(itemId);
            if (!item) return;

            e.preventDefault();
            safeHideItemTooltip();
            hideCustomContextMenu();

            // Nếu đang trong ô trang bị hoặc đang trang bị -> Tự động tháo về túi
            if (item.equipped || target.closest('.rpg-equip-slot, [data-drop-zone="equipment"]')) {
                unequipItem(item.slot || item.id);
            }
            // Nếu trong túi đồ -> Tự động mặc (nếu có slot) hoặc phục dụng (nếu là đan dược)
            else {
                if (item.slot) {
                    equipItem(item.id);
                } else if (item.type === 'Đan Dược' || item.effect) {
                    if (typeof useInventoryItem === 'function') {
                        useInventoryItem(item.id);
                    }
                } else {
                    if (typeof addLog === 'function') {
                        addLog(`Vật phẩm [${item.name}] dùng cho đột phá hoặc chế tác linh đan/pháp bảo.`, 'text-slate-400');
                    }
                }
            }
        });

        // --- 3. SỰ KIỆN CHUỘT PHẢI (CONTEXTMENU) ---
        document.addEventListener('contextmenu', (e) => {
            const target = e.target.closest('[data-item-id]');
            if (!target) {
                hideCustomContextMenu();
                return;
            }

            e.preventDefault();
            const itemId = target.dataset.itemId;
            showCustomContextMenu(e, itemId);
        });

        // Đóng Context Menu khi click ra ngoài
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('custom-context-menu');
            if (menu && !menu.contains(e.target)) {
                hideCustomContextMenu();
            }
        });

        // Đóng Context Menu khi nhấn phím Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.code === 'Escape') {
                hideCustomContextMenu();
                safeHideItemTooltip();
            }
        });

        // Đóng Context Menu khi chuyển tab hoặc resize cửa sổ
        if (typeof window.addEventListener === 'function') {
            window.addEventListener('resize', hideCustomContextMenu);
            window.addEventListener('blur', hideCustomContextMenu);
        }

        // --- 4. TOOLTIP BÁM THEO CHUỘT (MOUSEMOVE) ---
        document.addEventListener('mousemove', (e) => {
            const tooltip = document.getElementById('rpg-item-tooltip');
            if (!tooltip || tooltip.classList.contains('hidden')) return;

            // Kiểm tra nếu đang kéo thả thì ẩn tooltip ngay
            if (currentDragItem) {
                safeHideItemTooltip();
                return;
            }

            const pad = 12;
            const tipW = tooltip.offsetWidth || 280;
            const tipH = tooltip.offsetHeight || 220;

            let left = e.clientX + 16;
            let top = e.clientY + 16;

            if (left + tipW > window.innerWidth - pad) {
                left = e.clientX - tipW - 16;
            }
            if (top + tipH > window.innerHeight - pad) {
                top = e.clientY - tipH - 16;
            }

            left = Math.max(pad, Math.min(window.innerWidth - tipW - pad, left));
            top = Math.max(pad, Math.min(window.innerHeight - tipH - pad, top));

            tooltip.style.left = `${Math.round(left)}px`;
            tooltip.style.top = `${Math.round(top)}px`;
        });

        // Khởi động Parallax chiều sâu không gian
        initParallaxVFX();

        // 5. TƯƠNG TÁC TỤ KHÍ KHI CHẠM NHÂN VẬT (Avatar Qi Tap & Guzheng Synesthesia)
        const charAvatar = document.getElementById('char-main-img') || document.getElementById('player-avatar');
        if (charAvatar) {
            charAvatar.addEventListener('pointerdown', (e) => {
                if (typeof window.triggerQiBurst === 'function') {
                    window.triggerQiBurst(e.clientX, e.clientY);
                }
                if (typeof window.playSound === 'function') {
                    window.playSound('guzheng');
                }
                if (typeof window.addExp === 'function') {
                    const bonusExp = Math.max(1, Math.round((window.state?.spiritRate || 5) * 0.5));
                    window.addExp(bonusExp);
                }
                const floating = document.getElementById('floating-text-container');
                if (floating) {
                    const span = document.createElement('span');
                    span.className = 'inline-block text-xs font-mono font-bold text-amber-300 animate-bounce pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]';
                    span.textContent = '+Linh Khí';
                    floating.appendChild(span);
                    setTimeout(() => span.remove(), 800);
                }
            });
        }
    }

    /**
     * Parallax Chuẩn Tiên Hiệp 3D (Depth-of-Field Parallax Controller)
     * Nhẹ nhàng, êm dịu, không giật lag (Lerp 0.06 / requestAnimationFrame)
     */
    function initParallaxVFX() {
        if (typeof window === 'undefined') return;
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const bgArt = document.getElementById('scene-bg-art');
        const mistLayer = document.getElementById('tsparticles');
        const charInner = document.getElementById('char-main-img');
        if (!bgArt) return;

        let targetX = 0, targetY = 0;
        let currentBgX = 0, currentBgY = 0;
        let currentMistX = 0, currentMistY = 0;
        let currentCharX = 0, currentCharY = 0;
        let isTicking = false;
        let idleTimer = null;

        function updateParallax() {
            const lerpFactor = 0.06;
            currentBgX += (targetX * -14 - currentBgX) * lerpFactor;
            currentBgY += (targetY * -8 - currentBgY) * lerpFactor;

            currentMistX += (targetX * -22 - currentMistX) * lerpFactor;
            currentMistY += (targetY * -12 - currentMistY) * lerpFactor;

            currentCharX += (targetX * 5 - currentCharX) * lerpFactor;
            currentCharY += (targetY * 3 - currentCharY) * lerpFactor;

            if (bgArt) {
                bgArt.style.transform = `translate3d(${currentBgX.toFixed(2)}px, ${currentBgY.toFixed(2)}px, 0) scale(1.035)`;
            }
            if (mistLayer) {
                mistLayer.style.transform = `translate3d(${currentMistX.toFixed(2)}px, ${currentMistY.toFixed(2)}px, 0)`;
            }
            if (charInner) {
                charInner.style.transform = `translate3d(${currentCharX.toFixed(2)}px, ${currentCharY.toFixed(2)}px, 0)`;
            }

            const delta = Math.abs(currentBgX - targetX * -14) + Math.abs(currentBgY - targetY * -8);
            if (delta > 0.05) {
                requestAnimationFrame(updateParallax);
            } else {
                isTicking = false;
            }
        }

        window.addEventListener('mousemove', (e) => {
            const w = window.innerWidth || 1280;
            const h = window.innerHeight || 800;
            targetX = (e.clientX - w / 2) / (w / 2);
            targetY = (e.clientY - h / 2) / (h / 2);

            if (!isTicking) {
                isTicking = true;
                requestAnimationFrame(updateParallax);
            }

            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                targetX = 0;
                targetY = 0;
                if (!isTicking) {
                    isTicking = true;
                    requestAnimationFrame(updateParallax);
                }
            }, 3000);
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
            if (!isTicking) {
                isTicking = true;
                requestAnimationFrame(updateParallax);
            }
        }, { passive: true });
    }

    // Khởi chạy khi tài liệu tải xong
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupInteractionListeners);
    } else {
        setupInteractionListeners();
    }

    // Expose ra toàn cục
    window.equipItem = equipItem;
    window.unequipItem = unequipItem;
    window.sellInventoryItem = sellInventoryItem;
    window.discardInventoryItem = discardInventoryItem;
    window.showCustomContextMenu = showCustomContextMenu;
    window.hideCustomContextMenu = hideCustomContextMenu;
    window.handleContextMenuAction = handleContextMenuAction;

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
