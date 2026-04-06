/* ═══════════════════════════════════════════════════════════════
   INNOVO CMS — cms-users.js
   Single source of truth for user accounts and auth helpers.

   HOW TO ADD / REMOVE USERS:
     Edit the INNOVO_USERS array below.
     Each user needs: username, password, name.

   HOW PASSWORDS WORK:
     Default passwords live here. When a user changes their
     password via the dashboard, it is saved to localStorage
     (innovo_passwords) and takes priority over the defaults here.
     So you only need to edit this file for initial setup.
   ═══════════════════════════════════════════════════════════════ */

var INNOVO_USERS = [
  { username: 'admin', password: 'innovo2026',   name: 'Admin'  },
  { username: 'ahmed', password: 'something-strong-here',   name: 'Ahmed'  },
  { username: 'sarah', password: 'something-strong-here',   name: 'Sarah'  },
  { username: 'james', password: 'something-strong-here',   name: 'James'  }
];

/* ── Password override helpers ──────────────────────────────────
   Saved overrides (from "Change Password") are merged on boot.   */

function cms_loadPasswordOverrides() {
  try {
    var overrides = JSON.parse(localStorage.getItem('innovo_passwords') || '{}');
    INNOVO_USERS.forEach(function(user) {
      if (overrides[user.username]) {
        user.password = overrides[user.username];
      }
    });
  } catch (e) { /* localStorage unavailable — use defaults */ }
}

function cms_savePasswordOverride(username, newPassword) {
  try {
    var overrides = JSON.parse(localStorage.getItem('innovo_passwords') || '{}');
    overrides[username] = newPassword;
    localStorage.setItem('innovo_passwords', JSON.stringify(overrides));
  } catch (e) { /* fail silently */ }
}

/* ── Session helpers ────────────────────────────────────────────
   Session = { username, name } stored in sessionStorage.
   Clears automatically when the browser tab is closed.           */

function cms_getSession() {
  try { return JSON.parse(sessionStorage.getItem('innovo_user')) || null; }
  catch (e) { return null; }
}

function cms_setSession(user) {
  sessionStorage.setItem('innovo_user', JSON.stringify(user));
}

function cms_clearSession() {
  sessionStorage.removeItem('innovo_user');
}

/* ── Find a user by username + password ─────────────────────── */
function cms_authenticate(username, password) {
  var lc = username.trim().toLowerCase();
  return INNOVO_USERS.find(function(u) {
    return u.username.toLowerCase() === lc && u.password === password;
  }) || null;
}

/* Apply overrides immediately when this file loads */
cms_loadPasswordOverrides();
