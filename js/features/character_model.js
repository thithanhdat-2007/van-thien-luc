(() => {
    'use strict';
    const character = document.getElementById('char-main-img');
    const dialog = document.createElement('dialog');
    dialog.className = 'game-settings';
    dialog.setAttribute('aria-labelledby', 'game-settings-title');
    dialog.innerHTML = '<header><h2 id="game-settings-title">Cài đặt</h2><button type="button" data-close aria-label="Đóng cài đặt">✕</button></header><section><h3>Hiển thị nhân vật</h3><label for="character-size">Kích thước nhân vật <output id="character-size-value"></output></label><input id="character-size" type="range" min="55" max="175" step="5"><button type="button" data-reset>Khôi phục kích thước</button></section><section><h3>Âm thanh và giao diện</h3><button type="button" data-sound>Bật / tắt âm thanh</button><button type="button" data-scene>Ngắm cảnh</button></section>';
    document.body.append(dialog);
    const slider = dialog.querySelector('input');
    let zoom = 100;
    try { zoom = JSON.parse(localStorage.getItem('van-thien-luc-character-model-2'))?.zoom || 100; } catch (_) {}
    function applySize(value) {
        const size = Math.max(55, Math.min(175, Number(value) || 100));
        slider.value = size;
        dialog.querySelector('output').textContent = size + '%';
        if (character) character.style.scale = String(size / 100);
        try { localStorage.setItem('van-thien-luc-character-model-2', JSON.stringify({zoom:size})); } catch (_) {}
    }
    applySize(zoom);
    slider.addEventListener('input', () => applySize(slider.value));
    dialog.querySelector('[data-reset]').addEventListener('click', () => applySize(100));
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-sound]').addEventListener('click', () => window.toggleSound());
    dialog.querySelector('[data-scene]').addEventListener('click', () => { dialog.close(); window.toggleImmersionMode(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    window.openGameSettings = () => { if (!dialog.open) dialog.showModal(); };
})();
