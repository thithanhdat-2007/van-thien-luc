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
let qiBeams = [];
let lastBeamPulse = 0;
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

// Cấu hình bảng màu Hào Quang & Tụ Linh Trận theo 9 Đại Cảnh Giới
const REALM_FORMATION_THEMES = [
    { name: "Luyện Khí", primary: "#2dd4bf", secondary: "#0d9488", glow: "rgba(45, 212, 191, 0.75)", soft: "rgba(45, 212, 191, 0.28)", shadow: "rgba(45, 212, 191, 0.5)", aura: "rgba(45, 212, 191, 0.65)" },
    { name: "Trúc Cơ", primary: "#38bdf8", secondary: "#0284c7", glow: "rgba(56, 189, 248, 0.8)", soft: "rgba(56, 189, 248, 0.3)", shadow: "rgba(56, 189, 248, 0.55)", aura: "rgba(56, 189, 248, 0.7)" },
    { name: "Kim Đan", primary: "#facc15", secondary: "#d97706", glow: "rgba(250, 204, 21, 0.85)", soft: "rgba(250, 204, 21, 0.32)", shadow: "rgba(250, 204, 21, 0.6)", aura: "rgba(250, 204, 21, 0.75)" },
    { name: "Nguyên Anh", primary: "#c084fc", secondary: "#7e22ce", glow: "rgba(192, 132, 252, 0.85)", soft: "rgba(192, 132, 252, 0.32)", shadow: "rgba(192, 132, 252, 0.6)", aura: "rgba(192, 132, 252, 0.75)" },
    { name: "Hóa Thần", primary: "#fb7185", secondary: "#e11d48", glow: "rgba(251, 113, 133, 0.9)", soft: "rgba(251, 113, 133, 0.35)", shadow: "rgba(244, 63, 94, 0.65)", aura: "rgba(251, 113, 133, 0.8)" },
    { name: "Luyện Hư", primary: "#a855f7", secondary: "#6b21a8", glow: "rgba(168, 85, 247, 0.9)", soft: "rgba(168, 85, 247, 0.35)", shadow: "rgba(168, 85, 247, 0.65)", aura: "rgba(168, 85, 247, 0.8)" },
    { name: "Hợp Thể", primary: "#34d399", secondary: "#059669", glow: "rgba(52, 211, 153, 0.95)", soft: "rgba(52, 211, 153, 0.38)", shadow: "rgba(52, 211, 153, 0.7)", aura: "rgba(52, 211, 153, 0.85)" },
    { name: "Đại Thừa", primary: "#fbbf24", secondary: "#b45309", glow: "rgba(251, 191, 36, 1.0)", soft: "rgba(251, 191, 36, 0.4)", shadow: "rgba(251, 191, 36, 0.75)", aura: "rgba(251, 191, 36, 0.9)" },
    { name: "Độ Kiếp", primary: "#e879f9", secondary: "#9333ea", glow: "rgba(232, 121, 249, 1.0)", soft: "rgba(232, 121, 249, 0.42)", shadow: "rgba(232, 121, 249, 0.8)", aura: "rgba(232, 121, 249, 0.95)" }
];

function getRealmFormationTheme(targetState) {
    const s = targetState || (typeof state !== 'undefined' ? state : (typeof GameState !== 'undefined' ? GameState._rawState : null));
    const realmIndex = Number(s?.realmIndex) || 0;
    const realms = (typeof window !== 'undefined' && window.REALMS) || [];
    const rObj = realms[realmIndex] || {};
    const majorIdx = rObj.majorIndex !== undefined ? rObj.majorIndex : Math.floor(realmIndex / 4);
    return REALM_FORMATION_THEMES[Math.min(majorIdx, REALM_FORMATION_THEMES.length - 1)] || REALM_FORMATION_THEMES[0];
}

