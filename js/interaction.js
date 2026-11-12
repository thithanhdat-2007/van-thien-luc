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
    let currentDropTarget = null;
    let contextMenuItemId = null;

    function resolveItemSlot(slot, itemType) {
        if (slot === 'secondary_weapon') return 'artifact';
        if (slot) return slot;
        if (itemType === 'Vũ Khí' || itemType === 'weapon') return 'weapon';
        if (itemType === 'Pháp Bảo' || itemType === 'secondary_weapon' || itemType === 'Vũ Khí Phụ') return 'artifact';
        return '';
    }

    function resolveCharacterDropTarget(target) {
        if (!target || typeof target.closest !== 'function') return null;
        const zone = target.closest('[data-drop-zone="character"], #char-equip-dropzone, .char-equip-dropzone');
        if (!zone) return null;
        return zone.querySelector('#char-equip-dropzone, .char-equip-dropzone') || zone;
    }

    function isEquipmentItem(item, target) {
        if (!item) return false;
        if (target && target.closest('.equip-slot, .rpg-equip-slot, [data-drop-zone="equipment"]')) return true;
        return Boolean(resolveItemSlot(item.slot, item.type));
    }

    function setDropTargetHighlight(nextTarget) {
        if (currentDropTarget === nextTarget) return;
        if (currentDropTarget) {
            currentDropTarget.classList.remove('drop-target-valid', 'dropzone-valid-highlight');
        }
        currentDropTarget = nextTarget || null;
        if (currentDropTarget) {
            currentDropTarget.classList.add('drop-target-valid', 'dropzone-valid-highlight');
        }
    }

    function cleanupDragState() {
        if (currentDragItem && currentDragItem.sourceEl) {
            currentDragItem.sourceEl.classList.remove('is-dragging', 'dragging');
        }
        document.querySelectorAll('.is-dragging, .dragging').forEach(el => {
            el.classList.remove('is-dragging', 'dragging');
        });
        document.querySelectorAll('.drag-ghost-clone').forEach(el => el.remove());
        setDropTargetHighlight(null);
        document.body.classList.remove('is-item-dragging');
        currentDragItem = null;
    }

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
        const slotKey = item ? resolveItemSlot(item.slot, item.type) : '';
        if (!item || !slotKey) return false;

        // Kiểm tra khóa tính năng Bản Mệnh Pháp Bảo
        if (slotKey === 'artifact') {
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
        const oldEquipped = s.inventory.find(i => resolveItemSlot(i.slot, i.type) === slotKey && i.equipped && i.id !== item.id);
        if (oldEquipped) {
            oldEquipped.equipped = false;
        }

        item.equipped = true;
        if (!s.equipped || typeof s.equipped !== 'object') {
            s.equipped = {};
        }
        s.equipped[slotKey] = item;
        if (s.equipment && typeof s.equipment === 'object') {
            s.equipment[slotKey] = item;
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

        if (slotKey === 'weapon') {
            const swordEl = document.getElementById('flying-sword-visual');
            if (swordEl) swordEl.classList.remove('hidden');
        }

        if (typeof playSound === 'function') playSound('bell');
        if (typeof triggerSlotFlash === 'function') triggerSlotFlash(slotKey);

        if (typeof addLog === 'function') {
            addLog(`⚔️ <span class="text-amber-300 font-bold">[Trang Bị]</span> Đã mặc [${item.name}] vào ô <b>${SLOT_LABELS[slotKey] || slotKey}</b>!`, 'reward');
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

        const item = s.inventory.find(i => (i.id === slotOrItemId || i.slot === slotOrItemId || resolveItemSlot(i.slot, i.type) === slotOrItemId) && i.equipped);
        if (!item) return false;

        const slotKey = resolveItemSlot(item.slot, item.type);
        item.equipped = false;
        if (slotKey && s.equipped && typeof s.equipped === 'object' && s.equipped[slotKey]?.id === item.id) {
            s.equipped[slotKey] = null;
        }
        if (slotKey && s.equipment && typeof s.equipment === 'object') {
            s.equipment[slotKey] = null;
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

        if (slotKey === 'weapon') {
            const swordEl = document.getElementById('flying-sword-visual');
            if (swordEl) swordEl.classList.add('hidden');
        }

        if (typeof playSound === 'function') playSound('bell');
        if (slotKey && typeof triggerSlotFlash === 'function') triggerSlotFlash(slotKey);

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
            const dragTarget = e.target.closest('[data-item-id][draggable="true"]');
            if (!dragTarget) return;

            const itemId = dragTarget.dataset.itemId;
            const slot = dragTarget.dataset.slot || '';
            const isEquipped = dragTarget.dataset.isEquipped === 'true' || Boolean(dragTarget.closest('.equip-slot, .rpg-equip-slot, [data-drop-zone="equipment"]'));
            const itemType = dragTarget.dataset.itemType || '';

            if (!itemId) return;

            cleanupDragState();

            currentDragItem = {
                itemId,
                slot,
                isEquipped,
                itemType,
                sourceEl: dragTarget
            };

            if (e.dataTransfer) {
                try {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId, slot, isEquipped, itemType }));
                    e.dataTransfer.effectAllowed = 'move';
                } catch (err) {
                    // Fallback nếu JSON lỗi
                    e.dataTransfer.setData('text/plain', itemId);
                }

                // Tạo 1 bóng kéo cố định kích thước 56x56px để không bao giờ bị giãn
                const ghost = dragTarget.cloneNode(true);
                ghost.removeAttribute('id');
                ghost.classList.remove('is-dragging', 'dragging', 'ring-2', 'ring-yellow-300', 'border-yellow-300', 'animate-pulse');
                ghost.classList.add('drag-ghost-clone');
                ghost.style.width = '56px';
                ghost.style.height = '56px';
                ghost.style.minWidth = '56px';
                ghost.style.maxWidth = '56px';
                ghost.style.minHeight = '56px';
                ghost.style.maxHeight = '56px';
                ghost.style.position = 'fixed';
                ghost.style.top = '-9999px';
                ghost.style.left = '-9999px';
                ghost.style.margin = '0';
                ghost.style.transform = 'none';
                ghost.style.transition = 'none';
                ghost.style.opacity = '1';
                ghost.style.pointerEvents = 'none';
                ghost.style.zIndex = '99999';
                document.body.appendChild(ghost);
                if (typeof e.dataTransfer.setDragImage === 'function') {
                    e.dataTransfer.setDragImage(ghost, 28, 28);
                }
                setTimeout(() => {
                    if (ghost.parentNode) ghost.remove();
                }, 0);
            }

            // Chỉ làm mờ ô gốc, không display:none và không delay transition
            dragTarget.classList.add('is-dragging', 'dragging');
            document.body.classList.add('is-item-dragging');

            // Ẩn tooltip khi bắt đầu kéo
            safeHideItemTooltip();
            hideCustomContextMenu();
        });

        // Kéo qua vùng thả (dragover) - không re-render, chỉ đổi class khi đổi ô đích
        document.addEventListener('dragover', (e) => {
            if (!currentDragItem) return;

            const equipSlotDropzone = e.target.closest('.equip-slot, .rpg-equip-slot, [data-drop-zone="equipment"]');
            const characterDropzone = !equipSlotDropzone ? resolveCharacterDropTarget(e.target) : null;
            const inventoryDropzone = e.target.closest('#rpg-inventory-grid, .inventory-grid, [data-drop-zone="inventory"]');

            if (equipSlotDropzone) {
                const targetSlot = equipSlotDropzone.dataset.slot;
                const dragSlot = resolveItemSlot(currentDragItem.slot, currentDragItem.itemType);
                const canEquip = Boolean(dragSlot && dragSlot === targetSlot);

                if (canEquip) {
                    e.preventDefault();
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                    setDropTargetHighlight(equipSlotDropzone);
                } else {
                    setDropTargetHighlight(null);
                }
            } else if (characterDropzone && !currentDragItem.isEquipped) {
                const dragSlot = resolveItemSlot(currentDragItem.slot, currentDragItem.itemType);
                if (dragSlot) {
                    e.preventDefault();
                    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                    setDropTargetHighlight(characterDropzone);
                } else {
                    setDropTargetHighlight(null);
                }
            } else if (inventoryDropzone && currentDragItem.isEquipped) {
                e.preventDefault();
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
                setDropTargetHighlight(inventoryDropzone);
            } else {
                setDropTargetHighlight(null);
            }
        });

        // Rời khỏi vùng thả (dragleave)
        document.addEventListener('dragleave', (e) => {
            if (!currentDropTarget) return;
            const zoneContainer = currentDropTarget.closest('[data-drop-zone="character"]') || currentDropTarget;
            if (!e.relatedTarget || !zoneContainer.contains(e.relatedTarget)) {
                setDropTargetHighlight(null);
            }
        });

        // Kết thúc kéo (dragend)
        document.addEventListener('dragend', () => {
            cleanupDragState();
        });

        // Thả vật phẩm (drop)
        document.addEventListener('drop', (e) => {
            if (!currentDragItem) {
                cleanupDragState();
                return;
            }

            const dragSnapshot = currentDragItem;
            const equipSlotDropzone = e.target.closest('.equip-slot, .rpg-equip-slot, [data-drop-zone="equipment"]');
            const characterDropzone = !equipSlotDropzone ? resolveCharacterDropTarget(e.target) : null;
            const inventoryDropzone = e.target.closest('#rpg-inventory-grid, .inventory-grid, [data-drop-zone="inventory"]');

            cleanupDragState();

            // Thả vào ô trang bị
            if (equipSlotDropzone) {
                e.preventDefault();
                const targetSlot = equipSlotDropzone.dataset.slot;
                const item = getItemFromState(dragSnapshot.itemId);
                const itemSlot = item ? resolveItemSlot(item.slot, item.type) : '';

                if (item && itemSlot === targetSlot) {
                    equipItem(item.id);
                } else if (item) {
                    if (typeof addLog === 'function') {
                        addLog(`⚠️ [Không Khớp Vị Trí] [${item.name}] thuộc ô ${SLOT_LABELS[itemSlot] || itemSlot}, không thể trang bị vào ô ${SLOT_LABELS[targetSlot] || targetSlot}!`, 'text-rose-400');
                    }
                    if (typeof playSound === 'function') playSound('bell');
                }
            }
            // Thả vào ô nhân vật -> Tự động nhận diện vị trí và trang bị
            else if (characterDropzone && !dragSnapshot.isEquipped) {
                e.preventDefault();
                const item = getItemFromState(dragSnapshot.itemId);
                const itemSlot = item ? resolveItemSlot(item.slot, item.type) : '';

                if (item && itemSlot) {
                    equipItem(item.id);
                } else if (item) {
                    if (typeof addLog === 'function') {
                        addLog(`⚠️ [${item.name}] không phải trang bị, không thể mặc lên nhân vật!`, 'text-rose-400');
                    }
                    if (typeof playSound === 'function') playSound('bell');
                }
            }
            // Thả vào túi đồ (để tháo)
            else if (inventoryDropzone && dragSnapshot.isEquipped) {
                e.preventDefault();
                unequipItem(dragSnapshot.slot || dragSnapshot.itemId);
            }
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
            if (item.equipped || target.closest('.equip-slot, .rpg-equip-slot, [data-drop-zone="equipment"]')) {
                unequipItem(item.slot || item.id);
            }
            // Nếu trong túi đồ -> Tự động mặc (nếu là trang bị) hoặc phục dụng (nếu là đan dược)
            else {
                if (resolveItemSlot(item.slot, item.type)) {
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

            const itemId = target.dataset.itemId;
            const item = getItemFromState(itemId);
            if (!item) {
                hideCustomContextMenu();
                return;
            }

            e.preventDefault();
            safeHideItemTooltip();
            hideCustomContextMenu();

            // Trang bị: Click chuột phải mặc / tháo ngay lập tức
            if (isEquipmentItem(item, target)) {
                if (item.equipped || target.closest('.equip-slot, .rpg-equip-slot, [data-drop-zone="equipment"]')) {
                    unequipItem(item.slot || item.id);
                } else {
                    equipItem(item.id);
                }
                return;
            }

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
