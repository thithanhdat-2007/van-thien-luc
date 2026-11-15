/**
 * ============================================================================
 * VẤN THIÊN LỤC — HỆ THỐNG TÀI KHOẢN & CLOUD SAVE (js/profile_system.js)
 * ============================================================================
 * Tích hợp Firebase Authentication v11.6.1 (Đăng nhập Google) & Firestore Cloud Save.
 * Tuân thủ quy tắc bảo mật đường dẫn Firestore:
 * doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data')
 */

let GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut;
let doc, setDoc, getDoc;

function showNotify(msg, type = 'info') {
    if (typeof window.showXianxiaToast === 'function') {
        window.showXianxiaToast(msg, type);
    } else if (typeof alert === 'function') {
        alert(msg);
    }
}

const STORAGE_KEY = 'playerProfile';

const DEFAULT_AVATARS = {
    male: './assets/images/avatar_lone_cultivator.jpg',
    female: './assets/images/nu_tu_trong_suot.png'
};

const LINH_CAN_LABELS = {
    thien_linh_can: { name: 'Thiên Linh Căn', buff: '+30% Tốc Độ Tu Luyện' },
    bien_di: { name: 'Biến Dị Linh Căn', buff: '+20% Bạo Kích Sát Phạt' },
    tap_linh_can: { name: 'Tạp Linh Căn', buff: '+25% Khí Huyết Căn Cơ' }
};

// =========================================================================
// KHO ĐẠO HIỆU TIÊN HIỆP & KHÍ VẬN KHỞI ĐẦU
// =========================================================================
const MALE_NAMES = [
    'Tiêu Dao Tử', 'Lăng Tiêu Tử', 'Hàn Lập', 'Thanh Vân Tử', 'Bạch Tử Họa',
    'Diệp Thần', 'Tiêu Viêm', 'Sở Hành Vân', 'Dạ Vô Ngân', 'Độc Cô Cầu Bại',
    'Tần Vũ', 'Vân Triệt', 'Mặc Uyên', 'Trần Bình An', 'Vương Lâm',
    'Thạch Hạo', 'Cố Trường Ca', 'Lý Trường Thọ', 'Diệp Thiên Đế', 'Mộ Dung Bạch',
    'Lạc Vô Cực', 'Khương Tử Nha', 'Cố Thanh Phong', 'Quân Tiêu Dao', 'Tạ Phong Đài'
];

const FEMALE_NAMES = [
    'Bạch Nguyệt Khôi', 'Tô Mộc Uyển', 'Cố Thanh Ca', 'Liễu Như Yên', 'Nhan Như Ngọc',
    'Lạc Băng Ngưng', 'Thẩm Dao Châu', 'Triệu Linh Nhi', 'Vân Hi', 'Cơ Như Tuyết',
    'Phong Linh Nhi', 'Nam Cung Uyển', 'Tuyết Nguyệt Thanh', 'Lục Tuyết Kỳ', 'Mục Như Tuyết',
    'Tô Mộc Tranh', 'Khương Thánh Y', 'Nguyệt Thiền', 'Bạch Thiển', 'Đường Vũ Cách',
    'Tô Chỉ Dao', 'Hoa Thiên Cốt', 'Lục Chỉ Cầm Ma', 'Cơ Tử Nguyệt', 'Vân Vân'
];

const DESTINY_DESCRIPTIONS = {
    male: {
        thien_linh_can: "Thiên phú tuyệt luân, nhất kiếm phá vạn pháp. Đạo tâm kiên định tựa bàn thạch, sinh ra đã mang mệnh tiên quân khai thiên lập địa.",
        bien_di: "Nghịch thiên cải mệnh, cuồng lôi sát phạt. Đạo cốt dị thường, chiến lực kinh thiên động địa, vạn ma cúi đầu xưng thần.",
        tap_linh_can: "Căn cơ vững chắc tựa thái sơn, khí huyết dồi dào cuồn cuộn. Hậu tích bạc phát, dũng cảm tiến bước, trường sinh bất tử."
    },
    female: {
        thien_linh_can: "Băng cơ ngọc cốt, tiên khí phiêu dật. Tham ngộ thiên địa nguyên khí chỉ trong chớp mắt, phong thái khuynh đảo cửu thiên.",
        bien_di: "Tử diễm ma đồng, tuyệt đại phong hoa. Xuất chiêu như lôi đình vạn biến, kiếm khí tung hoành đoạn tuyệt hồng trần.",
        tap_linh_can: "Linh căn sinh sinh bất tức, sinh mệnh lực tràn trề dồi dào. Cửu chuyển quy nguyên, đạp phá hư không bất tử bất diệt."
    }
};

function generateRandomDaoHieu(forcedGender) {
    const genderEl = document.querySelector('input[name="gender-select"]:checked');
    const gender = forcedGender || (genderEl ? genderEl.value : 'male');
    const pool = gender === 'female' ? FEMALE_NAMES : MALE_NAMES;
    const randomName = pool[Math.floor(Math.random() * pool.length)];
    const input = document.getElementById('input-new-name');
    if (input) {
        input.value = randomName;
        input.classList.add('name-randomized');
        setTimeout(() => input.classList.remove('name-randomized'), 400);
    }
    return randomName;
}
window.generateRandomDaoHieu = generateRandomDaoHieu;