let lastAppliedMajorIdx = -1;
function updateFormationRealmTheme(targetState, force = false) {
    const s = targetState || (typeof state !== 'undefined' ? state : (typeof GameState !== 'undefined' ? GameState._rawState : null));
    const realmIndex = Number(s?.realmIndex) || 0;
    const realms = (typeof window !== 'undefined' && window.REALMS) || [];
    const rObj = realms[realmIndex] || {};
    const majorIdx = rObj.majorIndex !== undefined ? rObj.majorIndex : Math.floor(realmIndex / 4);
    
    if (!force && lastAppliedMajorIdx === majorIdx) return;
    lastAppliedMajorIdx = majorIdx;

    const theme = REALM_FORMATION_THEMES[Math.min(majorIdx, REALM_FORMATION_THEMES.length - 1)] || REALM_FORMATION_THEMES[0];
    const root = (typeof document !== 'undefined') ? document.documentElement : null;
    if (root) {
        root.style.setProperty('--realm-tran-primary', theme.primary);
        root.style.setProperty('--realm-tran-secondary', theme.secondary);
        root.style.setProperty('--realm-tran-glow', theme.glow);
        root.style.setProperty('--realm-tran-soft', theme.soft);
        root.style.setProperty('--realm-tran-shadow', theme.shadow);
        root.style.setProperty('--realm-aura-color', theme.aura);
        root.style.setProperty('--realm-aura-soft', theme.soft);
    }
}
if (typeof window !== 'undefined') {
    window.REALM_FORMATION_THEMES = REALM_FORMATION_THEMES;
    window.getRealmFormationTheme = getRealmFormationTheme;
    window.updateFormationRealmTheme = updateFormationRealmTheme;
    // Khởi tạo màu hào quang ban đầu
    setTimeout(() => updateFormationRealmTheme(null, true), 100);
}

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
    // Cache ngắn 40ms để bám sát chuyển động lơ lửng 60FPS của nhân vật
    if (now - lastDantianCheck > 40 || cachedDantianX === null) {
        lastDantianCheck = now;
        const charImg = document.getElementById('char-main-img');
        const tranEl = document.getElementById('tu-linh-tran-3d');
        if (tranEl && canvas) {
            const rect = tranEl.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            // Tọa độ đích đặt chính giữa đĩa Tụ Linh Trận dưới chân nhân vật
            cachedDantianX = (rect.left + rect.width * 0.5) - canvasRect.left;
            cachedDantianY = (rect.top + rect.height * 0.55) - canvasRect.top;
        } else if (charImg && canvas) {
            const imgRect = charImg.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            // Đáy ảnh nhân vật / đệm ngồi dưới chân, tuyệt đối không chạm trán hay mặt
            cachedDantianX = (imgRect.left + imgRect.width * 0.5) - canvasRect.left;
            cachedDantianY = (imgRect.bottom - 12) - canvasRect.top;
        } else {
            cachedDantianX = canvas ? canvas.width / 2 : 400;
            cachedDantianY = canvas ? canvas.height * 0.65 : 450;
        }
    }
    return { x: cachedDantianX, y: cachedDantianY };
}

function getFormationDiskCoords() {
    const tranEl = document.getElementById('tu-linh-tran-3d');
    const charImg = document.getElementById('char-main-img');
    const dantian = getDantianCoords();
    if (tranEl && canvas) {
        const rect = tranEl.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        return {
            x: (rect.left + rect.width / 2) - canvasRect.left,
            y: (rect.top + rect.height * 0.55) - canvasRect.top,
            radiusX: rect.width * 0.46,
            radiusY: rect.height * 0.2
        };
    } else if (charImg && canvas) {
        const rect = charImg.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        return {
            x: (rect.left + rect.width / 2) - canvasRect.left,
            y: (rect.bottom - 18) - canvasRect.top,
            radiusX: rect.width * 0.45,
            radiusY: rect.height * 0.16
        };
    }
    return {
        x: dantian.x,
        y: dantian.y,
        radiusX: 180,
        radiusY: 55
    };
}

