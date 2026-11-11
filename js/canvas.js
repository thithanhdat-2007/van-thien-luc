// ==========================================
// FILE: js/canvas.js - Hiệu ứng Hạt Linh Khí Ngũ Hành & Lôi Kiếp Chấn Động 60FPS
// ==========================================
const canvas = (typeof document !== 'undefined') ? document.getElementById('qi-canvas') : null;
const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
let particles = [];
let fireflies = [];
let clickRunes = [];
let swordSlashes = [];
let shockwaves = [];
let lightningBolts = [];
let nextRootArcAt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + 2000;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth || 800;
    canvas.height = window.innerHeight || 600;
}
if (typeof window !== 'undefined') {
    window.addEventListener('resize', resizeCanvas);
}
resizeCanvas();

function getDominantElementConfig() {
    if (typeof state === 'undefined' || typeof ELEMENTAL_PILLARS === 'undefined') {
        return null;
    }
    return ELEMENTAL_PILLARS[state.activeElement || 'metal'] || RARE_LINH_CAN_BRANCHES[state.activeElement] || null;
}

function getCurrentRootVisual() {
    if (typeof state === 'undefined' || typeof SPIRITUAL_ROOTS === 'undefined') return null;
    return SPIRITUAL_ROOTS[state.spiritualRoot?.id] || SPIRITUAL_ROOTS.mortal_mixed || null;
}

let cachedDantianX = null;
let cachedDantianY = null;
let lastDantianCheck = 0;

function getDantianCoords() {
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - lastDantianCheck > 1200 || cachedDantianX === null) {
        lastDantianCheck = now;
        const core = document.getElementById('dantian-core');
        if (core && canvas) {
            const coreRect = core.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            cachedDantianX = (coreRect.left + coreRect.width / 2) - canvasRect.left;
            cachedDantianY = (coreRect.top + coreRect.height / 2) - canvasRect.top;
        } else {
            cachedDantianX = canvas ? canvas.width / 2 : 400;
            cachedDantianY = canvas ? canvas.height / 2 : 300;
        }
    }
    return { x: cachedDantianX, y: cachedDantianY };
}

