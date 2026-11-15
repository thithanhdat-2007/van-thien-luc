// ============================================================================
// FILE: js/audio.js — Âm Thanh Cổ Phong Tổng Hợp Nhẹ (Web Audio API Zero-Lag)
// Tắt mặc định (muted = true) cho đến khi Tu Sĩ bấm bật loa (#btn-sound)
// ============================================================================
let audioCtx = null;
let soundEnabled = false;
let muted = true;
const _lastSoundTime = Object.create(null);

function getOrCreateAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) {
        try {
            audioCtx = new AudioCtx();
        } catch (_) {
            return null;
        }
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

function initAudio() {
    if (!soundEnabled) return null;
    return getOrCreateAudioContext();
}

function scheduleTone(ctx, { freq = 660, endFreq = null, type = 'sine', delay = 0, duration = 0.25, gain = 0.08 }) {
    const startAt = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), startAt);
    if (endFreq && endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), startAt + duration);
    }

    env.gain.setValueAtTime(0.0001, startAt);
    env.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), startAt + 0.015);
    env.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(env);
    env.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
}

function playSound(type = 'bell', forcePlay = false) {
    if (!forcePlay && (!soundEnabled || muted)) return;
    const now = performance.now();
    const key = String(type || 'bell').toLowerCase();
    const minInterval = (key === 'breakthrough' || key === 'thunder') ? 180 : 75;
    if (_lastSoundTime[key] && (now - _lastSoundTime[key]) < minInterval) return;
    _lastSoundTime[key] = now;

    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    try {
        if (key === 'sword' || key === 'meditate' || key === 'crit') {
            // Tiếng kiếm ngân thanh sắc nhẹ
            scheduleTone(ctx, { freq: 1180, endFreq: 640, type: 'triangle', delay: 0, duration: 0.22, gain: 0.065 });
            scheduleTone(ctx, { freq: 1960, endFreq: 1320, type: 'sine', delay: 0.02, duration: 0.26, gain: 0.035 });
        } else if (key === 'breakthrough' || key === 'thunder' || key === 'levelup' || key === 'victory') {
            // Sấm rền & Kim quang ngũ cung thăng hoa
            scheduleTone(ctx, { freq: 125, endFreq: 52, type: 'sawtooth', delay: 0, duration: 0.38, gain: 0.07 });
            scheduleTone(ctx, { freq: 523.25, endFreq: 523.25, type: 'sine', delay: 0.03, duration: 0.34, gain: 0.06 });
            scheduleTone(ctx, { freq: 659.25, endFreq: 659.25, type: 'sine', delay: 0.09, duration: 0.34, gain: 0.055 });
            scheduleTone(ctx, { freq: 783.99, endFreq: 783.99, type: 'sine', delay: 0.15, duration: 0.38, gain: 0.055 });
            scheduleTone(ctx, { freq: 1046.5, endFreq: 1046.5, type: 'triangle', delay: 0.22, duration: 0.48, gain: 0.065 });
        } else if (key === 'fail' || key === 'defeat' || key === 'danger' || key === 'blood_thunder') {
            // Tiếng chuông trầm cảnh báo / ma khí
            scheduleTone(ctx, { freq: 210, endFreq: 132, type: 'triangle', delay: 0, duration: 0.30, gain: 0.07 });
            scheduleTone(ctx, { freq: 315, endFreq: 198, type: 'sine', delay: 0.04, duration: 0.28, gain: 0.04 });
        } else if (key === 'whoosh' || key === 'qi') {
            // Tiếng linh khí lưu chuyển
            scheduleTone(ctx, { freq: 420, endFreq: 780, type: 'sine', delay: 0, duration: 0.16, gain: 0.04 });
        } else {
            // Mặc định: Chuông ngọc thanh thúy (bell / ding / jade / holy_bell)
            scheduleTone(ctx, { freq: 880, endFreq: 880, type: 'sine', delay: 0, duration: 0.32, gain: 0.06 });
            scheduleTone(ctx, { freq: 1320, endFreq: 1318, type: 'triangle', delay: 0.015, duration: 0.28, gain: 0.032 });
            scheduleTone(ctx, { freq: 1760, endFreq: 1760, type: 'sine', delay: 0.04, duration: 0.24, gain: 0.022 });
        }
    } catch (_) {}
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
    const btn = document.getElementById('btn-sound');
    if (btn) {
        btn.setAttribute('aria-pressed', String(soundEnabled));
    }
    if (soundEnabled) {
        playSound('bell', true);
    }
}

if (typeof window !== 'undefined') {
    window.soundEnabled = false;
    window.muted = true;
    window.playSound = playSound;
    window.playBreakthroughSuccess = function () { playSound('breakthrough'); };
    window.toggleSound = toggleSound;
    window.initAudio = initAudio;
    window.soundSystem = {
        play: playSound
    };
}
