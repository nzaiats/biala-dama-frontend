const DB = (() => {
   
    const API = 'https://biala-dama-backend.onrender.com/api';

    // ── HTTP helpers ──────────────────────────────────────────────────────────
    async function _get(url) {
        const r = await fetch(API + url, { credentials: 'include' });
        if (!r.ok) { const t = await r.text(); throw new Error(t); }
        return r.json();
    }
    async function _post(url, data) {
        const r = await fetch(API + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!r.ok) { const t = await r.text(); throw new Error(t); }
        return r.json();
    }
    async function _put(url, data) {
        const r = await fetch(API + url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        if (!r.ok) { const t = await r.text(); throw new Error(t); }
        return r.json();
    }

    // ── Default layouts ──────────────────
    const DEFAULT_LAYOUTS = {
        kominkowa: [
            {n:1, cap:2,l:'5%', top:'18%',w:'12%',h:'13%'},{n:2, cap:2,l:'21%',top:'18%',w:'12%',h:'13%'},
            {n:3, cap:4,l:'38%',top:'18%',w:'18%',h:'12%'},{n:4, cap:4,l:'60%',top:'18%',w:'18%',h:'12%'},
            {n:5, cap:6,l:'5%', top:'42%',w:'23%',h:'12%'},{n:6, cap:4,l:'33%',top:'42%',w:'18%',h:'12%'},
            {n:7, cap:4,l:'55%',top:'42%',w:'18%',h:'12%'},{n:8, cap:8,l:'77%',top:'42%',w:'18%',h:'12%'},
            {n:9, cap:2,l:'5%', top:'66%',w:'12%',h:'13%'},{n:10,cap:6,l:'22%',top:'66%',w:'23%',h:'12%'},
            {n:11,cap:6,l:'50%',top:'66%',w:'23%',h:'12%'},
        ],
        lesna: [
            {n:1,cap:2,l:'6%', top:'14%',w:'12%',h:'13%'},{n:2,cap:2,l:'22%',top:'14%',w:'12%',h:'13%'},
            {n:3,cap:4,l:'40%',top:'14%',w:'18%',h:'12%'},{n:4,cap:4,l:'63%',top:'14%',w:'18%',h:'12%'},
            {n:5,cap:2,l:'6%', top:'44%',w:'12%',h:'13%'},{n:6,cap:4,l:'25%',top:'44%',w:'30%',h:'12%'},
            {n:7,cap:2,l:'70%',top:'44%',w:'12%',h:'13%'},
        ],
        taras: [
            {n:1,cap:4,l:'5%', top:'18%',w:'18%',h:'12%'},{n:2,cap:4,l:'29%',top:'18%',w:'18%',h:'12%'},
            {n:3,cap:6,l:'55%',top:'18%',w:'23%',h:'12%'},{n:4,cap:4,l:'5%', top:'54%',w:'18%',h:'12%'},
            {n:5,cap:4,l:'29%',top:'54%',w:'18%',h:'12%'},
        ],
    };

    // ── init: check session status on page load ───────────────────────────────
    async function init() {
        try { return await _get('/auth/status'); }
        catch { return { authenticated: false }; }
    }

    // ── Auth ──────────────────────────────────────────────────────────────────
    async function authenticate(username, password) {
        try {
            const res = await _post('/login', { username, password });
            return res.success ? res.user : null;
        } catch { return null; }
    }
    async function logout() {
        try { await _post('/logout', {}); } catch { /* ignore */ }
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    async function getUsers() {
        try { return await _get('/users'); }
        catch { return []; }
    }
    async function addUser(username, password) {
        try { await _post('/users', { username, password }); return true; }
        catch { return false; }
    }
    // changePassword(username, oldPassword, newPassword) — server verifies old pw
    async function changePassword(username, oldPassword, newPassword) {
        try { await _put(`/users/${username}/password`, { oldPassword, newPassword }); return true; }
        catch { return false; }
    }

    // ── Reservations ──────────────────────────────────────────────────────────
    async function saveReservation(reservation) {
        try { await _post('/reservations', reservation); return true; }
        catch { return false; }
    }
    async function getReservations(filter = {}) {
        try {
            const p = new URLSearchParams();
            if (filter.status) p.set('status', filter.status);
            if (filter.hall)   p.set('hall',   filter.hall);
            const qs = p.toString();
            return await _get('/reservations' + (qs ? '?' + qs : ''));
        } catch { return []; }
    }
    async function updateStatus(id, status) {
        try { await _put(`/reservations/${id}/status`, { status }); return true; }
        catch { return false; }
    }
    async function getById(id) {
        try {
            const all = await getReservations();
            return all.find(r => r.id === id) || null;
        } catch { return null; }
    }
    async function searchReservations(q, hall) {
        try {
            const p = new URLSearchParams();
            if (q)    p.set('q',    q);
            if (hall) p.set('hall', hall);
            return await _get('/reservations/search?' + p.toString());
        } catch { return []; }
    }

    // ── Public: zajętość stolików dla danej sali i daty (bez logowania) ──────
    // Zwraca listę {tableNum, time, duration} - bez danych osobowych.
    async function getBusyTables(hall, date) {
        try { return await _get(`/reservations/busy/${hall}/${date}`); }
        catch { return []; }
    }

    // ── Floor layouts ─────────────────────────────────────────────────────────
    async function getLayout(hall) {
        try {
            const data = await _get(`/layouts/${hall}`);
            return (data && data.length) ? data : (DEFAULT_LAYOUTS[hall] || []);
        } catch { return DEFAULT_LAYOUTS[hall] || []; }
    }
    async function saveLayout(hall, tables) {
        try { await _post(`/layouts/${hall}`, { tables }); return true; }
        catch { return false; }
    }
    async function resetLayout(hall) {
        try { await _post(`/layouts/${hall}`, { tables: DEFAULT_LAYOUTS[hall] || [] }); return true; }
        catch { return false; }
    }
    async function clearLayout(hall) {
        try { await _post(`/layouts/${hall}`, { tables: [] }); return true; }
        catch { return false; }
    }

    // ── Floor elements ────────────────────────────────────────────────────────
    async function getFloorElements(hall) {
        try { return await _get(`/elements/${hall}`); }
        catch { return []; }
    }
    async function saveFloorElements(hall, elements) {
        try { await _post(`/elements/${hall}`, { elements }); return true; }
        catch { return false; }
    }

    // ── Templates ─────────────────────────────────────────────────────────────
    async function getTemplates(hall) {
        try { return await _get(`/templates/${hall}`); }
        catch { return [null, null, null]; }
    }
    async function saveTemplate(hall, slot, name, tables, elements) {
        try { await _post(`/templates/${hall}/${slot}`, { name, tables, elements }); return true; }
        catch { return false; }
    }
    async function loadTemplate(hall, slot) {
        try {
            const slots = await getTemplates(hall);
            return slots[slot] || null;
        } catch { return null; }
    }

    // ── Manual block ──────────────────────────────────────────────────────────
    async function saveBlock(block) {
        return saveReservation({ ...block, source: 'manual', status: 'confirmed' });
    }

    return {
        init,
        authenticate, logout,
        getUsers, addUser, changePassword,
        saveReservation, getReservations, updateStatus, getById, searchReservations,
        getBusyTables,
        getLayout, saveLayout, resetLayout, clearLayout,
        getFloorElements, saveFloorElements,
        getTemplates, saveTemplate, loadTemplate,
        saveBlock,
    };
})();