class QiParticle {
    constructor() {
        this.reset();
    }
    reset() {
        const angle = Math.random() * Math.PI * 2;
        const dist = 140 + Math.random() * (Math.max(canvas.width, canvas.height) * 0.48);
        this.x = canvas.width / 2 + Math.cos(angle) * dist;
        this.y = canvas.height / 2 + Math.sin(angle) * dist;
        this.prevX = this.x;
        this.prevY = this.y;
        this.size = 1.2 + Math.random() * 2.4;
        this.speed = 0.65 + Math.random() * 1.45;
        this.alpha = 0.25 + Math.random() * 0.65;
        this.isGold = Math.random() > 0.65;
        this.swirlFactor = (Math.random() - 0.5) * 0.6;
        this.isBurst = false;
    }
    update() {
        this.prevX = this.x;
        this.prevY = this.y;

        const target = getDantianCoords();
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 18) {
            if (this.isBurst) {
                this.alpha = 0;
            } else {
                if (Math.random() < 0.08 && typeof spawnRipple === 'function') {
                    spawnRipple(target.x, target.y, this.isGold ? '#facc15' : '#22d3ee');
                }
                this.reset();
            }
        } else {
            const nx = dx / distance;
            const ny = dy / distance;
            // Chuyển động xoáy nhẹ vào đan điền
            this.x += (nx - ny * this.swirlFactor) * this.speed;
            this.y += (ny + nx * this.swirlFactor) * this.speed;
        }
    }
    draw() {
        const rootVisual = getCurrentRootVisual();
        const domEl = getDominantElementConfig();
        const bg = (typeof BACKGROUNDS !== 'undefined' && typeof state !== 'undefined') ? BACKGROUNDS[state.bgIndex] : null;

        let primaryColor, secondaryColor;
        if (rootVisual?.colors) {
            primaryColor = rootVisual.colors[Math.floor(Math.random() * rootVisual.colors.length)];
            secondaryColor = rootVisual.colors[Math.floor(Math.random() * rootVisual.colors.length)];
        } else if (rootVisual) {
            primaryColor = rootVisual.primaryColor;
            secondaryColor = rootVisual.secondaryColor;
        } else if (domEl) {
            primaryColor = domEl.particleColor || domEl.color;
            secondaryColor = domEl.secondaryColor || domEl.color;
        } else if (bg) {
            primaryColor = bg.particleColor;
            secondaryColor = bg.secondaryColor;
        } else {
            primaryColor = "rgba(120, 113, 108, 0.85)";
            secondaryColor = "#b45309";
        }

        const color = this.isGold ? secondaryColor : primaryColor;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Shockwave {
    constructor(x, y, color = "#2dd4bf") {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.maxRadius = 85;
        this.alpha = 0.75;
        this.color = color;
    }
    update() {
        this.radius += 3.2;
        this.alpha *= 0.92;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class CanvasLightning {
    constructor(startX, startY, endX, endY, color = "#e0e7ff") {
        this.segments = [];
        this.alpha = 1.0;
        this.color = color;
        this.buildSegments(startX, startY, endX, endY);
    }
    buildSegments(x1, y1, x2, y2) {
        this.segments.push({ x: x1, y: y1 });
        const count = 12;
        const dx = (x2 - x1) / count;
        const dy = (y2 - y1) / count;
        let currX = x1;
        let currY = y1;
        for (let i = 1; i < count; i++) {
            currX += dx + (Math.random() - 0.5) * 45;
            currY += dy;
            this.segments.push({ x: currX, y: currY });
        }
        this.segments.push({ x: x2, y: y2 });
    }
    update() {
        this.alpha *= 0.85;
    }
    draw() {
        if (this.alpha <= 0.05) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#a855f7";
        ctx.beginPath();
        for (let i = 0; i < this.segments.length; i++) {
            const p = this.segments[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        // Lớp lõi trắng rực
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.restore();
    }
}

function triggerCanvasLightning(targetX = canvas.width / 2, targetY = canvas.height / 2 - 10, color = "#e0e7ff", skipScreenShake = false) {
    const startX = targetX + (Math.random() - 0.5) * 220;
    const startY = 0;
    lightningBolts.push(new CanvasLightning(startX, startY, targetX, targetY, color));
    if (!skipScreenShake && !(typeof cutsceneState !== 'undefined' && cutsceneState?.inProgress)) {
        triggerScreenShake(450);
    }
}

function triggerScreenShake(duration = 450) {
    if (typeof triggerSoftTribulation === 'function') {
        triggerSoftTribulation();
    }
}

// ==========================================
// HIỆU ỨNG 1: ĐOM ĐÓM TIÊN CẢNH (AMBIENT FIREFLIES / SPIRIT MOTHS)
// ==========================================
class AmbientFirefly {
    constructor() {
        this.reset(true);
    }
    reset(initial = false) {
        this.x = Math.random() * (canvas ? canvas.width : window.innerWidth);
        this.y = initial ? Math.random() * (canvas ? canvas.height : window.innerHeight) : (canvas ? canvas.height + 20 : window.innerHeight + 20);
        this.size = 1.3 + Math.random() * 2.2;
        this.baseSpeedX = (Math.random() - 0.5) * 0.45;
        this.baseSpeedY = -0.35 - Math.random() * 0.65;
        this.phase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.02 + Math.random() * 0.03;
        this.alpha = 0;
        this.maxAlpha = 0.4 + Math.random() * 0.55;
    }
    update() {
        this.phase += this.pulseSpeed;
        this.alpha = Math.max(0, Math.sin(this.phase)) * this.maxAlpha;
        this.x += this.baseSpeedX + Math.sin(this.phase * 0.7) * 0.45;
        this.y += this.baseSpeedY;

        if (this.y < -30 || (canvas && (this.x < -30 || this.x > canvas.width + 30))) {
            this.reset();
        }
    }
    draw() {
        if (this.alpha <= 0.02) return;
        const rootVisual = getCurrentRootVisual();
        const color = rootVisual?.primaryColor || "#5eead4";

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 14;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// HIỆU ỨNG 2: CLICK PHÙ ẤN ĐẠO GIA (INTERACTIVE TAOIST RUNE BURST)
// ==========================================
class ClickRuneEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.maxRadius = 45;
        this.alpha = 1.0;
        this.angle = Math.random() * Math.PI;
        this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * 0.04;
        this.color = Math.random() > 0.5 ? "#fde047" : "#2dd4bf";
        this.sparks = [];
        const sparkCount = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < sparkCount; i++) {
            const spkAngle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
            const spkSpeed = 1.8 + Math.random() * 2.5;
            this.sparks.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(spkAngle) * spkSpeed,
                vy: Math.sin(spkAngle) * spkSpeed,
                size: 1.2 + Math.random() * 1.8,
                alpha: 1.0
            });
        }
    }
    update() {
        this.radius += (this.maxRadius - this.radius) * 0.14;
        this.angle += this.rotSpeed;
        this.alpha *= 0.91;
        this.sparks.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.94;
            s.vy *= 0.94;
            s.alpha *= 0.89;
        });
    }
    draw() {
        if (this.alpha <= 0.03) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(this.radius * 0.45, 0);
            ctx.lineTo(this.radius * 0.95, 0);
            ctx.stroke();
        }
        ctx.restore();

        this.sparks.forEach(s => {
            if (s.alpha > 0.05) {
                ctx.globalAlpha = s.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        ctx.restore();
    }
}

// ==========================================
// HIỆU ỨNG 3: VẾT CHÉM KIẾM KHÍ (SWORD SLASH ARC)
// ==========================================
class SwordSlashArc {
    constructor(x, y, angle = 0, color = "#2dd4bf") {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.color = color;
        this.alpha = 1.0;
        this.length = 75 + Math.random() * 35;
    }
    update() {
        this.alpha *= 0.82;
    }
    draw() {
        if (this.alpha <= 0.03) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 16;
        ctx.shadowColor = this.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.arc(0, 0, this.length, -Math.PI * 0.35, Math.PI * 0.35);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.restore();
    }
}

function spawnClickRune(x, y) {
    if (clickRunes.length < 25) {
        clickRunes.push(new ClickRuneEffect(x, y));
    }
}

function triggerSwordSlash(x = (canvas ? canvas.width : 800) / 2, y = (canvas ? canvas.height : 600) / 2, angle = Math.random() * Math.PI * 2, color = "#2dd4bf") {
    if (!canvas || !ctx) return;
    swordSlashes.push(new SwordSlashArc(x, y, angle, color));
}

function triggerBreakthroughBurst(x = (canvas ? canvas.width : 800) / 2, y = (canvas ? canvas.height : 600) / 2) {
    if (!canvas || !ctx) return;
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            shockwaves.push(new Shockwave(x, y, i % 2 === 0 ? "#fde047" : "#2dd4bf"));
        }, i * 160);
    }
    for (let j = 0; j < 35; j++) {
        const p = new QiParticle();
        p.x = x;
        p.y = y;
        p.speed = 3.5 + Math.random() * 5.5;
        p.size = 2.0 + Math.random() * 3.0;
        particles.push(p);
    }
}

