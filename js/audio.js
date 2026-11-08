// ==========================================
// FILE: js/audio.js - Bộ Tổng Hợp Âm Thanh Cổ Phong & Lôi Kiếp Đa Tần Web Audio API
// ==========================================
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type, param = null) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    if (type === 'qi') {
        // Tiếng chuông ngọc thanh thoát khi chạm đan điền
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        const notes = [528, 594, 660, 792, 880, 1056]; // Ngũ cung thanh nhã
        osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], now);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
    } 
    else if (type === 'bell') {
        // Chuông đồng thiền tịnh ngân dài
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(432, now);
        osc.frequency.exponentialRampToValueAtTime(864, now + 0.15);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.4);
    }
    else if (type === 'sword') {
        // Tiếng kiếm ngân rít gió xé không
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }
    else if (type === 'thunder') {
        // Tiếng sấm chớp cơ bản
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.9);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.95);
    }
    else if (type === 'tribulation_thunder') {
        // CỬU TIÊU LÔI KIẾP TRẦM HÙNG (Sub-bass drop + Noise crackle)
        const wave = param || 1;
        const duration = wave === 3 ? 1.8 : 1.2;
        const volume = wave === 3 ? 0.38 : 0.28;

        // 1. Sub-bass rầm rập
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(wave === 3 ? 180 : 130, now);
        subOsc.frequency.exponentialRampToValueAtTime(28, now + duration);
        subGain.gain.setValueAtTime(volume, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        subOsc.connect(subGain);
        subGain.connect(audioCtx.destination);
        subOsc.start(now);
        subOsc.stop(now + duration);

        // 2. White noise xé rách không gian (Lôi điện nổ giòn)
        const bufferSize = audioCtx.sampleRate * 0.45;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(3, now);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.9, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        whiteNoise.start(now);
    }
    else if (type === 'breakthrough_success') {
        // TIẾNG CHUÔNG TIÊN KHÁNH PHÁ CẢNH THÀNH CÔNG (Arpeggio ngũ cung thăng hoa)
        const chords = [528, 660, 792, 1056, 1320, 1584];
        chords.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.09, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.12 + 1.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 1.8);
        });
    }
    else if (type === 'element_upgrade') {
        // Âm hiệu kích hoạt ngũ hành
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(960, now + 0.35);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('sound-icon');
    if (icon) {
        icon.className = soundEnabled ? 'fa-solid fa-volume-high text-xs' : 'fa-solid fa-volume-xmark text-xs text-rose-400';
    }
}