function isOfflineFileProtocol() {
    return typeof window !== 'undefined' && (window.location.protocol === 'file:' || window._forceOfflineMode === true);
}
window.isOfflineFileProtocol = isOfflineFileProtocol;

function updateGoogleAuthDisplay() {
    const isOffline = (typeof window.isOfflineFileProtocol === 'function') ? window.isOfflineFileProtocol() : isOfflineFileProtocol();
    const googleBtn = document.querySelector('.btn-google-login');
    const offlineBadge = document.getElementById('google-offline-badge');
    const offlineNotice = document.getElementById('google-offline-notice');
    const btnText = document.getElementById('google-login-btn-text');
    const syncBox = document.getElementById('google-cloud-sync-box') || googleBtn?.closest('.mb-4');
    const authDivider = document.querySelector('.profile-auth-divider');

    if (isOffline) {
        // Khi chạy giao thức file:, ẩn hoàn toàn khối Đăng Nhập Google (#google-cloud-sync-box) để bảng tạo nhân vật gọn gàng, cân đối
        if (syncBox) {
            syncBox.style.setProperty('display', 'none', 'important');
        }
        if (googleBtn) {
            googleBtn.style.setProperty('display', 'none', 'important');
        }
        if (authDivider) {
            authDivider.style.setProperty('display', 'none', 'important');
        }
        if (offlineBadge) offlineBadge.classList.add('hidden');
        if (offlineNotice) offlineNotice.classList.add('hidden');
    } else {
        if (syncBox) {
            syncBox.style.removeProperty('display');
        }
        if (googleBtn) {
            googleBtn.style.removeProperty('display');
            googleBtn.classList.remove('is-offline-btn');
            googleBtn.removeAttribute('title');
        }
        if (authDivider) {
            authDivider.style.removeProperty('display');
        }
        if (btnText) {
            btnText.textContent = '🌐 LIÊN KẾT THIÊN ĐẠO (GOOGLE CLOUD)';
        }
        if (offlineBadge) offlineBadge.classList.add('hidden');
        if (offlineNotice) offlineNotice.classList.add('hidden');
    }
}
window.updateGoogleAuthDisplay = updateGoogleAuthDisplay;

// -------------------------------------------------------------------------
// 1. CẤU HÌNH FIREBASE SDK v11.6.1 (TƯƠNG THÍCH HOÀN TOÀN FILE:// VÀ LOCALHOST)
// -------------------------------------------------------------------------
const env = (typeof window !== 'undefined' && (window.__ENV__ || window.ENV || {})) || {};
const envFirebaseConfig = env.VITE_FIREBASE_API_KEY ? {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID
} : null;
const firebaseConfig = window.__FIREBASE_CONFIG__ || window.firebaseConfig || envFirebaseConfig;
const appId = window.__APP_ID__ || firebaseConfig?.appId || 'van-co-tu-tien-rpg';

let app = null;
let auth = null;
let db = null;
let currentUser = null;
let firebaseReady = null;

async function initializeFirebase() {
    if (!firebaseConfig?.apiKey || !firebaseConfig?.authDomain || !firebaseConfig?.projectId || !firebaseConfig?.appId) return false;
    try {
        const [appSdk, authSdk, firestoreSdk] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js'),
            import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js')
        ]);
        ({ GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } = authSdk);
        ({ doc, setDoc, getDoc } = firestoreSdk);
        app = appSdk.initializeApp(firebaseConfig);
        auth = authSdk.getAuth(app);
        db = firestoreSdk.getFirestore(app);
        return true;
    } catch (error) {
        console.error('[Firebase] Không thể nạp dịch vụ đăng nhập:', error);
        return false;
    }
}

// -------------------------------------------------------------------------
// 2. LOGIC LƯU TRỮ VÀ TIỆN ÍCH HỒ SƠ
// -------------------------------------------------------------------------
function getStoredProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('[ProfileSystem] Lỗi đọc profile từ localStorage:', e);
        return null;
    }
}
window.getStoredProfile = getStoredProfile;

