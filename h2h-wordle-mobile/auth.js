// Authentication System with Email Verification
// Storage: localStorage (drop-in replaceable with real backend)
// Export: window.Auth

(function () {
  const USERS_KEY = 'wl_users';
  const SESSION_KEY = 'wl_session';
  const VERIFY_KEY = 'wl_verify';

  const AVATAR_COLORS = [
    ['#10b981', '#059669'],
    ['#3b82f6', '#2563eb'],
    ['#f59e0b', '#d97706'],
    ['#ec4899', '#db2777'],
    ['#8b5cf6', '#7c3aed'],
    ['#ef4444', '#dc2626'],
    ['#06b6d4', '#0891b2'],
    ['#84cc16', '#65a30d'],
  ];

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function avatarColors(name) {
    return AVATAR_COLORS[hashCode(name) % AVATAR_COLORS.length];
  }

  function initials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  }

  function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function hashPassword(pw) {
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(pw + 'wl_salt_2025')
    );
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Generate 4-digit verification code
  function generateCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Send verification email 
  async function sendVerificationEmail(email, code) {
    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok && data.success) return { ok: true };
      return { ok: false, error: data.error || 'Email send failed' };
    } catch (e) {
      return { ok: false, error: 'Network error' };
    }
  }

  // Get styled HTML for verification code
  function getStyledVerificationHTML(code) {
    const digits = code.split('');
    return `
      <div style="max-width:440px;margin:auto;background:#0f172a;border:3px solid #334155;border-radius:30px;padding:42px 28px;text-align:center;font-family:Arial,sans-serif;color:#fff;position:relative;overflow:hidden;box-shadow:0 0 45px rgba(0,0,0,.9),inset 0 0 60px rgba(255,255,255,.03);">
        <div style="position:absolute;inset:0;background:url('https://www.transparenttextures.com/patterns/stardust.png');opacity:.18;"></div>
        <div style="position:absolute;top:-120px;left:-120px;width:260px;height:260px;background:#2563eb;border-radius:50%;filter:blur(45px);opacity:.28;"></div>
        <div style="position:absolute;bottom:-140px;right:-140px;width:300px;height:300px;background:#f97316;border-radius:50%;filter:blur(55px);opacity:.25;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%);"></div>
        <div style="position:relative;z-index:2;font-size:13px;font-weight:800;color:#d1d5db;letter-spacing:4px;margin-bottom:22px;text-shadow:0 0 10px rgba(255,255,255,.25);">VERIFICATION CODE</div>
        <div style='display:flex;justify-content:center;gap:14px;position:relative;z-index:2;'>
          <span style='width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #60a5fa;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(96,165,250,.75),0 0 40px rgba(96,165,250,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(-3deg);'>${digits[0]}</span>
          <span style='width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #facc15;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(250,204,21,.75),0 0 40px rgba(250,204,21,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(2deg);'>${digits[1]}</span>
          <span style='width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #fb923c;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(251,146,60,.75),0 0 40px rgba(251,146,60,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(-2deg);'>${digits[2]}</span>
          <span style='width:72px;height:72px;line-height:72px;background:#1e293b;border:3px solid #4ade80;border-radius:20px;font-size:38px;font-weight:900;color:#fff;display:inline-block;box-shadow:0 0 22px rgba(74,222,128,.75),0 0 40px rgba(74,222,128,.25),inset 0 3px 10px rgba(255,255,255,.12);transform:rotate(3deg);'>${digits[3]}</span>
        </div>
        <div style='position:relative;z-index:2;margin-top:26px;font-size:15px;color:#cbd5e1;line-height:1.6;text-shadow:0 0 8px rgba(255,255,255,.08);'>Enter this code to verify your email</div>
      </div>
    `;
  }

  // Start registration - send verification code
  async function registerStart({ name, email, password }) {
    if (!name || name.trim().length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
    if (!email || !email.includes('@')) return { ok: false, error: 'Enter a valid email address.' };
    if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    const users = loadUsers();
    const key = email.toLowerCase().trim();
    if (users[key]) return { ok: false, error: 'An account with this email already exists.' };

    // Generate verification code
    const code = generateCode();
    
    // Store pending registration
    const pending = {
      name: name.trim(),
      email: key,
      password: password,
      code: code,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    };
    localStorage.setItem(VERIFY_KEY, JSON.stringify(pending));

    // Send verification email
    const emailResult = await sendVerificationEmail(email, code);

    if (!emailResult.ok) {
      localStorage.removeItem(VERIFY_KEY);
      return { ok: false, error: 'Failed to send verification email. Please try again.' };
    }

    return { 
      ok: true, 
      pending: true, 
      message: 'Verification code sent to your email'
    };
  }

  // Complete registration with verification code
  async function registerVerify(code) {
    try {
      const pending = JSON.parse(localStorage.getItem(VERIFY_KEY));
      if (!pending) return { ok: false, error: 'No pending registration. Please register again.' };
      
      if (Date.now() > pending.expires) {
        localStorage.removeItem(VERIFY_KEY);
        return { ok: false, error: 'Code expired. Please register again.' };
      }
      
      if (pending.code !== code) {
        return { ok: false, error: 'Invalid verification code.' };
      }

      // Create the account
      const hashed = await hashPassword(pending.password);
      const uid = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const [c1, c2] = avatarColors(pending.name);

      const user = {
        uid, name: pending.name, email: pending.email,
        passwordHash: hashed,
        avatarColor1: c1, avatarColor2: c2,
        createdAt: Date.now(),
        isGuest: false,
      };

      const users = loadUsers();
      users[pending.email] = user;
      saveUsers(users);

      localStorage.removeItem(VERIFY_KEY);

      const session = { uid: user.uid, name: user.name, email: pending.email, avatarColor1: c1, avatarColor2: c2, isGuest: false };
      saveSession(session);
      return { ok: true, user: session };
    } catch (e) {
      return { ok: false, error: 'Verification failed.' };
    }
  }

  // Legacy register - direct registration (no verification)
  async function register({ name, email, password }) {
    if (!name || name.trim().length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };
    if (!email || !email.includes('@')) return { ok: false, error: 'Enter a valid email address.' };
    if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

    const users = loadUsers();
    const key = email.toLowerCase().trim();

    if (users[key]) return { ok: false, error: 'An account with this email already exists.' };

    const hashed = await hashPassword(password);
    const uid = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const [c1, c2] = avatarColors(name);

    const user = {
      uid, name: name.trim(), email: key,
      passwordHash: hashed,
      avatarColor1: c1, avatarColor2: c2,
      createdAt: Date.now(),
      isGuest: false,
    };

    users[key] = user;
    saveUsers(users);

    const session = { uid, name: user.name, email: key, avatarColor1: c1, avatarColor2: c2, isGuest: false };
    saveSession(session);
    return { ok: true, user: session };
  }

  async function login({ email, password }) {
    if (!email || !password) return { ok: false, error: 'Please fill in all fields.' };

    const users = loadUsers();
    const key = email.toLowerCase().trim();
    const user = users[key];

    if (!user) return { ok: false, error: 'No account found with this email.' };

    const hashed = await hashPassword(password);
    if (hashed !== user.passwordHash) return { ok: false, error: 'Incorrect password.' };

    const session = { uid: user.uid, name: user.name, email: key, avatarColor1: user.avatarColor1, avatarColor2: user.avatarColor2, isGuest: false };
    saveSession(session);
    return { ok: true, user: session };
  }

  function loginAsGuest(name) {
    const guestName = (name && name.trim().length >= 2) ? name.trim() : 'Guest';
    const [c1, c2] = avatarColors(guestName);
    const uid = 'g_' + Date.now();
    const session = { uid, name: guestName, avatarColor1: c1, avatarColor2: c2, isGuest: true };
    saveSession(session);
    return { ok: true, user: session };
  }

  function logout() {
    clearSession();
  }

  function currentUser() {
    return loadSession();
  }

  function isLoggedIn() {
    return loadSession() !== null;
  }

  function getInitials(name) {
    return initials(name || 'G');
  }

  async function updateProfile({ name }) {
    const session = loadSession();
    if (!session || session.isGuest) return { ok: false, error: 'Not logged in.' };
    if (!name || name.trim().length < 2) return { ok: false, error: 'Name must be at least 2 characters.' };

    const users = loadUsers();
    const user = users[session.email];
    if (!user) return { ok: false, error: 'User not found.' };

    const [c1, c2] = avatarColors(name.trim());
    user.name = name.trim();
    user.avatarColor1 = c1;
    user.avatarColor2 = c2;
    users[session.email] = user;
    saveUsers(users);

    const newSession = { ...session, name: user.name, avatarColor1: c1, avatarColor2: c2 };
    saveSession(newSession);
    return { ok: true, user: newSession };
  }

  window.Auth = {
    register, registerStart, registerVerify, login, loginAsGuest, logout,
    currentUser, isLoggedIn, getInitials, updateProfile,
    avatarColors,
  };
})();