if (typeof window !== 'undefined') {
    // Click rune trên canvas đã chuyển sang hệ thống click effect DOM căn giữa tuyệt đối
    // window.addEventListener('pointerdown', ...);
}

if (canvas && ctx) {
    for (let i = 0; i < 70; i++) {
        particles.push(new QiParticle());
    }

    for (let i = 0; i < 28; i++) {
        fireflies.push(new AmbientFirefly());
    }
}

function animateCanvas() {
    if (document.body?.classList.contains('tower-v4-active')) {
        requestAnimationFrame(animateCanvas);
        return;
    }
    if (!canvas || !ctx) {
        if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(animateCanvas);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ đom đóm tiên cảnh
    fireflies.forEach(f => {
        f.update();
        f.draw();
    });

    // Vẽ hạt linh khí
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Vẽ sóng xung kích
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        shockwaves[i].update();
        shockwaves[i].draw();
        if (shockwaves[i].alpha < 0.03) {
            shockwaves.splice(i, 1);
        }
    }

    // Vẽ vết chém kiếm khí
    for (let i = swordSlashes.length - 1; i >= 0; i--) {
        swordSlashes[i].update();
        swordSlashes[i].draw();
        if (swordSlashes[i].alpha < 0.03) {
            swordSlashes.splice(i, 1);
        }
    }

    // Vẽ click runes
    for (let i = clickRunes.length - 1; i >= 0; i--) {
        clickRunes[i].update();
        clickRunes[i].draw();
        if (clickRunes[i].alpha < 0.03) {
            clickRunes.splice(i, 1);
        }
    }

    // Vẽ lôi điện
    for (let i = lightningBolts.length - 1; i >= 0; i--) {
        lightningBolts[i].update();
        lightningBolts[i].draw();
        if (lightningBolts[i].alpha < 0.05) {
            lightningBolts.splice(i, 1);
        }
    }

    const now = performance.now();
    if (getCurrentRootVisual()?.id === 'mutant_thunder' && now >= nextRootArcAt) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const offset = 70 + Math.random() * 75;
        lightningBolts.push(new CanvasLightning(centerX - offset, centerY - 25, centerX + offset, centerY + 15, '#c084fc'));
        if (Math.random() > 0.45) lightningBolts.push(new CanvasLightning(centerX + 45, centerY - offset, centerX - 25, centerY + offset, '#38bdf8'));
        nextRootArcAt = now + 2000 + Math.random() * 1000;
    }
    requestAnimationFrame(animateCanvas);
}