function formatCultivationDuration(startTimestamp) {
    if (!startTimestamp) return '0 Giờ 1 Phút';
    const totalMinutes = Math.max(1, Math.floor((Date.now() - Number(startTimestamp)) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours} Giờ ${mins} Phút`;
}

function syncProfileToHUD(profile) {
    if (!profile) return;

    // 1. Cập nhật Đạo Hiệu trên thanh HUD chính & Topbar
    const pNameEl = document.getElementById('player-name');
    if (pNameEl) pNameEl.textContent = profile.name;

    const uiPlayerName = document.getElementById('ui-player-name');
    if (uiPlayerName) uiPlayerName.textContent = profile.name;

    const tmPlayerName = document.getElementById('tm-player-name');
    if (tmPlayerName) tmPlayerName.textContent = profile.name;

    // 2. Cập nhật Avatar trên topbar
    const uiAvatar = document.getElementById('ui-avatar');
    if (uiAvatar && profile.avatar) {
        uiAvatar.src = profile.avatar;
    }
    const hudAvatar = document.querySelector('.dao-avatar img');
    if (hudAvatar && profile.avatar) {
        hudAvatar.src = profile.avatar;
    }

    // 3. Cập nhật Center Avatar đả tọa
    const charMainImg = document.getElementById('char-main-img');
    if (charMainImg) {
        if (profile.gender === 'female') {
            charMainImg.src = './assets/images/image_11.png';
            charMainImg.onerror = () => { charMainImg.src = './assets/images/nu_tu_trong_suot.png'; };
        } else {
            charMainImg.src = './assets/images/avatar_lone_cultivator.jpg';
            charMainImg.onerror = () => { charMainImg.src = './assets/images/image_21.png'; };
        }
    }

    // 4. Đồng bộ với window.GameState & window.state & window.player
    if (window.GameState) {
        window.GameState.name = profile.name;
        window.GameState.characterName = profile.name;
        if (!window.GameState.player) window.GameState.player = {};
        window.GameState.player.name = profile.name;
        window.GameState.player.gender = profile.gender || 'male';
        if (profile.avatar) {
            window.GameState.avatar = profile.avatar;
            window.GameState.player.avatar_url = profile.avatar;
        }
        if (profile.linhCan) {
            window.GameState.linhCanType = profile.linhCan;
            window.GameState.linhCanName = profile.linhCanName || 'Thiên Linh Căn';
            window.GameState.linhCanBonus = profile.linhCanBonus || '+30% Tốc Độ Tu Luyện';
        }
        window.GameState.hasCreatedProfile = true;
    }

    if (window.state) {
        window.state.name = profile.name;
        window.state.characterName = profile.name;
        if (!window.state.player) window.state.player = {};
        window.state.player.name = profile.name;
        window.state.player.gender = profile.gender || 'male';
        if (profile.avatar) {
            window.state.player.avatar_url = profile.avatar;
            window.state.avatar = profile.avatar;
        }
        if (profile.linhCan) {
            window.state.linhCanType = profile.linhCan;
            window.state.linhCanName = profile.linhCanName || 'Thiên Linh Căn';
            window.state.linhCanBonus = profile.linhCanBonus || '+30% Tốc Độ Tu Luyện';
        }
        window.state.hasCreatedProfile = true;
    }

    if (window.player) {
        window.player.name = profile.name;
        window.player.avatar = profile.avatar;
    }

    // 5. Cập nhật UI toàn cục
    if (typeof window.syncAllUI === 'function') {
        window.syncAllUI();
    }
    if (typeof window.updateHUD === 'function') {
        window.updateHUD();
    }
}

function updateCloudStatusUI(profile, user) {
    const emailText = document.getElementById('cloud-email-text');
    const statusBadge = document.getElementById('cloud-sync-status');
    const cloudBox = document.getElementById('cloud-account-badge');

    const guestView = document.getElementById('guest-auth-view');
    const loggedInView = document.getElementById('logged-in-auth-view');
    const userEmailDisplay = document.getElementById('user-email-display');
    const resetBtn = document.querySelector('.btn-reset-game');

    if (user && user.email) {
        if (emailText) emailText.textContent = user.email;
        if (statusBadge) {
            statusBadge.textContent = '☁️ Đã Liên Kết Thiên Đạo';
            statusBadge.className = 'text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40';
        }
        if (cloudBox) cloudBox.classList.remove('hidden');

        // Hiển thị trạng thái ĐÃ ĐĂNG NHẬP
        if (guestView) guestView.style.display = 'none';
        if (loggedInView) loggedInView.style.display = 'block';
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        const linkedText = loggedInView?.querySelector('p');
        if (linkedText) linkedText.textContent = '✅ Đã đăng nhập Google (hồ sơ đã liên kết)';
        if (resetBtn) resetBtn.style.display = 'none';
    } else {
        if (emailText) emailText.textContent = 'Chưa liên kết Thiên Đạo';
        if (statusBadge) {
            statusBadge.textContent = '⚡ Ngoại Tuyến (Local)';
            statusBadge.className = 'text-[10px] text-amber-400 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40';
        }

        // Hiển thị trạng thái CHƯA ĐĂNG NHẬP (Guest)
        if (guestView) guestView.style.display = 'block';
        if (loggedInView) loggedInView.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'inline-flex';
    }
}

// -------------------------------------------------------------------------
// 3. FIRESTORE CLOUD SAVE (STRICT PATH RULE)
// -------------------------------------------------------------------------
/**
 * Tải dữ liệu từ Firestore đường dẫn bắt buộc:
 * artifacts/{appId}/users/{user.uid}/profile/data
 */
async function loadProfileFromCloud(user) {
    if (!user || !db) return null;
    try {
        const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
        const snap = await getDoc(userProfileRef);

        let profileData = null;
        if (snap.exists()) {
            profileData = snap.data();
            console.log('[Firestore] Đã tải Cloud Save từ:', userProfileRef.path, profileData);
        } else {
            console.log('[Firestore] Người mới, kiến tạo bản ghi Thiên Đạo ban đầu...');
            const defaultGender = 'male';
            const defaultRoot = 'thien_linh_can';
            profileData = {
                uid: 'VC-' + user.uid.substring(0, 6).toUpperCase(),
                name: user.displayName || 'Tiêu Dao Tử',
                email: user.email || '',
                gender: defaultGender,
                avatar: user.photoURL || DEFAULT_AVATARS.male,
                linhCan: defaultRoot,
                linhCanName: 'Thiên Linh Căn',
                linhCanBonus: '+30% Tốc Độ Tu Luyện',
                realm: typeof window.getRealmTitle === 'function' ? window.getRealmTitle() : 'Luyện Khí Tầng 1',
                realmIndex: window.state?.realmIndex || 0,
                exp: window.state?.exp || 0,
                stones: window.state?.stones || 1000,
                createdAt: Date.now(),
                createdDateStr: new Date().toLocaleDateString('vi-VN'),
                lastCloudSave: Date.now()
            };
            await setDoc(userProfileRef, profileData, { merge: true });
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
        syncProfileToHUD(profileData);
        updateCloudStatusUI(profileData, user);

        return profileData;
    } catch (e) {
        console.error('[Firestore] Lỗi loadProfileFromCloud:', e);
        return null;
    }
}
window.loadProfileFromCloud = loadProfileFromCloud;

/**
 * Lưu dữ liệu lên Firestore đường dẫn bắt buộc:
 * artifacts/{appId}/users/{user.uid}/profile/data
 */
async function saveProfileToCloud(profileData) {
    if (!currentUser || !db) {
        console.log('[Cloud Save] Chưa đăng nhập Google, lưu local storage.');
        return false;
    }
    try {
        const userProfileRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'profile', 'data');

        const enriched = {
            ...profileData,
            email: currentUser.email || '',
            realm: typeof window.getRealmTitle === 'function' ? window.getRealmTitle() : 'Luyện Khí Kỳ',
            realmIndex: window.state?.realmIndex || 0,
            exp: window.state?.exp || 0,
            stones: window.state?.stones || 0,
            towerFloor: window.state?.towerFloor || 1,
            lastCloudSave: Date.now()
        };

        await setDoc(userProfileRef, enriched, { merge: true });
        console.log('[Firestore] Đã lưu Cloud Save thành công:', userProfileRef.path);

        const statusBadge = document.getElementById('cloud-sync-status');
        if (statusBadge) {
            statusBadge.textContent = '☁️ Đã Lưu Lên Mây';
            statusBadge.className = 'text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 animate-pulse';
            setTimeout(() => {
                if (statusBadge) statusBadge.classList.remove('animate-pulse');
            }, 2500);
        }

        return true;
    } catch (e) {
        console.error('[Firestore] Lỗi saveProfileToCloud:', e);
        return false;
    }
}
window.saveProfileToCloud = saveProfileToCloud;

// -------------------------------------------------------------------------
// 4. FIREBASE AUTHENTICATION (GOOGLE LOGIN & LOGOUT)
// -------------------------------------------------------------------------
async function loginWithGoogle() {
    if (isOfflineFileProtocol()) {
        showNotify('Đạo hữu đang du hành ở cõi Ngoại Tuyến (file://). Dữ liệu được bảo toàn an toàn trong Trí Nhớ Bản Địa (Local Storage)! Cần mở qua Localhost để kết nối Google Cloud.', 'info');
        return;
    }
    if (firebaseReady) await firebaseReady;
    if (!auth) {
        showNotify(firebaseConfig ? 'Không thể kết nối dịch vụ đăng nhập. Hãy kiểm tra mạng và thử lại.' : 'Đăng nhập Google chưa được cấu hình cho bản web này. Bạn vẫn có thể tạo bản thể và chơi cục bộ.', 'error');
        return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        currentUser = user;
        console.log('[Firebase Auth] Đăng nhập Google thành công:', user.email);

        // Kéo dữ liệu từ Firestore hoặc khởi tạo bản ghi mới
        const profile = await loadProfileFromCloud(user);

        if (typeof window.addLog === 'function') {
            window.addLog(`🌐 <span class="text-amber-400 font-bold">[Thiên Đạo Liên Kết]</span> Hồn phách đã kết nối Google: <strong>${user.email}</strong>!`, 'text-amber-300');
        }

        showNotify(`✨ Liên kết Thiên Đạo thành công! Chào mừng đạo hữu ${profile?.name || user.displayName || 'Vô Danh'} đã bước vào Vấn Thiên Lục.`, 'success');

        // Đóng màn hình Start Screen và trả lại giao diện chính cho người chơi
        const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('is-open');
        }
    } catch (error) {
        console.error('[Firebase Auth] Lỗi đăng nhập Google:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            console.log('Người chơi đã đóng cửa sổ đăng nhập.');
            return;
        }
        showNotify(`Không thể liên kết Thiên Đạo: ${error.message}`, 'error');
    }
}
window.loginWithGoogle = loginWithGoogle;

async function logoutFromCloud() {
    if (!auth) return;
    try {
        await signOut(auth);
        currentUser = null;
        console.log('[Firebase Auth] Đã đăng xuất Google (Tách Hồn).');

        updateCloudStatusUI(null, null);

        if (typeof window.addLog === 'function') {
            window.addLog(`🌌 <span class="text-purple-400 font-bold">[Tách Hồn Xuất Thể]</span> Đã ngắt kết nối linh thức với Google!`, 'text-purple-300');
        }

        showNotify('Đã tách hồn xuất thể (Đăng xuất Google)! Trở về trạng thái tự tu bản thể.', 'info');
        const localProfile = getStoredProfile();
        if (localProfile) updateCloudStatusUI(localProfile, null);
        else openProfileModal('new');
    } catch (e) {
        console.error('[Firebase Auth] Lỗi đăng xuất:', e);
        showNotify(`Lỗi đăng xuất: ${e.message}`, 'error');
    }
}
window.logoutFromCloud = logoutFromCloud;
window.logoutGoogle = logoutFromCloud;

// -------------------------------------------------------------------------
// 5. MODAL UI & USER ACTIONS
// -------------------------------------------------------------------------
function hasCreatedProfileAnywhere() {
    if (localStorage.getItem('hasCreatedProfile') === 'true') return true;
    if (getStoredProfile()) return true;
    try {
        const raw = localStorage.getItem('van_co_tu_tien_save_v2');
        if (raw) {
            const data = JSON.parse(raw);
            if (data?.player?.name && data.player.name !== 'Vô Danh') return true;
        }
    } catch (e) {}
    return false;
}
window.hasCreatedProfileAnywhere = hasCreatedProfileAnywhere;

function openProfileModal(forcedMode) {
    const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
    if (!modal) {
        console.error("LỖI NẶNG: Không tìm thấy ID 'profile-login-modal' trong HTML!");
        return;
    }

    updateGoogleAuthDisplay();
    const hasProfile = hasCreatedProfileAnywhere();
    const profile = getStoredProfile();
    const mode = forcedMode || (hasProfile ? 'edit' : 'new');

    const stateNew = document.getElementById('profile-state-new');
    const stateEdit = document.getElementById('profile-state-edit');
    const closeBtn = document.getElementById('profile-close-btn');

    if (mode === 'new') {
        if (stateNew) stateNew.classList.remove('hidden');
        if (stateEdit) stateEdit.classList.add('hidden');
        if (closeBtn) {
            closeBtn.classList.remove('hidden');
        }

        // Khởi tạo preview mặc định cho form mới
        const currentGender = document.querySelector('input[name="gender-select"]:checked')?.value || 'male';
        const currentLinhCan = document.querySelector('input[name="linhcan-select"]:checked')?.value || 'thien_linh_can';
        handleGenderChange(currentGender, false);
        handleLinhCanChange(currentLinhCan);
    } else {
        if (stateEdit) stateEdit.classList.remove('hidden');
        if (stateNew) stateNew.classList.add('hidden');
        if (closeBtn) closeBtn.classList.remove('hidden');

        if (profile) {
            const editNameInput = document.getElementById('input-edit-name');
            const editDisplayName = document.getElementById('edit-profile-display-name');
            const editAvatarPreview = document.getElementById('edit-avatar-preview');
            const uidBadge = document.getElementById('edit-profile-uid-badge');
            const statTime = document.getElementById('stat-cultivation-time');
            const statDate = document.getElementById('stat-created-date');
            const statRealm = document.getElementById('edit-stat-realm');
            const statLinhCan = document.getElementById('edit-stat-linhcan');

            if (editNameInput) editNameInput.value = profile.name || '';
            if (editDisplayName) editDisplayName.textContent = profile.name || 'Vô Danh';
            if (editAvatarPreview) editAvatarPreview.src = profile.avatar || DEFAULT_AVATARS.male;
            if (uidBadge) uidBadge.textContent = `UID: ${profile.uid || 'VC-888888'}`;
            if (statTime) statTime.textContent = formatCultivationDuration(profile.createdAt);
            if (statDate) statDate.textContent = profile.createdDateStr || new Date().toLocaleDateString('vi-VN');

            const realmTitle = typeof window.getRealmTitle === 'function' ? window.getRealmTitle() : 'Luyện Khí Kỳ';
            if (statRealm) statRealm.textContent = `👑 ${realmTitle}`;
            if (statLinhCan) statLinhCan.textContent = `⚡ ${profile.linhCanName || 'Thiên Linh Căn'}`;
        }
        updateCloudStatusUI(profile, currentUser);
    }

    modal.style.setProperty('display', 'flex', 'important');
    modal.classList.add('is-open');
    console.log("Đã mở modal Bản Thể");
}
window.openProfileModal = openProfileModal;

function closeProfileModal() {
    const hasProfile = hasCreatedProfileAnywhere();
    if (!hasProfile && !currentUser) {
        try {
            handleCreateProfile();
        } catch (e) {
            console.warn("Tự động khởi tạo hồ sơ khi đóng:", e);
        }
    }
    const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('is-open', 'active', 'is-active');
    }

    const urlBox = document.getElementById('avatar-url-input-container');
    if (urlBox) urlBox.classList.add('hidden');
    if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
}
window.closeProfileModal = closeProfileModal;

function handleGenderChange(gender, shouldUpdateName = true) {
    const maleRadio = document.querySelector('input[name="gender-select"][value="male"]');
    const femaleRadio = document.querySelector('input[name="gender-select"][value="female"]');
    if (gender === 'male' && maleRadio) maleRadio.checked = true;
    if (gender === 'female' && femaleRadio) femaleRadio.checked = true;

    // 1. Cập nhật ảnh Chân Dung Showcase Cột Trái
    const showcaseAvatar = document.getElementById('preview-showcase-avatar');
    if (showcaseAvatar) {
        showcaseAvatar.src = gender === 'female' ? DEFAULT_AVATARS.female : DEFAULT_AVATARS.male;
    }

    // 2. Cập nhật dòng mô tả khí vận
    const curLinhCan = document.querySelector('input[name="linhcan-select"]:checked')?.value || 'thien_linh_can';
    const descEl = document.getElementById('preview-showcase-desc');
    if (descEl && DESTINY_DESCRIPTIONS[gender]?.[curLinhCan]) {
        descEl.textContent = DESTINY_DESCRIPTIONS[gender][curLinhCan];
    }

    // 3. Tự động gợi ý tên phù hợp giới tính
    if (shouldUpdateName) {
        const nameInput = document.getElementById('input-new-name');
        if (nameInput) {
            const currentVal = nameInput.value.trim();
            if (!currentVal || currentVal === 'Tiêu Dao Tử' || currentVal === 'Bạch Nguyệt Khôi' || MALE_NAMES.includes(currentVal) || FEMALE_NAMES.includes(currentVal)) {
                generateRandomDaoHieu(gender);
            }
        }
    }
}
window.handleGenderChange = handleGenderChange;

function handleLinhCanChange(val) {
    const auraWrapper = document.getElementById('showcase-aura-wrapper');
    const badgeEl = document.getElementById('preview-showcase-badge');
    const buffEl = document.getElementById('preview-showcase-buff');
    const descEl = document.getElementById('preview-showcase-desc');

    const gender = document.querySelector('input[name="gender-select"]:checked')?.value || 'male';

    if (auraWrapper) {
        auraWrapper.classList.remove('aura-thien-linh-can', 'aura-bien-di', 'aura-tap-linh-can');
        if (val === 'thien_linh_can') auraWrapper.classList.add('aura-thien-linh-can');
        else if (val === 'bien_di') auraWrapper.classList.add('aura-bien-di');
        else if (val === 'tap_linh_can') auraWrapper.classList.add('aura-tap-linh-can');
    }

    const config = LINH_CAN_LABELS[val] || LINH_CAN_LABELS.thien_linh_can;
    if (badgeEl) {
        badgeEl.textContent = (val === 'thien_linh_can' ? '⚡ ' : val === 'bien_di' ? '🔥 ' : '🏔️ ') + config.name;
        badgeEl.className = 'inline-block px-3 py-1 rounded-full font-bold text-xs shadow-md ' +
            (val === 'thien_linh_can'
                ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : val === 'bien_di'
                ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                : 'bg-teal-500/20 border border-teal-400/50 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.3)]');
    }

    if (buffEl) {
        buffEl.textContent = config.buff;
        buffEl.className = 'text-[11px] font-mono font-semibold mt-1 ' +
            (val === 'thien_linh_can' ? 'text-emerald-400' : val === 'bien_di' ? 'text-purple-300' : 'text-cyan-300');
    }

    if (descEl && DESTINY_DESCRIPTIONS[gender]?.[val]) {
        descEl.textContent = DESTINY_DESCRIPTIONS[gender][val];
    }
}
window.handleLinhCanChange = handleLinhCanChange;

function handleCreateProfile(event) {
    if (event && event.preventDefault) event.preventDefault();

    const genderEl = document.querySelector('input[name="gender-select"]:checked');
    const gender = genderEl ? genderEl.value : 'male';

    const nameInput = document.getElementById('input-new-name');
    let name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
        name = generateRandomDaoHieu(gender);
    }

    const linhCanEl = document.querySelector('input[name="linhcan-select"]:checked');
    const linhCan = linhCanEl ? linhCanEl.value : 'thien_linh_can';

    const avatar = gender === 'female' ? DEFAULT_AVATARS.female : DEFAULT_AVATARS.male;
    const linhCanConfig = LINH_CAN_LABELS[linhCan] || LINH_CAN_LABELS.thien_linh_can;
    const uid = `VC-${Math.floor(100000 + Math.random() * 900000)}`;

    const profile = {
        uid: uid,
        name: name,
        gender: gender,
        avatar: avatar,
        linhCan: linhCan,
        linhCanName: linhCanConfig.name,
        linhCanBonus: linhCanConfig.buff,
        createdAt: Date.now(),
        createdDateStr: new Date().toLocaleDateString('vi-VN')
    };

    // 1. Ghi vào localStorage
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        localStorage.setItem('hasCreatedProfile', 'true');
    } catch (e) {
        console.error('[ProfileSystem] Lỗi ghi profile:', e);
    }

    // 2. Cập nhật và Buff chỉ số vào GameState & window.state
    const s = window.GameState || window.state || {};
    s.name = name;
    s.characterName = name;
    if (!s.player) s.player = {};
    s.player.name = name;
    s.player.gender = gender;
    s.player.avatar_url = avatar;
    s.avatar = avatar;
    s.linhCanType = linhCan;
    s.linhCanName = linhCanConfig.name;
    s.linhCanBonus = linhCanConfig.buff;
    s.hasCreatedProfile = true;

    if (window.state && window.state !== s) {
        window.state.name = name;
        window.state.characterName = name;
        if (!window.state.player) window.state.player = {};
        window.state.player.name = name;
        window.state.player.gender = gender;
        window.state.player.avatar_url = avatar;
        window.state.avatar = avatar;
        window.state.linhCanType = linhCan;
        window.state.linhCanName = linhCanConfig.name;
        window.state.linhCanBonus = linhCanConfig.buff;
        window.state.hasCreatedProfile = true;
    }

    // Áp dụng buff Linh Căn
    if (linhCan === 'thien_linh_can') {
        s.cultivationSpeedBuff = 1.30;
        s.linhCanBonusRate = 1.30;
        if (window.state) {
            window.state.cultivationSpeedBuff = 1.30;
            window.state.linhCanBonusRate = 1.30;
        }
    } else if (linhCan === 'bien_di') {
        s.critBonus = (Number(s.critBonus) || 0) + 20;
        if (s.baseStats) s.baseStats.crit = (Number(s.baseStats.crit) || 10) + 20;
        if (window.state) {
            window.state.crit = (Number(window.state.crit) || 5) + 20;
            if (window.state.baseStats) window.state.baseStats.crit = (Number(window.state.baseStats.crit) || 10) + 20;
        }
    } else if (linhCan === 'tap_linh_can') {
        s.hpBonus = (Number(s.hpBonus) || 0) + 0.25;
        if (s.baseHp) s.baseHp = Math.round(Number(s.baseHp) * 1.25);
        if (s.maxHp) s.maxHp = Math.round(Number(s.maxHp) * 1.25);
        if (s.hp) s.hp = Math.round(Number(s.hp) * 1.25);
        if (window.state) {
            window.state.maxHp = Math.round((Number(window.state.maxHp) || 1000) * 1.25);
            window.state.hp = window.state.maxHp;
        }
    }

    // 3. Đồng bộ giao diện toàn game
    syncProfileToHUD(profile);
    if (typeof window.syncAllUI === 'function') window.syncAllUI();
    if (typeof window.updateHUD === 'function') window.updateHUD();

    // 4. Lưu game ngay lập tức
    if (typeof window.saveGame === 'function') window.saveGame();
    if (typeof window.saveGameState === 'function') window.saveGameState();

    // 5. Nếu có Google user, đồng bộ lên Cloud
    if (currentUser) {
        saveProfileToCloud(profile);
    }

    if (typeof window.addLog === 'function') {
        window.addLog(`✨ <span class="text-amber-400 font-bold">[Vấn Thiên Lục]</span> Chào mừng Đạo Hữu <strong>${name}</strong> nhập đạo thành công! Càn khôn tịch diệt, vạn pháp vấn thiên. Căn cơ: <span class="text-emerald-400 font-mono">${linhCanConfig.name} (${linhCanConfig.buff})</span>.`, 'text-amber-300');
    }

    showNotify(`✨ Chúc mừng Đạo Hữu ${name} đã bước vào Tiên Đồ! Căn cơ: ${linhCanConfig.name} (${linhCanConfig.buff})`, 'success');

    // 6. Đóng mượt mà modal
    const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('is-open');
    }
    if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();

    // 7. Kích hoạt vòng lặp tu luyện
    if (typeof window.startMainLoop === 'function') {
        window.startMainLoop();
    }
}
window.handleCreateProfile = handleCreateProfile;

function toggleAvatarUrlInput() {
    const box = document.getElementById('avatar-url-input-container');
    if (box) box.classList.toggle('hidden');
}
window.toggleAvatarUrlInput = toggleAvatarUrlInput;

function setPresetAvatar(url) {
    const preview = document.getElementById('edit-avatar-preview');
    if (preview && url) {
        preview.src = url;
    }
}
window.setPresetAvatar = setPresetAvatar;

function applyCustomAvatarUrl() {
    const input = document.getElementById('input-custom-avatar-url');
    const preview = document.getElementById('edit-avatar-preview');
    if (!input || !preview) return;

    const url = input.value.trim();
    if (!url) {
        showNotify('Vui lòng dán liên kết ảnh hợp lệ!', 'error');
        return;
    }

    const testImg = new Image();
    testImg.onload = function () {
        preview.src = url;
        showNotify('Tải ảnh đại diện mới thành công! Hãy bấm "LƯU CHUYỂN HÓA" để hoàn tất.', 'success');
    };
    testImg.onerror = function () {
        showNotify('Không thể tải ảnh từ liên kết này! Hãy kiểm tra lại URL ảnh.', 'error');
    };
    testImg.src = url;
}
window.applyCustomAvatarUrl = applyCustomAvatarUrl;

async function saveProfileChanges() {
    const profile = getStoredProfile() || {};
    const editNameInput = document.getElementById('input-edit-name');
    const editAvatarPreview = document.getElementById('edit-avatar-preview');

    const newName = editNameInput ? editNameInput.value.trim() : '';
    if (!newName) {
        showNotify('Đạo hiệu không được để trống!', 'error');
        return;
    }

    profile.name = newName;
    if (editAvatarPreview && editAvatarPreview.src) {
        profile.avatar = editAvatarPreview.src;
    }

    // Cập nhật State toàn cục
    if (window.GameState) {
        window.GameState.name = newName;
        if (profile.avatar) window.GameState.avatar = profile.avatar;
    }
    if (window.state) {
        window.state.name = newName;
        if (!window.state.player) window.state.player = {};
        window.state.player.name = newName;
        if (profile.avatar) window.state.player.avatar_url = profile.avatar;
    }

    const editDisplay = document.getElementById('edit-profile-display-name');
    if (editDisplay) editDisplay.textContent = newName;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.error('[ProfileSystem] Lỗi cập nhật profile:', e);
    }

    syncProfileToHUD(profile);

    // Đồng bộ lên Cloud nếu đang đăng nhập
    if (currentUser) {
        await saveProfileToCloud(profile);
    }

    if (typeof window.addLog === 'function') {
        window.addLog(`🎭 <span class="text-amber-400 font-bold">[Chuyển Hóa Bản Thể]</span> Đạo Hữu đã đổi tôn hiệu thành: <strong>${newName}</strong>!`, 'text-amber-300');
    }

    showNotify('✨ Chuyển Hóa Bản Thể thành công! Đạo Hiệu và Tướng Mạo mới đã được ghi nhận.', 'success');
    closeProfileModal();

    if (typeof window.saveGameState === 'function') {
        window.saveGameState();
    }
}
window.saveProfileChanges = saveProfileChanges;

function openResetConfirmation() {
    const m = document.getElementById('reset-confirm-modal');
    if (m) {
        m.classList.remove('hidden');
        m.classList.add('flex', 'is-open');
    }
}
window.openResetConfirmation = openResetConfirmation;

function closeResetConfirmation() {
    const m = document.getElementById('reset-confirm-modal');
    if (m) {
        m.classList.add('hidden');
        m.classList.remove('flex', 'is-open');
    }
}
window.closeResetConfirmation = closeResetConfirmation;

function confirmResetGame() {
    try {
        localStorage.removeItem('van_co_tu_tien_save_v2');
        localStorage.removeItem('van_thien_luc_save');
        localStorage.removeItem('van_thien_luc_state');
        localStorage.removeItem('van_thien_luc_backup_save');
        localStorage.removeItem('van_thien_luc_backup_meta');
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('hasCreatedProfile');
    } catch (e) {
        console.error('[ProfileSystem] Lỗi xóa save:', e);
    }
    showNotify('💥 Đã Tán Công Trùng Tu! Toàn bộ tu vi và dữ liệu đã tiêu tán về cõi hư vô.', 'info');
    window.location.reload();
}
window.confirmResetGame = confirmResetGame;

// -------------------------------------------------------------------------
// 6. KHỞI TẠO & OBSERVER THEO DÕI AUTH
// -------------------------------------------------------------------------
function initializeLocalProfile() {
    updateGoogleAuthDisplay();
    if (hasCreatedProfileAnywhere()) {
        const localProfile = getStoredProfile();
        if (localProfile) {
            syncProfileToHUD(localProfile);
            updateCloudStatusUI(localProfile, null);
        }
        const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
        if (modal) {
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('is-open');
        }
    } else {
        openProfileModal('new');
    }
}

// main.js dùng hàm mở modal đơn giản cho các màn hình khác. Giữ hàm hồ sơ
// có đủ trạng thái đăng nhập sau khi tất cả script của trang đã chạy.
function restoreProfileHandlers() {
    window.openProfileModal = openProfileModal;
    window.closeProfileModal = closeProfileModal;
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restoreProfileHandlers);
else restoreProfileHandlers();

initializeLocalProfile();
firebaseReady = initializeFirebase();
firebaseReady.then((ready) => {
    if (!ready) return;
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            console.log('[Firebase Auth Observer] Người chơi đã đăng nhập:', user.email);
            const cloudProfile = await loadProfileFromCloud(user);
            updateCloudStatusUI(cloudProfile, user);

            // Đã có tài khoản đăng nhập -> ẩn Start Screen
            const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
            if (modal) {
                modal.style.setProperty('display', 'none', 'important');
                modal.classList.remove('is-open');
            }
        } else {
            currentUser = null;
            console.log('[Firebase Auth Observer] Không có người dùng Google.');
            if (hasCreatedProfileAnywhere()) {
                const localProfile = getStoredProfile();
                if (localProfile) {
                    syncProfileToHUD(localProfile);
                    updateCloudStatusUI(localProfile, null);
                }
                const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
                if (modal) {
                    modal.style.setProperty('display', 'none', 'important');
                    modal.classList.remove('is-open');
                }
            } else {
                openProfileModal('new');
            }
        }
    });
});
