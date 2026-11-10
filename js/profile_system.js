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

// -------------------------------------------------------------------------
// 1. CẤU HÌNH FIREBASE SDK v11.6.1
// -------------------------------------------------------------------------
const env = import.meta.env || {};
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

    // 1. Cập nhật Đạo Hiệu trên thanh HUD chính
    const pNameEl = document.getElementById('player-name');
    if (pNameEl) pNameEl.textContent = profile.name;

    // 2. Cập nhật Avatar trên topbar
    const hudAvatar = document.querySelector('.dao-avatar img');
    if (hudAvatar && profile.avatar) {
        hudAvatar.src = profile.avatar;
    }

    // 3. Đồng bộ với window.state & window.player
    if (window.state) {
        if (!window.state.player) window.state.player = {};
        window.state.player.name = profile.name;
        window.state.player.avatar_url = profile.avatar;
        if (profile.linhCan) {
            window.state.linhCanType = profile.linhCan;
        }
    }
    if (window.player) {
        window.player.name = profile.name;
        window.player.avatar = profile.avatar;
    }

    // 4. Gọi updateHUD nếu có
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
function openProfileModal(forcedMode) {
    const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
    if (!modal) {
        console.error("LỖI NẶNG: Không tìm thấy ID 'profile-login-modal' trong HTML!");
        return;
    }

    const profile = getStoredProfile();
    const mode = forcedMode || (currentUser || profile ? 'edit' : 'new');

    const stateNew = document.getElementById('profile-state-new');
    const stateEdit = document.getElementById('profile-state-edit');
    const closeBtn = document.getElementById('profile-close-btn');

    if (mode === 'new') {
        if (stateNew) stateNew.classList.remove('hidden');
        if (stateEdit) stateEdit.classList.add('hidden');
        if (closeBtn) closeBtn.classList.add('hidden');
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
    const profile = getStoredProfile();
    if (!profile && !currentUser) {
        showNotify('Đạo hữu chưa hoàn tất Bước Vào Tiên Đồ! Xin hãy đăng nhập Google hoặc tạo Đạo Hiệu khởi đầu.', 'error');
        return;
    }
    const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('is-open');
    }

    const urlBox = document.getElementById('avatar-url-input-container');
    if (urlBox) urlBox.classList.add('hidden');
    if (typeof window.showMainScreenHUD === 'function') window.showMainScreenHUD();
}
window.closeProfileModal = closeProfileModal;

function handleGenderChange(gender) {
    const maleRadio = document.querySelector('input[name="gender-select"][value="male"]');
    const femaleRadio = document.querySelector('input[name="gender-select"][value="female"]');
    if (gender === 'male' && maleRadio) maleRadio.checked = true;
    if (gender === 'female' && femaleRadio) femaleRadio.checked = true;
}
window.handleGenderChange = handleGenderChange;

function handleLinhCanChange(val) {
    // Handled by CSS radio:checked
}
window.handleLinhCanChange = handleLinhCanChange;

function handleCreateProfile(event) {
    if (event && event.preventDefault) event.preventDefault();

    const nameInput = document.getElementById('input-new-name');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
        showNotify('Đạo hữu xin hãy nhập Đạo Hiệu để ghi danh vào Tiên Đạo!', 'error');
        if (nameInput) nameInput.focus();
        return;
    }

    const genderEl = document.querySelector('input[name="gender-select"]:checked');
    const gender = genderEl ? genderEl.value : 'male';

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

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
        console.error('[ProfileSystem] Lỗi ghi profile:', e);
    }

    syncProfileToHUD(profile);

    // Nếu đã có user Google, đồng bộ ngay lên mây
    if (currentUser) {
        saveProfileToCloud(profile);
    }

    if (typeof window.addLog === 'function') {
        window.addLog(`✨ <span class="text-amber-400 font-bold">[Vấn Thiên Lục]</span> Chào mừng Đạo Hữu <strong>${name}</strong> nhập đạo thành công! Càn khôn tịch diệt, vạn pháp vấn thiên. Căn cơ: <span class="text-emerald-400 font-mono">${linhCanConfig.name}</span>.`, 'text-amber-300');
    }

    const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('is-open');
    }

    if (typeof window.saveGameState === 'function') {
        window.saveGameState();
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
        localStorage.removeItem(STORAGE_KEY);
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
    const localProfile = getStoredProfile();
    if (!localProfile) {
        openProfileModal('new');
    } else {
        syncProfileToHUD(localProfile);
        updateCloudStatusUI(localProfile, null);
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
            const localProfile = getStoredProfile();
            if (!localProfile) {
                // Người chơi mới / Khách chưa tạo bản thể -> Hiển thị Start Screen che phủ toàn màn hình
                openProfileModal('new');
            } else {
                syncProfileToHUD(localProfile);
                updateCloudStatusUI(localProfile, null);

                // Đã có profile bản thể -> ẩn Start Screen
                const modal = (document.getElementById('profile-login-modal') || document.getElementById('profile-account-modal'));
                if (modal) {
                    modal.style.setProperty('display', 'none', 'important');
                    modal.classList.remove('is-open');
                }
            }
        }
    });
});