class QiParticle {
    constructor() {
        this.reset();
    }
    reset() {
        // Hạt linh khí: 100% bay nhẹ tự nhiên theo gió nền toàn màn hình
        this.isWind = true;
        this.x = Math.random() * (canvas ? canvas.width : 800);
        this.y = Math.random() * (canvas ? canvas.height : 600);
        this.vx = 0.35 + Math.random() * 0.65; // Gió thổi ngang nhẹ nhàng
        this.vy = (Math.random() - 0.5) * 0.35;

        this.prevX = this.x;
        this.prevY = this.y;
        this.size = 1.0 + Math.random() * 1.5;
        this.speed = 0.45 + Math.random() * 0.55;
        this.alpha = 0.2 + Math.random() * 0.35;
        this.isGold = Math.random() > 0.5;
        // Chuẩn hóa màu Linh Khí: Xanh ngọc (#22d3ee, #2dd4bf) và Vàng kim (#facc15, #fbbf24)
        this.color = this.isGold 
            ? (Math.random() > 0.4 ? '#facc15' : '#fbbf24') 
            : (Math.random() > 0.4 ? '#22d3ee' : '#2dd4bf');
        this.swirlFactor = 0;
        this.isBurst = false;
    }
    update() {
        this.prevX = this.x;
        this.prevY = this.y;

        // TUYỆT ĐỐI BẢO VỆ VÙNG MẶT VÀ TRÁN NHÂN VẬT:
        // Đẩy toàn bộ hạt chệch ra xa vùng trán và khuôn mặt
        const charImg = document.getElementById('char-main-img');
        if (charImg && canvas) {
            const imgRect = charImg.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const headCenterX = (imgRect.left + imgRect.width * 0.5) - canvasRect.left;
            const headCenterY = (imgRect.top + imgRect.height * 0.3) - canvasRect.top;
            const distHead = Math.hypot(this.x - headCenterX, this.y - headCenterY);
            if (distHead < 95) {
                // Đẩy dạt sang 2 bên và hướng xuống dưới
                this.x += (this.x >= headCenterX ? 2.5 : -2.5);
                this.y += 1.5;
            }
        }

        // Chuyển động gió ngang êm dịu toàn màn hình
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        if (canvas && (this.x > canvas.width + 30 || this.x < -30 || this.y > canvas.height + 30 || this.y < -30)) {
            this.reset();
        }
    }
    draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

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

// ==========================================================================
// DẢI HẠT LINH KHÍ BEZIER HỘI TỤ TẠI ĐĨA TRẬN PHÁP DƯỚI CHÂN (FORMATION DISK)
// Tuyệt đối không bay vào mặt/đầu nhân vật
// ==========================================================================
class QiBezierStream {
    constructor() {
        const disk = getFormationDiskCoords();
        const target = getDantianCoords(); // Đáy đĩa chân trận pháp #tu-linh-tran-3d

        // Xuất phát từ rìa ngoài đĩa tụ linh dưới chân
        const angle = Math.random() * Math.PI * 2;
        const radScale = 0.75 + Math.random() * 0.55;
        const startX = disk.x + Math.cos(angle) * disk.radiusX * radScale;
        const startY = disk.y + Math.sin(angle) * disk.radiusY * radScale;

        this.p0 = { x: startX, y: startY };
        this.p3 = { x: target.x, y: target.y };

        // Điểm uốn cong nằm hoàn toàn ở đĩa năng lượng chân trận pháp
        const midX = (startX + target.x) / 2 + (Math.random() - 0.5) * 25;
        const midY = (startY + target.y) / 2 + (Math.random() - 0.5) * 12;

        this.p1 = { x: midX, y: midY };
        this.p2 = { x: (midX + target.x) / 2, y: (midY + target.y) / 2 };

        this.t = 0;
        this.baseSpeed = 0.01 + Math.random() * 0.009;
        this.trailLength = 0.16 + Math.random() * 0.08;
        this.finished = false;

        // Bảng màu linh khí: Ngọc bích và Hoàng kim chuẩn Tiên Hiệp
        const JADE_PALETTE = ['#2dd4bf', '#22d3ee', '#14b8a6', '#5eead4'];
        const GOLD_PALETTE = ['#facc15', '#fbbf24', '#f59e0b', '#fef08a'];
        const isJade = Math.random() < 0.55;
        this.color = isJade 
            ? JADE_PALETTE[Math.floor(Math.random() * JADE_PALETTE.length)]
            : GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];
        this.width = 1.5 + Math.random() * 1.3;
    }

    getBezierPoint(u) {
        const uClamped = Math.max(0, Math.min(1, u));
        const u1 = 1 - uClamped;
        const u1_3 = u1 * u1 * u1;
        const u1_2_3 = 3 * u1 * u1 * uClamped;
        const u_2_3 = 3 * u1 * uClamped * uClamped;
        const u_3 = uClamped * uClamped * uClamped;
        return {
            x: u1_3 * this.p0.x + u1_2_3 * this.p1.x + u_2_3 * this.p2.x + u_3 * this.p3.x,
            y: u1_3 * this.p0.y + u1_2_3 * this.p1.y + u_2_3 * this.p2.y + u_3 * this.p3.y
        };
    }

    update() {
        const curTarget = getDantianCoords();
        this.p3.x = curTarget.x;
        this.p3.y = curTarget.y;

        const accel = 1 + this.t * 1.1;
        this.t += this.baseSpeed * accel;

        if (this.t >= 1.0) {
            this.finished = true;
            if (typeof triggerTuViRipple === 'function') {
                triggerTuViRipple(this.p3.x, this.p3.y, this.color);
            }
        }
    }

