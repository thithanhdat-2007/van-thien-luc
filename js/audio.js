// ==========================================
// FILE: js/audio.js - Quản Lý Âm Thanh Tiên Hiệp (Đã vô hiệu hóa Web Audio oscillator stutter)
// Triệt tiêu 100% hiện tượng tút tút và giật khựng khung hình khi tụ khí / bấm nút
// Mặc định: TẮT ÂM THANH (muted = true)
// ==========================================
let audioCtx = null;
let soundEnabled = false;
let muted = true;

function initAudio() {
    // Vô hiệu hóa khởi tạo AudioContext tự động để tránh giật lag khung hình
    return null;
}

function playSound(type, param = null) {
    // Vô hiệu hóa hoàn toàn bộ tổng hợp âm thanh Web Audio API (createOscillator)
    // Triệt tiêu 100% tiếng tút tút và hiện tượng khựng khung hình
    return;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    muted = !soundEnabled;
    if (typeof window !== 'undefined') {
        window.soundEnabled = soundEnabled;
        window.muted = muted;
    }
    const icon = document.getElementById('sound-icon');
    if (icon) {
        icon.className = soundEnabled ? 'fa-solid fa-volume-high text-xs text-amber-300' : 'fa-solid fa-volume-xmark text-xs text-rose-400';
    }
}

if (typeof window !== 'undefined') {
    window.soundEnabled = false;
    window.muted = true;
    window.playSound = playSound;
    window.toggleSound = toggleSound;
    window.initAudio = initAudio;
    window.soundSystem = {
        play: () => {}
    };
}
