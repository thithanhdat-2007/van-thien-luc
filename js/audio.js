// ==========================================
// FILE: js/audio.js - Bộ Tổng Hợp Âm Thanh Cổ Phong & Lôi Kiếp Đa Tần Web Audio API
// Chuẩn Tiên Hiệp AAA: Không dùng file mp3 ngoài, 100% Procedural Synthesis Web Audio
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
    else if (type === 'whoosh') {
        // Tiếng xé gió, phất tay áo, thân pháp lướt đi (Filtered Bandpass Noise Sweep)
        const duration = 0.22;
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(1.8, now);
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(260, now + duration);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noiseSrc.start(now);
        noiseSrc.stop(now + duration);
    }
    else if (type === 'ding') {
        // Tiếng Ngọc Khánh (chime ngọc trong vắt ngân vang)
        const osc = audioCtx.createOscillator();
        const harm = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const harmGain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now); // A6
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.65);

        harm.type = 'sine';
        harm.frequency.setValueAtTime(3520, now); // A7 harmonic
        harmGain.gain.setValueAtTime(0.04, now);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        harm.connect(harmGain);
        gain.connect(audioCtx.destination);
        harmGain.connect(audioCtx.destination);

        osc.start(now);
        harm.start(now);
        osc.stop(now + 0.65);
        harm.stop(now + 0.35);
    }
    else if (type === 'guzheng') {
        // CỔ TRANH NGŨ CUNG (Traditional Pentatonic Guzheng String Pluck)
        // Thang âm ngũ cung: D4 (Cung), E4 (Thương), G4 (Giốc), A4 (Chủy), C5 (Vũ), D5 (Cao Cung)
        const scale = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
        let freq = scale[Math.floor(Math.random() * scale.length)];
        if (typeof param === 'number' && param >= 0 && param < scale.length) {
            freq = scale[param];
        }

        const osc = audioCtx.createOscillator();
        const harm = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        harm.type = 'sine';
        harm.frequency.setValueAtTime(freq * 2, now);

        // String pluck dynamic envelope: sharp attack (4ms) then natural acoustic ring & decay
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.04, now + 0.22);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.2);

        osc.connect(gain);
        harm.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        harm.start(now);
        osc.stop(now + 1.2);
        harm.stop(now + 0.8);
    }
    else if (type === 'victory') {
        // KHẢI HOÀN TIÊN KHÁNH (Triumphant Xianxia Fanfare: Chùm hợp âm ngũ cung thăng hoa)
        const chords = [
            { f: 523.25, t: 0 },    // C5
            { f: 659.25, t: 0.08 }, // E5
            { f: 783.99, t: 0.16 }, // G5
            { f: 880.00, t: 0.24 }, // A5
            { f: 1046.5, t: 0.32 }, // C6
            { f: 1318.5, t: 0.44 }  // E6 đỉnh cao
        ];
        chords.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.f, now + note.t);
            gain.gain.setValueAtTime(0.08, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.0006, now + note.t + 1.6);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + note.t);
            osc.stop(now + note.t + 1.6);
        });
    }
    else if (type === 'danger') {
        // SÁT KHÍ BÁT HOANG (Ominous Sub-bass tension drone + Binaural beating)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(54, now);
        osc2.frequency.setValueAtTime(58, now); // 4Hz beating pulse

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.1);
        osc2.stop(now + 1.1);
    }
    else if (type === 'fail') {
        // TẨU HỎA NHẬP MA / THẦN HỒN CHẤN ĐÃNG (Dissonant descending bend + Dull gong thump)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';
        // Minor 2nd dissonance gliding down
        osc1.frequency.setValueAtTime(330, now);
        osc1.frequency.exponentialRampToValueAtTime(95, now + 0.8);
        osc2.frequency.setValueAtTime(349, now);
        osc2.frequency.exponentialRampToValueAtTime(102, now + 0.8);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.linearRampToValueAtTime(120, now + 0.8);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.85);
        osc2.stop(now + 0.85);
    }
    else if (type === 'hit') {
        // VA CHẠM CƯỜNG KÍCH (Punchy thud + crisp impact transient)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    else if (type === 'break') {
        // PHÁ VỠ KẾT GIỚI / BÌNH CẢNH (Glassy crystal shatter)
        const duration = 0.35;
        const bufferSize = Math.floor(audioCtx.sampleRate * duration);
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2200, now);

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noiseSrc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        noiseSrc.start(now);
        noiseSrc.stop(now + duration);
    }
    else if (type === 'levelup') {
        // THĂNG CẤP BẬC CẢNH GIỚI (Cascading ascending chime)
        const notes = [587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);
            gain.gain.setValueAtTime(0.09, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.0006, now + idx * 0.07 + 0.9);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.9);
        });
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
        const bufferSize = Math.floor(audioCtx.sampleRate * 0.45);
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
        whiteNoise.stop(now + 0.45);
    }
    else if (type === 'breakthrough' || type === 'breakthrough_success') {
        // TIẾNG CHUÔNG TIÊN KHÁNH PHÁ CẢNH THÀNH CÔNG (Arpeggio ngũ cung thăng hoa)
        const bellBase = audioCtx.createOscillator();
        const bellGain = audioCtx.createGain();
        bellBase.type = 'triangle';
        bellBase.frequency.setValueAtTime(216, now);
        bellGain.gain.setValueAtTime(0.18, now);
        bellGain.gain.exponentialRampToValueAtTime(0.0005, now + 2.5);
        bellBase.connect(bellGain);
        bellGain.connect(audioCtx.destination);
        bellBase.start(now);
        bellBase.stop(now + 2.5);

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
    else if (type === 'forge_start' || type === 'forge' || type === 'anvil') {
        // TIẾNG BÚA RÈN ĐÚC BẰNG SẮT ĐỒNG (Metallic Anvil Impact & Bell Resonance)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }
    else if (type === 'forge_success') {
        // RÈN ĐÚC THẦN BINH ĐẠI THÀNH (Anvil strike + Ascending crystal resonance)
        playSound('forge_start');
        setTimeout(() => playSound('ding'), 120);
    }
    else if (type === 'pill' || type === 'pill_swallow') {
        // NUỐT ĐAN LINH DỊCH (Liquid bubble glide + jade resonance)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.22);
        gain.gain.setValueAtTime(0.10, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
    }
    else if (type === 'heartbeat') {
        // NHỊP ĐẬP TRÁI TIM NGUY CẤP (Dual Sub-bass lub-dub)
        [0, 0.18].forEach((offset, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(idx === 0 ? 60 : 48, now + offset);
            osc.frequency.exponentialRampToValueAtTime(30, now + offset + 0.14);
            gain.gain.setValueAtTime(0.26, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + 0.15);
        });
    }
    else if (type === 'auction_gavel') {
        // TIẾNG GÕ BÚA ĐẤU GIÁ (Impactful Wooden Gavel Strike)
        // 1. Transient click
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(800, now);
        clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
        clickGain.gain.setValueAtTime(0.2, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.04);

        // 2. Deep wooden body resonance
        const bodyOsc = audioCtx.createOscillator();
        const bodyGain = audioCtx.createGain();
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(220, now);
        bodyOsc.frequency.exponentialRampToValueAtTime(65, now + 0.35);
        bodyGain.gain.setValueAtTime(0.35, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(audioCtx.destination);
        bodyOsc.start(now);
        bodyOsc.stop(now + 0.38);
    }
    else if (type === 'auction_bid') {
        // TIẾNG RA GIÁ TIÊN NGỌC / LINH THẠCH (Sparkling Jade & Gold Chime)
        [880, 1174, 1568].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            const t = now + idx * 0.045;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.09, t);
            gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.35);
        });
    }
    else if (type === 'array_infuse') {
        // TIẾNG QUÁN CHÚ LINH KHÍ ĐẠI TRẬN (Celestial Spirit Vein Surge)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.45);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
    }
    else if (type === 'holy_bell') {
        // THANH TÂM ĐẠO CHUNG (Celestial Serene Bell - 528Hz Solfeggio Miracle Frequency)
        [528, 1056, 1584].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            const initGain = idx === 0 ? 0.28 : (idx === 1 ? 0.12 : 0.05);
            gain.gain.setValueAtTime(initGain, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 1.8);
        });
    }
    else if (type === 'blood_thunder') {
        // HUYẾT SÁT MA LÔI (Abyssal Blood Demon Thunder Burst)
        const osc = audioCtx.createOscillator();
        const sub = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        sub.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
        sub.frequency.setValueAtTime(70, now);
        sub.frequency.exponentialRampToValueAtTime(25, now + 0.7);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        osc.connect(gain);
        sub.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        sub.start(now);
        osc.stop(now + 0.75);
        sub.stop(now + 0.75);
    }
    else if (type === 'relic_chime') {
        // CỔ TU DI TÍCH LINH QUANG (Ancient Celestial Relic Chime)
        [659.25, 880, 1318.51, 1760].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            const t = now + idx * 0.07;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.55);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.55);
        });
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('sound-icon');
    if (icon) {
        icon.className = soundEnabled ? 'fa-solid fa-volume-high text-xs' : 'fa-solid fa-volume-xmark text-xs text-rose-400';
    }
}

if (typeof window !== 'undefined') {
    window.playSound = playSound;
    window.toggleSound = toggleSound;
    window.initAudio = initAudio;
    if (!window.soundSystem) {
        window.soundSystem = {
            play: (type, param) => playSound(type, param)
        };
    }
}