// ==========================================
// CANVAS EFFECT ENGINE (VFX CHO ĐỘ KIẾP & CHIẾN ĐẤU)
// ==========================================
class CanvasEffectEngine {
    constructor(primaryCanvasId = 'vfx-canvas') {
        this.primaryCanvasId = primaryCanvasId;
        this.canvas = null;
        this.ctx = null;
        this.damageTexts = [];
        this.lightningStrikes = [];
        this.ripples = [];
        this.isRunning = false;
        this.rafId = null;

        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.resize());
        }
    }

    getCanvas() {
        if (typeof document === 'undefined') return null;
        
        // 1. Kiểm tra màn hình Độ Kiếp
        const tribOverlay = document.getElementById('tribulation-cutscene-overlay');
        if (tribOverlay && !tribOverlay.classList.contains('hidden')) {
            const c = document.getElementById('vfx-canvas');
            if (c) {
                if (this.canvas !== c) { this.canvas = c; this.ctx = c.getContext('2d'); this.resize(); }
                return this.canvas;
            }
        }

        // 2. Kiểm tra màn hình Chiến Đấu Bí Cảnh
        const combatBackdrop = document.getElementById('center-modal-backdrop');
        if (combatBackdrop && !combatBackdrop.classList.contains('hidden')) {
            const c = document.getElementById('combat-vfx-canvas') || document.getElementById('vfx-canvas');
            if (c) {
                if (this.canvas !== c) { this.canvas = c; this.ctx = c.getContext('2d'); this.resize(); }
                return this.canvas;
            }
        }

        // 3. Canvas mặc định
        const defaultCanvas = document.getElementById(this.primaryCanvasId) 
            || document.getElementById('vfx-canvas') 
            || document.getElementById('global-vfx-canvas');

        if (defaultCanvas && this.canvas !== defaultCanvas) {
            this.canvas = defaultCanvas;
            this.ctx = defaultCanvas.getContext('2d');
            this.resize();
        }

        return this.canvas;
    }

    resize() {
        const c = this.canvas;
        if (!c) return;
        const rect = c.getBoundingClientRect();
        const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const width = rect.width || c.parentElement?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
        const height = rect.height || c.parentElement?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 600);
        
        if (c.width !== Math.floor(width * dpr) || c.height !== Math.floor(height * dpr)) {
            c.width = Math.floor(width * dpr);
            c.height = Math.floor(height * dpr);
        }
        if (this.ctx) {
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    startLoop() {
        if (this.isRunning) return;
        this.isRunning = true;
        const loop = (now) => {
            this.updateAndRender(now);
            const hasActiveEffects = this.damageTexts.length > 0 
                || this.lightningStrikes.length > 0 
                || this.ripples.length > 0;

            if (hasActiveEffects) {
                if (typeof requestAnimationFrame === 'function') {
                    this.rafId = requestAnimationFrame(loop);
                }
            } else {
                this.clear();
                this.isRunning = false;
                this.rafId = null;
            }
        };
        if (typeof requestAnimationFrame === 'function') {
            this.rafId = requestAnimationFrame(loop);
        }
    }

    clear() {
        const c = this.getCanvas();
        if (c && this.ctx) {
            const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
            this.ctx.clearRect(0, 0, c.width / dpr, c.height / dpr);
        }
    }

    // ==========================================
    // EFFECT 1: FLOATING DAMAGE TEXT (Chữ sát thương bay)
    // ==========================================
    spawnDamageText(x, y, amount, color = "#f43f5e") {
        this.getCanvas();
        let formattedText = typeof amount === 'number'
            ? (amount < 0 ? amount.toLocaleString('vi-VN') : `-${amount.toLocaleString('vi-VN')}`)
            : String(amount);

        this.damageTexts.push({
            x: Number(x) || 0,
            y: Number(y) || 0,
            text: formattedText,
            color: color || "#f43f5e",
            vx: (Math.random() - 0.5) * 1.8, // Vận tốc X ngẫu nhiên nảy nhẹ sang trái/phải
            vy: 2.2 + Math.random() * 0.8,   // Bay lên trên
            alpha: 1.0,
            startTime: performance.now(),
            duration: 1000 // Sau 1 giây thì xóa khỏi mảng render
        });

        this.startLoop();
    }

    // ==========================================
    // EFFECT 2: LIGHTNING STRIKE (Tia sét giáng trần)
    // ==========================================
    strikeLightning(startX, startY, endX, endY, color = "#38bdf8") {
        this.getCanvas();
        const segments = this.generateLightningBranches(startX, startY, endX, endY, 65, 5);
        this.lightningStrikes.push({
            segments,
            color: color || "#38bdf8",
            currentFrame: 0,
            totalFrames: 4, // Tồn tại trong 3-5 frames (rất nhanh)
            alpha: 1.0
        });

        this.startLoop();
    }

    generateLightningBranches(x1, y1, x2, y2, displace = 65, minDisplacement = 5) {
        if (displace < minDisplacement) {
            return [{ x1, y1, x2, y2 }];
        }
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displace;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * (displace * 0.35);
        return [
            ...this.generateLightningBranches(x1, y1, midX, midY, displace * 0.52, minDisplacement),
            ...this.generateLightningBranches(midX, midY, x2, y2, displace * 0.52, minDisplacement)
        ];
    }

    // ==========================================
    // EFFECT 3: SHIELD RIPPLE (Sóng âm khi khiên chặn đòn)
    // ==========================================
    spawnRipple(x, y, color = "#22d3ee") {
        this.getCanvas();
        this.ripples.push({
            x: Number(x) || 0,
            y: Number(y) || 0,
            radius: 20,     // Bán kính r ban đầu
            maxRadius: 135, // Bán kính tăng dần
            lineWidth: 5.0, // lineWidth mỏng dần
            color: color || "#22d3ee",
            alpha: 1.0,     // globalAlpha giảm về 0 trong 0.5s
            startTime: performance.now(),
            duration: 500   // 0.5 giây
        });

        this.startLoop();
    }

    // ==========================================
    // RENDER LOOP
    // ==========================================
    updateAndRender(now) {
        const c = this.getCanvas();
        if (!c || !this.ctx) return;
        this.clear();
        const ctx = this.ctx;

        // 1. RENDER EFFECT 2: LIGHTNING STRIKE (Flash fade out 3-5 frames)
        for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
            const strike = this.lightningStrikes[i];
            strike.currentFrame++;
            strike.alpha = Math.max(0, 1 - (strike.currentFrame - 1) / strike.totalFrames);

            if (strike.alpha <= 0 || strike.currentFrame > strike.totalFrames) {
                this.lightningStrikes.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = strike.alpha;
            ctx.strokeStyle = strike.color;
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 20;
            ctx.shadowColor = strike.color;

            // Đường zig-zag
            ctx.beginPath();
            strike.segments.forEach((seg, idx) => {
                if (idx === 0) ctx.moveTo(seg.x1, seg.y1);
                ctx.lineTo(seg.x2, seg.y2);
            });
            ctx.stroke();

            // Lớp lõi trắng rực
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffffff';
            ctx.stroke();

            ctx.restore();
        }

        // 2. RENDER EFFECT 3: SHIELD RIPPLE (Sóng âm 0.5s)
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const ripple = this.ripples[i];
            const elapsed = now - ripple.startTime;
            const progress = Math.min(1, elapsed / ripple.duration);

            if (progress >= 1) {
                this.ripples.splice(i, 1);
                continue;
            }

            const r = ripple.radius + (ripple.maxRadius - ripple.radius) * Math.sin(progress * Math.PI / 2);
            const lw = Math.max(0.6, ripple.lineWidth * (1 - progress));
            const alpha = Math.max(0, 1 - progress);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = ripple.color;
            ctx.lineWidth = lw;
            ctx.shadowBlur = 18;
            ctx.shadowColor = ripple.color;

            ctx.beginPath();
            ctx.arc(ripple.x, ripple.y, r, 0, Math.PI * 2);
            ctx.stroke();

            // Vòng sóng âm chấn động phụ
            if (r > 35) {
                ctx.lineWidth = lw * 0.5;
                ctx.globalAlpha = alpha * 0.6;
                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, r * 0.8, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 3. RENDER EFFECT 1: FLOATING DAMAGE TEXT (1s)
        for (let i = this.damageTexts.length - 1; i >= 0; i--) {
            const dt = this.damageTexts[i];
            const elapsed = now - dt.startTime;

            if (elapsed >= dt.duration) {
                this.damageTexts.splice(i, 1);
                continue;
            }

            // Tọa độ Y giảm dần (bay lên), vận tốc X nảy nhẹ sang 2 bên
            dt.y -= dt.vy;
            dt.vy *= 0.96;
            dt.x += dt.vx;
            dt.alpha = Math.max(0, 1 - elapsed / dt.duration);

            ctx.save();
            ctx.globalAlpha = dt.alpha;
            ctx.font = '900 24px "Cinzel", ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Viền đen strokeText
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4.5;
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 2;
            ctx.strokeText(dt.text, dt.x, dt.y);

            // Chữ màu fillText
            ctx.fillStyle = dt.color;
            ctx.fillText(dt.text, dt.x, dt.y);

            ctx.restore();
        }
    }
}

const vfxEngine = new CanvasEffectEngine('vfx-canvas');

function spawnDamageText(x, y, amount, color = "#f43f5e") {
    vfxEngine.spawnDamageText(x, y, amount, color);
}

function strikeLightning(startX, startY, endX, endY, color = "#38bdf8") {
    vfxEngine.strikeLightning(startX, startY, endX, endY, color);
}

function spawnRipple(x, y, color = "#22d3ee") {
    vfxEngine.spawnRipple(x, y, color);
}

function triggerQiBurst(x, y) {
    if (!canvas || !ctx) return;
    const canvasRect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    const localX = (typeof x === 'number' && !isNaN(x)) ? (x - canvasRect.left) : (canvas.width / 2);
    const localY = (typeof y === 'number' && !isNaN(y)) ? (y - canvasRect.top) : (canvas.height / 2);

    if (typeof spawnRipple === 'function') {
        spawnRipple(localX, localY, '#22d3ee');
    }
    if (typeof Shockwave !== 'undefined') {
        shockwaves.push(new Shockwave(localX, localY, '#38bdf8'));
    }

    const burstCount = 24;
    for (let i = 0; i < burstCount; i++) {
        const p = new QiParticle();
        p.isBurst = true;
        const angle = (Math.PI * 2 / burstCount) * i + (Math.random() - 0.5) * 0.4;
        const burstDist = 25 + Math.random() * 45;
        p.x = localX + Math.cos(angle) * burstDist;
        p.y = localY + Math.sin(angle) * burstDist;
        p.prevX = localX;
        p.prevY = localY;
        p.speed = 1.8 + Math.random() * 2.2;
        p.size = 2.0 + Math.random() * 2.5;
        p.alpha = 0.85;
        p.isGold = Math.random() > 0.5;
        p.swirlFactor = (Math.random() - 0.5) * 1.1;
        particles.push(p);
    }

    if (particles.length > 120) {
        particles = particles.filter(p => !p.isBurst || p.alpha > 0.05);
    }
}

function triggerCameraTrauma(intensity = 1.0, targetId = 'game-viewport') {
    if (typeof window === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = document.getElementById(targetId) || document.getElementById('game-viewport') || document.body;
    if (!el) return;

    let trauma = Math.min(1.0, Math.max(0.1, intensity));
    const startTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const duration = 380;

    function shakeStep(now) {
        const elapsed = now - startTime;
        if (elapsed >= duration) {
            el.style.transform = '';
            el.style.filter = '';
            return;
        }

        const progress = elapsed / duration;
        const decay = Math.pow(1 - progress, 2);
        const shakeMag = trauma * 14 * decay;
        const angleMag = trauma * 1.2 * decay;

        const offsetX = (Math.random() * 2 - 1) * shakeMag;
        const offsetY = (Math.random() * 2 - 1) * shakeMag;
        const rotate = (Math.random() * 2 - 1) * angleMag;

        el.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0) rotate(${rotate.toFixed(2)}deg)`;

        if (elapsed < 120 && trauma > 0.5) {
            el.style.filter = `drop-shadow(-2px 0 rgba(244, 63, 94, 0.6)) drop-shadow(2px 0 rgba(56, 189, 248, 0.5))`;
        } else {
            el.style.filter = '';
        }

        requestAnimationFrame(shakeStep);
    }

    requestAnimationFrame(shakeStep);
}

if (typeof window !== 'undefined') {
    window.CanvasEffectEngine = CanvasEffectEngine;
    window.vfxEngine = vfxEngine;
    window.spawnDamageText = spawnDamageText;
    window.strikeLightning = strikeLightning;
    window.spawnRipple = spawnRipple;
    window.spawnClickRune = spawnClickRune;
    window.triggerSwordSlash = triggerSwordSlash;
    window.triggerBreakthroughBurst = triggerBreakthroughBurst;
    window.triggerQiBurst = triggerQiBurst;
    window.triggerCameraTrauma = triggerCameraTrauma;
}