    draw() {
        if (!ctx || this.finished) return;
        const headU = Math.min(1, this.t);
        const tailU = Math.max(0, this.t - this.trailLength);
        if (headU <= tailU) return;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        const steps = 12;
        const startPt = this.getBezierPoint(tailU);
        ctx.moveTo(startPt.x, startPt.y);

        for (let i = 1; i <= steps; i++) {
            const u = tailU + (headU - tailU) * (i / steps);
            const pt = this.getBezierPoint(u);
            ctx.lineTo(pt.x, pt.y);
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.globalAlpha = Math.min(0.9, (1 - headU * 0.15) * Math.min(1, this.t / this.trailLength));
        ctx.stroke();

        ctx.lineWidth = Math.max(0.7, this.width * 0.4);
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.stroke();

        const headPt = this.getBezierPoint(headU);
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.globalAlpha = 0.95;
        ctx.fill();

        ctx.restore();
    }
}
const QiConvergenceBeam = QiBezierStream;

// ==========================================================================
// HIỆU ỨNG GỢN SÓNG ÁNH SÁNG TẠI ĐĨA TRẬN PHÁP DƯỚI CHÂN (FORMATION DISK RIPPLE)
// Tuyệt đối không vẽ ở vùng trán/mặt nhân vật
// ==========================================================================
class TuViRipple {
    constructor(x, y, color = null) {
        const coords = getDantianCoords();
        this.x = (typeof x === 'number' && !isNaN(x)) ? x : coords.x;
        this.y = (typeof y === 'number' && !isNaN(y)) ? y : coords.y;
        
        // Luôn bảo vệ an toàn: đảm bảo tâm sóng nằm ở vùng chân trận pháp
        const charImg = document.getElementById('char-main-img');
        if (charImg && canvas) {
            const imgRect = charImg.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const safeFloorY = (imgRect.bottom - 20) - canvasRect.top;
            if (this.y < safeFloorY) this.y = safeFloorY;
        }

        this.radius = 4;
        this.maxRadius = 65 + Math.random() * 20;
        this.growthRate = 1.8;
        this.alpha = 0.55;
        const theme = (typeof getRealmFormationTheme === 'function') ? getRealmFormationTheme() : null;
        this.color = color || (theme ? theme.primary : '#2dd4bf');
    }
    update() {
        this.radius += this.growthRate;
        this.growthRate = Math.max(0.5, this.growthRate * 0.95);
        const progress = Math.min(1, (this.radius - 4) / (this.maxRadius - 4));
        this.alpha = Math.max(0, 0.55 * (1 - progress) * (1 - progress));
    }
    draw() {
        if (!ctx || this.alpha <= 0.01) return;
        ctx.save();
        ctx.lineCap = 'round';
        
        // Vòng sóng chính nhẹ nhàng dưới chân trận pháp
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (this.radius > 14) {
            ctx.globalAlpha = this.alpha * 0.35;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(1, this.radius - 8), 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}
let tuViRipples = [];

let lastRippleTriggerTime = 0;
function triggerTuViRipple(x, y, color) {
    // Vô hiệu hóa toàn bộ vòng tụ khí / đốm sáng ở nhân vật
    return;
}
function spawnRipple(x, y, color) {
    return;
}
if (typeof window !== 'undefined') {
    window.triggerTuViRipple = triggerTuViRipple;
    window.spawnRipple = spawnRipple;
    window.QiBezierStream = QiBezierStream;
    window.TuViRipple = TuViRipple;
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

        // Tránh vùng trán/mặt nhân vật
        const charImg = document.getElementById('char-main-img');
        if (charImg && canvas) {
            const imgRect = charImg.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            const headCenterX = (imgRect.left + imgRect.width * 0.5) - canvasRect.left;
            const headCenterY = (imgRect.top + imgRect.height * 0.3) - canvasRect.top;
            if (Math.hypot(this.x - headCenterX, this.y - headCenterY) < 95) {
                this.x += (this.x >= headCenterX ? 2.5 : -2.5);
                this.y += 1.5;
            }
        }

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

    // Vẽ sóng xung kích (nếu có click)
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
        // Lôi điện thiên kiếp lượn trên tầng mây bầu trời, tuyệt đối không chém qua mặt nhân vật
        const centerX = canvas.width / 2;
        const skyY = canvas.height * 0.14;
        const offset = 90 + Math.random() * 85;
        lightningBolts.push(new CanvasLightning(centerX - offset, skyY - 15, centerX + offset, skyY + 20, '#c084fc'));
        if (Math.random() > 0.45) lightningBolts.push(new CanvasLightning(centerX + 60, skyY - 30, centerX - 50, skyY + 25, '#38bdf8'));
        nextRootArcAt = now + 2500 + Math.random() * 1200;
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
