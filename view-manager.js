/**
 * view-manager.js — Dworek Biała Dama
 * Manager panel logic:
 *   - Authentication (login / logout)
 *   - Dashboard panel switching
 *   - Reservation lists and status management
 *   - Statistics rendering
 *   - Layout editor with drag-and-drop (FIXED)
 *   - User management
 * Depends on: db.js, view-data.js
 */

// === MANAGER AUTH
// ============================================================

const MgrAuth = { user: null, isLoggedIn() { return !!this.user; }, login(u){this.user=u;}, logout(){this.user=null;} };

function showManagerLogin() {
    document.getElementById('manager-login-overlay').classList.remove('hidden');
    document.getElementById('mlogin-username').value = '';
    document.getElementById('mlogin-password').value = '';
    document.getElementById('mlogin-error').classList.remove('show');
    setTimeout(() => document.getElementById('mlogin-username').focus(), 100);
}
function hideManagerLogin() { document.getElementById('manager-login-overlay').classList.add('hidden'); }
async function doManagerLogin() {
    const u = document.getElementById('mlogin-username').value.trim();
    const p = document.getElementById('mlogin-password').value;
    const user = await DB.authenticate(u, p);
    if (!user) { document.getElementById('mlogin-error').classList.add('show'); return; }
    document.getElementById('mlogin-error').classList.remove('show');
    MgrAuth.login(user);
    hideManagerLogin();
    openManagerDashboard();
}
async function doManagerLogout() { await DB.logout(); MgrAuth.logout(); document.getElementById('manager-dashboard').classList.add('hidden'); showToast('Wylogowano pomyślnie.'); }

function openManagerDashboard() {
    const u = MgrAuth.user;
    if (!u) return;
    document.getElementById('mgr-username-display').textContent = u.username;
    document.getElementById('mgr-role-display').textContent = u.role === 'admin' ? 'Administrator' : 'Pracownik';
    const addUserBtn = document.getElementById('nav-add-user');
    if (addUserBtn) addUserBtn.style.display = u.role === 'admin' ? '' : 'none';
    document.getElementById('manager-dashboard').classList.remove('hidden');
    showMgrPanel('map');
    refreshBadges();
}


// ============================================================
// === MANAGER PANEL SWITCHING
// ============================================================

function showMgrPanel(panelId) {
    document.querySelectorAll('.manager-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.manager-nav-item').forEach(i => i.classList.remove('active'));
    const panel = document.getElementById('mgr-panel-' + panelId);
    if (panel) panel.classList.add('active');
    const sideItem = document.querySelector(`.manager-nav-item[onclick*="'${panelId}'"]`);
    if (sideItem) sideItem.classList.add('active');
    if (panelId === 'map') {
        _mgrCurrentHall = 'kominkowa';
        renderMgrMap('kominkowa');
        // Wire click-to-block on free tables
        setTimeout(() => {
            const mapEl = document.getElementById('mgr-floor-map');
            if (mapEl) { mapEl.removeEventListener('click', handleMgrMapClick); mapEl.addEventListener('click', handleMgrMapClick); }
        }, 100);
    }
    if (panelId === 'active')    refreshMgrPanel('active');
    if (panelId === 'pending')   refreshMgrPanel('pending');
    if (panelId === 'cancelled') refreshMgrPanel('cancelled');
    if (panelId === 'history')   refreshMgrPanel('history');
    if (panelId === 'stats')     renderMgrStats();
    if (panelId === 'layout')    initLayoutEditor('kominkowa');
    if (panelId === 'adduser')   renderUsersList();
    if (panelId === 'changepass') { ['cp-old','cp-new','cp-new2'].forEach(id => { const el=document.getElementById(id); if(el)el.value=''; }); const m=document.getElementById('chpass-msg'); if(m)m.style.display='none'; }
}

async function refreshBadges() {
    const pb = document.getElementById('badge-pending');
    const ab = document.getElementById('badge-active');
    const [pending, confirmed] = await Promise.all([
        DB.getReservations({ status: 'pending' }),
        DB.getReservations({ status: 'confirmed' })
    ]);
    // Badge counts only show FUTURE reservations (not yet expired)
    if (pb) pb.textContent = pending.filter(r   => !_isExpired(r)).length;
    if (ab) ab.textContent = confirmed.filter(r => !_isExpired(r)).length;
}


// ============================================================
// === RESERVATION TIME HELPERS
// ============================================================

/**
 * Returns true if the reservation has fully ended.
 * end_time = date + time + duration (hours)
 * Example: 2026-06-28, 13:00, 1.5h → ends at 14:30
 *          If now > 14:30 → expired
 */
function _isExpired(r) {
    if (!r.date || !r.time) return false;
    const [h, m] = (r.time || '00:00').split(':').map(Number);
    const startMs = new Date(r.date + 'T' + r.time + ':00').getTime();
    const endMs   = startMs + Math.round((r.duration || 2) * 60 * 60 * 1000);
    return Date.now() > endMs;
}

/** True if reservation is currently active (started but not ended) */
function _isOngoing(r) {
    if (!r.date || !r.time) return false;
    const startMs = new Date(r.date + 'T' + r.time + ':00').getTime();
    const endMs   = startMs + Math.round((r.duration || 2) * 60 * 60 * 1000);
    const now     = Date.now();
    return now >= startMs && now <= endMs;
}

// ============================================================
// === MANAGER MAP (read-only, with time filter input)
// ============================================================

let _mgrCurrentHall = 'kominkowa';

function setMgrHall(hall, btn) {
    _mgrCurrentHall = hall;
    document.querySelectorAll('.mgr-map-controls .mgr-hall-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderMgrMap(hall);
}

async function renderMgrMap(hall) {
    _mgrCurrentHall = hall;
    const container = document.getElementById('mgr-floor-map');
    if (!container) return;
    const today      = new Date().toISOString().slice(0,10);
    const filterDate = document.getElementById('mgr-map-date')?.value || today;
    const filterTime = document.getElementById('mgr-map-time')?.value || '';

    const [tables, elements, allRes] = await Promise.all([
        DB.getLayout(hall),
        DB.getFloorElements(hall),
        DB.getReservations()
    ]);

    // Build statusMap: tableNum -> 'pending' | 'confirmed'
    // Exclude expired reservations — their time slot has already passed
    const activeRes = allRes.filter(r =>
        r.hall === hall && r.date === filterDate &&
        r.status !== 'cancelled' && !_isExpired(r)
    );
    // If time filter is on, narrow to overlapping slots
    const filtered = filterTime
        ? activeRes.filter(r => {
            const rStart = _timeToMinutes(r.time);
            const rEnd   = rStart + Math.round((r.duration || 2) * 60);
            const fStart = _timeToMinutes(filterTime);
            const fEnd   = fStart + 120;
            return fStart < rEnd && fEnd > rStart;
          })
        : activeRes;

    const statusMap = {};
    filtered.forEach(r => {
        const existing = statusMap[r.tableNum];
        // confirmed/blocked always wins over pending
        if (!existing || existing === 'pending') {
            statusMap[r.tableNum] = (r.status === 'pending') ? 'pending' : 'confirmed';
        }
    });

    const busySet = new Set(Object.keys(statusMap).map(Number));
    container.innerHTML = _buildMapHTML(tables, elements, busySet, 'manager', statusMap);

    // Re-wire click-to-block so clicking a free table opens the manual block modal
    container.removeEventListener('click', handleMgrMapClick);
    container.addEventListener('click', handleMgrMapClick);
}


// ============================================================
// === RESERVATION LISTS
// ============================================================

const HALL_NAMES = { kominkowa:'Złota Paproć', lesna:'Sala Leśna', taras:'Taras' };

async function refreshMgrPanel(type) {
    let reservations = [];
    let containerId  = '';

    if (type === 'active') {
        // Confirmed reservations that have NOT yet ended
        const all = await DB.getReservations({ status: 'confirmed' });
        reservations = all.filter(r => !_isExpired(r));
        containerId  = 'mgr-list-active';

    } else if (type === 'pending') {
        // Pending reservations that have NOT yet ended
        const all = await DB.getReservations({ status: 'pending' });
        reservations = all.filter(r => !_isExpired(r));
        containerId  = 'mgr-list-pending';

    } else if (type === 'cancelled') {
        reservations = await DB.getReservations({ status: 'cancelled' });
        containerId  = 'mgr-list-cancelled';

    } else if (type === 'history') {
        // History = all expired (past) reservations + all cancelled
        const q    = document.getElementById('hist-search')?.value  || '';
        const hall = document.getElementById('hist-filter-hall')?.value || '';
        const all  = await DB.searchReservations(q, hall);
        // Show: past (any status except cancelled) + all cancelled
        reservations = all.filter(r =>
            r.status === 'cancelled' || _isExpired(r)
        );
        containerId = 'mgr-list-history';
    }
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!reservations.length) {
        container.innerHTML = `<div style="text-align:center;padding:50px;color:var(--text-light)"><i class="fas fa-calendar-times" style="font-size:3rem;margin-bottom:14px;display:block;color:var(--glass-border)"></i>Brak rezerwacji do wyświetlenia</div>`;
        return;
    }
    const rows = reservations.map(r => `
        <tr>
            <td><span class="res-id-badge">${r.id}</span></td>
            <td>${r.date}</td>
            <td>${r.time}</td>
            <td>${r.duration ? r.duration+'h' : '—'}</td>
            <td>${r.fname} ${r.lname}</td>
            <td>${HALL_NAMES[r.hall]||r.hall}</td>
            <td>Stolik ${r.tableNum}</td>
            <td>${r.guests}</td>
            <td><span class="status-pill ${r.status}">${statusLabel(r.status)}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" onclick="showResDetail('${r.id}')"><i class="fas fa-eye"></i></button>
                    ${r.status==='pending'   ? `<button class="action-btn confirm" onclick="changeResStatus('${r.id}','confirmed','${type}')"><i class="fas fa-check"></i> Potwierdź</button>` : ''}
                    ${r.status!=='cancelled' ? `<button class="action-btn cancel"  onclick="changeResStatus('${r.id}','cancelled','${type}')"><i class="fas fa-times"></i> Anuluj</button>` : ''}
                </div>
            </td>
        </tr>`).join('');
    container.innerHTML = `<div class="res-table-wrap"><table class="data-table"><thead><tr>
        <th>ID</th><th>Data</th><th>Godz.</th><th>Czas</th><th>Gość</th><th>Sala</th><th>Stolik</th><th>Goście</th><th>Status</th><th>Akcje</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
    refreshBadges();
}

function statusLabel(s) {
    if (s==='confirmed') return '<i class="fas fa-check-circle"></i> Potwierdzona';
    if (s==='pending')   return '<i class="fas fa-clock"></i> Oczekująca';
    if (s==='cancelled') return '<i class="fas fa-times-circle"></i> Anulowana';
    return s;
}
async function changeResStatus(id, newStatus, refreshPanel) {
    await DB.updateStatus(id, newStatus);
    refreshMgrPanel(refreshPanel);
    if (_mgrCurrentHall) renderMgrMap(_mgrCurrentHall);
    showToast(newStatus==='confirmed' ? 'Rezerwacja potwierdzona.' : 'Rezerwacja anulowana.');
}

async function showResDetail(id) {
    const r = await DB.getById(id); if (!r) return;
    const overlay = document.getElementById('res-detail-modal');
    const body    = document.getElementById('res-modal-body');
    if (!overlay||!body) return;
    let mealsHtml='';
    for (let i=1; i<=(r.guests||1); i++) {
        const meals=(r.personMeals||{})[i]||[];
        if (meals.length) {
            const names=meals.map(id=>MENU_DATA.find(m=>m.id===id)?.name).filter(Boolean).join(', ');
            mealsHtml+=`<div class="confirm-row"><span class="c-label">Osoba ${i}</span><span class="c-value" style="font-size:0.85rem">${names}</span></div>`;
        }
    }
    body.innerHTML=`
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <div class="res-id-badge" style="font-size:1rem;padding:6px 14px">${r.id}</div>
            <span class="status-pill ${r.status}">${statusLabel(r.status)}</span>
        </div>
        <div class="confirm-details">
            <div class="confirm-row"><span class="c-label">Sala</span><span class="c-value">${HALL_NAMES[r.hall]||r.hall}</span></div>
            <div class="confirm-row"><span class="c-label">Stolik</span><span class="c-value">Nr ${r.tableNum} (do ${r.tableCapacity} os.)</span></div>
            <div class="confirm-row"><span class="c-label">Data</span><span class="c-value">${r.date}</span></div>
            <div class="confirm-row"><span class="c-label">Godzina</span><span class="c-value">${r.time}</span></div>
            <div class="confirm-row"><span class="c-label">Czas trwania</span><span class="c-value">${r.duration ? r.duration+'h' : '—'}</span></div>
            <div class="confirm-row"><span class="c-label">Liczba gości</span><span class="c-value">${r.guests} os.</span></div>
            <div class="confirm-row"><span class="c-label">Gość</span><span class="c-value">${r.fname} ${r.lname}</span></div>
            <div class="confirm-row"><span class="c-label">Telefon</span><span class="c-value">${r.phone}</span></div>
            ${r.email?`<div class="confirm-row"><span class="c-label">E-mail</span><span class="c-value">${r.email}</span></div>`:''}
            ${r.notes?`<div class="confirm-row"><span class="c-label">Uwagi</span><span class="c-value" style="font-size:0.85rem">${r.notes}</span></div>`:''}
            ${mealsHtml}
            <div class="confirm-row"><span class="c-label">Utworzono</span><span class="c-value" style="font-size:0.82rem">${new Date(r.createdAt).toLocaleString('pl-PL')}</span></div>
        </div>
        ${r.status!=='cancelled'?`<div style="display:flex;gap:12px;margin-top:16px">
            ${r.status==='pending'?`<button class="btn-primary" onclick="changeResStatus('${r.id}','confirmed','active');closeResModal()"><i class="fas fa-check"></i> Potwierdź</button>`:''}
            <button class="action-btn cancel" style="padding:10px 18px;font-size:0.88rem" onclick="changeResStatus('${r.id}','cancelled','history');closeResModal()"><i class="fas fa-times"></i> Anuluj</button>
        </div>`:''}`;
    overlay.classList.add('open');
}
function closeResModal() { document.getElementById('res-detail-modal').classList.remove('open'); }
document.addEventListener('click', e => { if (e.target.id==='res-detail-modal') closeResModal(); });


// ============================================================
// === STATISTICS
// ============================================================

async function renderMgrStats() {
    const all=await DB.getReservations();
    const confirmed=all.filter(r=>r.status==='confirmed').length;
    const pending=all.filter(r=>r.status==='pending').length;
    const cancelled=all.filter(r=>r.status==='cancelled').length;
    const today=new Date().toISOString().slice(0,10);
    const todayRes=all.filter(r=>r.date===today).length;
    const statsRow=document.getElementById('mgr-stats-row');
    if(statsRow) statsRow.innerHTML=`
        <div class="stat-box"><div class="sb-icon"><i class="fas fa-calendar-alt"></i></div><div class="sb-val">${all.length}</div><div class="sb-lbl">Wszystkie</div></div>
        <div class="stat-box"><div class="sb-icon"><i class="fas fa-check-circle"></i></div><div class="sb-val">${confirmed}</div><div class="sb-lbl">Potwierdzone</div></div>
        <div class="stat-box"><div class="sb-icon"><i class="fas fa-clock"></i></div><div class="sb-val">${pending}</div><div class="sb-lbl">Oczekujące</div></div>
        <div class="stat-box"><div class="sb-icon"><i class="fas fa-calendar-day"></i></div><div class="sb-val">${todayRes}</div><div class="sb-lbl">Dziś</div></div>`;
    const hallCounts={kominkowa:0,lesna:0,taras:0};
    all.forEach(r=>{if(hallCounts[r.hall]!==undefined)hallCounts[r.hall]++;});
    const maxH=Math.max(...Object.values(hallCounts),1);
    const hallsEl=document.getElementById('mgr-chart-halls');
    if(hallsEl) hallsEl.innerHTML=Object.entries(hallCounts).map(([h,c])=>`
        <div class="chart-bar-row"><div class="chart-bar-label">${HALL_NAMES[h]||h}</div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(c/maxH*100)}%"><span>${c>0?c:''}</span></div></div>
        <div class="chart-bar-val">${c}</div></div>`).join('');
    const statusCounts={confirmed,pending,cancelled};
    const maxS=Math.max(confirmed,pending,cancelled,1);
    const statusEl=document.getElementById('mgr-chart-status');
    if(statusEl) statusEl.innerHTML=[
        {key:'confirmed',label:'Potwierdzone',color:'#48bb78'},
        {key:'pending',  label:'Oczekujące',  color:'#eab308'},
        {key:'cancelled',label:'Anulowane',   color:'#f56565'},
    ].map(s=>`<div class="chart-bar-row"><div class="chart-bar-label">${s.label}</div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(statusCounts[s.key]/maxS*100)}%;background:${s.color}"><span>${statusCounts[s.key]>0?statusCounts[s.key]:''}</span></div></div>
        <div class="chart-bar-val">${statusCounts[s.key]}</div></div>`).join('');
}


// ============================================================
// === LAYOUT EDITOR
// ============================================================

let _layoutHall     = 'kominkowa';
let _layoutTables   = [];
let _layoutElements = [];
let _dragType       = 'table';   // 'table' | 'element'
let _dragIdx        = null;      // array index of dragged item
let _activeEl       = null;      // direct DOM reference to dragged element
let _dragOffX       = 0;
let _dragOffY       = 0;
let _selectedLayoutIdx = null;
let _selectedElIdx     = null;   // selected floor-element index

// ── Size helpers ───────────────────────────────────────────────────────────
// Returns {w, h} CSS percentages based on seating capacity.
// Smaller cap → square; larger cap → wider rectangle.
function tableSize(cap) {
    if (cap <= 2)  return { w: '12%', h: '13%' };   // 2-person: square-ish
    if (cap <= 4)  return { w: '18%', h: '12%' };   // 4-person: rectangle
    if (cap <= 6)  return { w: '23%', h: '12%' };   // 6-person: longer
    if (cap <= 8)  return { w: '28%', h: '12%' };   // 8-person: long
    return            { w: '34%', h: '12%' };        // 9+: very long
}

function setLayoutHall(hall, btn) {
    _layoutHall = hall;
    _currentTemplateSlot = 0;
    document.querySelectorAll('#mgr-panel-layout .mgr-map-controls .mgr-hall-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    initLayoutEditor(hall);
}

async function initLayoutEditor(hall) {
    _layoutHall          = hall;
    _currentTemplateSlot = 0;
    _dragIdx             = null;
    _activeEl            = null;
    _selectedLayoutIdx   = null;
    _selectedElIdx       = null;
    const [tables, elements] = await Promise.all([DB.getLayout(hall), DB.getFloorElements(hall)]);
    _layoutTables   = JSON.parse(JSON.stringify(tables));
    _layoutElements = JSON.parse(JSON.stringify(elements));
    renderLayoutMap();
    await renderTemplateBtns();
    _attachLayoutEditorListeners();
}

function renderLayoutMap() {
    const container = document.getElementById('layout-floor-map');
    if (!container) return;
    let html = '';

    // ── Floor elements ──
    _layoutElements.forEach((el, idx) => {
        let cls = '';
        if      (el.type === 'entrance') cls = 'fe-entrance';
        else if (el.type === 'window')   cls = 'fe-window';
        else if (el.type === 'obstacle') cls = 'fe-obstacle';
        const elRot = el.rotation || 0;
        const elSel = idx === _selectedElIdx ? ' selected-el' : '';
        html += `<div class="floor-element ${cls} drag-mode${elSel}"
             id="lel-${idx}" data-el-idx="${idx}"
             style="left:${el.l};top:${el.t};width:${el.w};height:${el.h};transform:rotate(${elRot}deg)"
             title="Klik=zaznacz • Przeciągnij=przesuń • Dbl-klik=obróć • PPM=usuń">
            ${el.type === 'entrance' ? '<i class="fas fa-door-open" style="pointer-events:none"></i>' : ''}
            ${el.type === 'window'   ? '<i class="fas fa-border-all" style="pointer-events:none"></i>' : ''}
            <span style="pointer-events:none">${el.label || ''}</span>
        </div>`;
    });

    // ── Tables ──
    _layoutTables.forEach((t, idx) => {
        const isSelected = idx === _selectedLayoutIdx;
        html += `<div class="mgr-table free drag-mode${isSelected ? ' selected-layout' : ''}"
             id="lt-${idx}" data-tbl-idx="${idx}"
             style="left:${t.l};top:${t.top};width:${t.w};height:${t.h}"
             title="Przeciągnij=przesuń • Dbl-klik=obróć • PPM=usuń">
            <span style="pointer-events:none;font-size:1.1rem;font-family:'Cormorant Garamond',serif">${t.n}</span>
            <span style="pointer-events:none;font-size:0.65rem;opacity:0.85">${t.cap} os.</span>
        </div>`;
    });

    container.innerHTML = html;
    // NOTE: All interaction is handled by delegated listeners on the container
    // (attached in _attachLayoutEditorListeners). No per-element listeners needed.
}

// ── Event delegation ───────────────────────────────────────────────────────
// Attach THREE listeners to the MAP CONTAINER (not to individual tables).
// Because the container itself never gets replaced, these listeners survive
// every call to renderLayoutMap() — fixing the "only first table moves" bug.
function _attachLayoutEditorListeners() {
    const map = document.getElementById('layout-floor-map');
    if (!map) return;

    // Remove previous instances to avoid duplicates when initLayoutEditor is called again
    map.removeEventListener('mousedown',   _onLayoutMousedown);
    map.removeEventListener('contextmenu', _onLayoutContextmenu);
    map.removeEventListener('dblclick',    _onLayoutDblclick);

    map.addEventListener('mousedown',   _onLayoutMousedown);
    map.addEventListener('contextmenu', _onLayoutContextmenu);
    map.addEventListener('dblclick',    _onLayoutDblclick);
}

function _onLayoutMousedown(e) {
    // Walk up from click target to find table or floor-element
    const tblEl = e.target.closest('.mgr-table');
    const fElEl = e.target.closest('.floor-element');

    if (tblEl) {
        e.preventDefault();
        const idx = parseInt(tblEl.dataset.tblIdx);
        if (isNaN(idx)) return;
        // Highlight selection
        _selectedLayoutIdx = idx;
        document.querySelectorAll('#layout-floor-map .mgr-table').forEach(el => {
            el.classList.remove('selected-layout');
        });
        tblEl.classList.add('selected-layout');
        // Start drag — store direct DOM reference to avoid getElementById in mousemove
        _dragType = 'table';
        _dragIdx  = idx;
        _activeEl = tblEl;
        const er  = tblEl.getBoundingClientRect();
        _dragOffX = e.clientX - er.left;
        _dragOffY = e.clientY - er.top;
        tblEl.style.cursor = 'grabbing';
        tblEl.style.zIndex = 100;
    } else if (fElEl) {
        e.preventDefault();
        const idx = parseInt(fElEl.dataset.elIdx);
        if (isNaN(idx)) return;
        // Podświetl wybrany element, odznacz pozostałe
        _selectedElIdx = idx;
        document.querySelectorAll('#layout-floor-map .floor-element').forEach(el => {
            el.classList.remove('selected-el');
        });
        fElEl.classList.add('selected-el');
        _dragType = 'element';
        _dragIdx  = idx;
        _activeEl = fElEl;
        const er  = fElEl.getBoundingClientRect();
        _dragOffX = e.clientX - er.left;
        _dragOffY = e.clientY - er.top;
        fElEl.style.cursor = 'grabbing';
        fElEl.style.zIndex = 100;
    }
}

function _onLayoutContextmenu(e) {
    e.preventDefault();
    const tblEl = e.target.closest('.mgr-table');
    const fElEl = e.target.closest('.floor-element');
    if (tblEl) {
        const idx = parseInt(tblEl.dataset.tblIdx);
        if (!isNaN(idx)) removeLayoutTable(e, idx);
    } else if (fElEl) {
        const idx = parseInt(fElEl.dataset.elIdx);
        if (!isNaN(idx)) removeLayoutEl(e, idx);
    }
}

function _onLayoutDblclick(e) {
    const tblEl = e.target.closest('.mgr-table');
    const fElEl = e.target.closest('.floor-element');
    if (tblEl) {
        e.preventDefault();
        const idx = parseInt(tblEl.dataset.tblIdx);
        if (!isNaN(idx)) rotateLayoutTable(idx);
    } else if (fElEl) {
        e.preventDefault();
        const idx = parseInt(fElEl.dataset.elIdx);
        if (!isNaN(idx)) rotateLayoutElement(idx);
    }
}

// ── Document-level mousemove + mouseup (attached once in view-init.js) ──────
function _initLayoutDragListeners() {
    document.addEventListener('mousemove', function(e) {
        if (_dragIdx === null || !_activeEl) return;
        const map = document.getElementById('layout-floor-map');
        if (!map) return;
        const mr = map.getBoundingClientRect();
        let x = e.clientX - mr.left - _dragOffX;
        let y = e.clientY - mr.top  - _dragOffY;
        x = Math.max(0, Math.min(x, mr.width  - _activeEl.offsetWidth));
        y = Math.max(0, Math.min(y, mr.height - _activeEl.offsetHeight));
        const lp = (x / mr.width  * 100).toFixed(1) + '%';
        const tp = (y / mr.height * 100).toFixed(1) + '%';
        _activeEl.style.left = lp;
        _activeEl.style.top  = tp;
        if (_dragType === 'table') {
            _layoutTables[_dragIdx].l   = lp;
            _layoutTables[_dragIdx].top = tp;
        } else {
            _layoutElements[_dragIdx].l = lp;
            _layoutElements[_dragIdx].t = tp;
        }
    });
    document.addEventListener('mouseup', function() {
        if (!_activeEl) return;
        _activeEl.style.cursor = 'grab';
        _activeEl.style.zIndex = 2;
        _activeEl = null;
        _dragIdx  = null;
    });
}

// ── Legacy stubs (kept so any stray calls don't throw) ──────────────────────
function startDragTable() {}
function startDragEl()    {}
function onDragMove()     {}
function stopDrag()       {}
function selectLayoutTable(idx) {
    _selectedLayoutIdx = idx;
    document.querySelectorAll('#layout-floor-map .mgr-table').forEach((el, i) => {
        el.classList.toggle('selected-layout', i === idx);
    });
}



// Rotate selected table (or prompt if none selected)
function rotateSelectedOrAll() {
    if (_selectedLayoutIdx !== null && _layoutTables[_selectedLayoutIdx]) {
        rotateLayoutTable(_selectedLayoutIdx);
    } else {
        showToast('Najpierw kliknij na stolik, który chcesz obrócić — lub kliknij podwójnie bezpośrednio na stolik.');
    }
}

// Rotate table: swap width ↔ height (toggle horizontal/vertical orientation)
function rotateLayoutTable(idx) {
    const t = _layoutTables[idx];
    if (!t) return;
    // Swap width ↔ height to toggle horizontal/vertical orientation
    [ t.w, t.h ] = [ t.h, t.w ];
    // Preserve selection highlight after re-render
    _selectedLayoutIdx = idx;
    renderLayoutMap();
    showToast(`Stolik ${t.n}: obrócono`);
}

// Obróć element (drzwi/okno/bar/dekoracja) o 90° przy każdym dbl-kliku
function rotateLayoutElement(idx) {
    const el = _layoutElements[idx];
    if (!el) return;
    el.rotation = ((el.rotation || 0) + 90) % 360;
    _selectedElIdx = idx;
    renderLayoutMap();
    showToast(`${el.label || 'Element'}: obrócono o 90°`);
}

function addLayoutTable() {
    const cap  = parseInt(document.getElementById('new-table-cap')?.value) || 4;
    const nextN = _layoutTables.length ? Math.max(..._layoutTables.map(t => t.n)) + 1 : 1;
    const sz   = tableSize(cap);
    // Stagger new tables so they don't all pile on top of each other
    const offset = (_layoutTables.length % 5) * 8;
    _layoutTables.push({ n: nextN, cap, l: (10 + offset) + '%', top: (15 + offset) + '%', w: sz.w, h: sz.h });
    renderLayoutMap();
}
function removeLayoutTable(e, idx) {
    e.preventDefault();
    if (!confirm(`Usunąć stolik nr ${_layoutTables[idx]?.n}?`)) return;
    _layoutTables.splice(idx,1); renderLayoutMap();
}
function clearLayoutHall() {
    if (!confirm('Usunąć WSZYSTKIE stoliki i elementy (wejście, okna, bary) z tej sali?')) return;
    _layoutTables   = [];
    _layoutElements = [];
    renderLayoutMap();
    showToast('Sala wyczyszczona.');
}
async function saveLayoutTables() {
    const slot = _currentTemplateSlot;
    const tplName = document.getElementById(`tpl-name-${slot}`)?.value?.trim()
        || (slot === 0 ? 'Domyślny' : `Szablon ${slot + 1}`);
    await Promise.all([
        DB.saveLayout(_layoutHall, _layoutTables),
        DB.saveFloorElements(_layoutHall, _layoutElements),
        DB.saveTemplate(_layoutHall, slot, tplName, _layoutTables, _layoutElements)
    ]);
    renderMgrMap(_layoutHall);
    renderTemplateBtns();
    showSaveConfirmation(tplName);
}

function showSaveConfirmation(tplName) {
    const el = document.getElementById('tpl-save-confirm');
    if (!el) return;
    el.textContent = `✓ Szablon „${tplName}" został zapisany pomyślnie!`;
    el.style.display = 'block';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ─── TEMPLATE SYSTEM ────────────────────────────────────────────────────────
// 3 slots per hall: slot 0 = "Domyślny", slots 1-2 = custom

let _currentTemplateSlot = 0;

async function renderTemplateBtns() {
    const bar = document.getElementById('template-bar');
    if (!bar) return;
    const templates = await DB.getTemplates(_layoutHall);
    bar.innerHTML = templates.map((tpl, slot) => {
        const isActive = slot === _currentTemplateSlot;
        const label    = tpl ? tpl.name : (slot === 0 ? 'Domyślny' : `Szablon ${slot + 1}`);
        const isEmpty  = !tpl;
        return `
        <div class="tpl-slot ${isActive ? 'active' : ''} ${isEmpty ? 'empty' : ''}">
            <button class="tpl-load-btn" onclick="loadTemplateSlot(${slot})" title="${isEmpty ? 'Pusty slot' : 'Wczytaj szablon'}">
                <i class="fas fa-layer-group" style="margin-right:5px"></i>${label}
                ${isEmpty ? '<span class="tpl-empty-badge">pusty</span>' : ''}
            </button>
            <input type="text" class="tpl-name-input" id="tpl-name-${slot}"
                   value="${tpl ? tpl.name : ''}"
                   placeholder="${slot === 0 ? 'Domyślny' : 'Nazwa szablonu...'}"
                   ${slot === 0 ? '' : ''}
                   onfocus="selectTemplateSlot(${slot})"
                   title="Edytuj nazwę szablonu">
            <button class="tpl-save-btn" onclick="saveToTemplateSlot(${slot})" title="Zapisz bieżący układ jako ten szablon">
                <i class="fas fa-save"></i>
            </button>
        </div>`;
    }).join('');
}

function selectTemplateSlot(slot) {
    _currentTemplateSlot = slot;
    renderTemplateBtns();
}

async function loadTemplateSlot(slot) {
    const tpl = await DB.loadTemplate(_layoutHall, slot);
    if (!tpl) { await saveToTemplateSlot(slot); return; }
    if (_layoutTables.length > 0) {
        if (!confirm(`Wczytać szablon „${tpl.name}"? Niezapisane zmiany zostaną utracone.`)) return;
    }
    _currentTemplateSlot = slot;
    _layoutTables   = JSON.parse(JSON.stringify(tpl.tables));
    _layoutElements = JSON.parse(JSON.stringify(tpl.elements || []));
    renderLayoutMap();
    await renderTemplateBtns();
    showToast(`Wczytano szablon: ${tpl.name}`);
}

async function saveToTemplateSlot(slot) {
    _currentTemplateSlot = slot;
    const nameEl = document.getElementById(`tpl-name-${slot}`);
    const name   = nameEl?.value?.trim() || (slot === 0 ? 'Domyślny' : `Szablon ${slot + 1}`);
    await Promise.all([
        DB.saveTemplate(_layoutHall, slot, name, _layoutTables, _layoutElements),
        DB.saveLayout(_layoutHall, _layoutTables),
        DB.saveFloorElements(_layoutHall, _layoutElements)
    ]);
    renderMgrMap(_layoutHall);
    await renderTemplateBtns();
    showSaveConfirmation(name);
}

async function resetLayoutTables() {
    if (!confirm('Zresetować układ do domyślnego?')) return;
    await DB.resetLayout(_layoutHall);
    await initLayoutEditor(_layoutHall);
    showToast('Układ zresetowany.');
}

// Floor elements
function addFloorElement(type) {
    const labelMap = {entrance:'Wejście', window:'Okno', obstacle:'Bar'};
    const labelInput = prompt(`Etykieta dla "${labelMap[type]}":`, labelMap[type]);
    if (labelInput === null) return;
    _layoutElements.push({type, label:labelInput||labelMap[type], l:'5%', t:'5%', w:'14%', h:'10%'});
    renderLayoutMap();
}
function removeLayoutEl(e, idx) {
    e.preventDefault();
    if (!confirm(`Usunąć element "${_layoutElements[idx]?.label}"?`)) return;
    _layoutElements.splice(idx,1); renderLayoutMap();
}


// ─── MANUAL TABLE BLOCK (walk-in / phone reservation) ────────────────────────

let _blockTargetTable = null;

function openManualBlockModal(tableNum) {
    _blockTargetTable = tableNum;
    const modal = document.getElementById('manual-block-modal');
    if (!modal) return;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('block-date').value = today;
    document.getElementById('block-time').value = '';
    document.getElementById('block-duration').value = '';
    document.getElementById('block-fname').value = '';
    document.getElementById('block-lname').value = '';
    document.getElementById('block-phone').value = '';
    document.getElementById('block-notes').value = '';
    document.getElementById('block-error').style.display = 'none';

    const hallName = _mgrCurrentHall === 'kominkowa' ? 'Złota Paproć'
                   : _mgrCurrentHall === 'lesna'     ? 'Sala Leśna' : 'Taras';
    document.getElementById('block-hall-name').textContent = hallName;

    const tblRow = document.getElementById('block-tablenum-row');
    const tblNumInput = document.getElementById('block-manual-tablenum');
    if (tableNum) {
        // Called by clicking a free table on the map — table is already known
        document.getElementById('block-table-num').textContent = `Stolik nr ${tableNum}`;
        if (tblRow) tblRow.style.display = 'none';
    } else {
        // Called by the "Zablokuj stolik ręcznie" button — manager types table number
        document.getElementById('block-table-num').textContent = '';
        if (tblRow) tblRow.style.display = 'block';
        if (tblNumInput) tblNumInput.value = '';
    }
    modal.classList.add('open');
}

function closeManualBlockModal() {
    document.getElementById('manual-block-modal')?.classList.remove('open');
    _blockTargetTable = null;
}

async function confirmManualBlock() {
    // Resolve table number — either pre-set (click from map) or typed in by manager
    let tableNum = _blockTargetTable;
    if (!tableNum) {
        tableNum = parseInt(document.getElementById('block-manual-tablenum')?.value);
    }
    const date  = document.getElementById('block-date')?.value;
    const time  = document.getElementById('block-time')?.value;
    const dur   = document.getElementById('block-duration')?.value;
    const fname = document.getElementById('block-fname')?.value?.trim();
    const lname = document.getElementById('block-lname')?.value?.trim();
    const phone = document.getElementById('block-phone')?.value?.trim();
    const notes = document.getElementById('block-notes')?.value?.trim();
    const errEl = document.getElementById('block-error');

    if (!tableNum || !date || !time || !dur || !fname || !lname || !phone) {
        if (errEl) { errEl.textContent = 'Uzupełnij wszystkie wymagane pola (*).'; errEl.style.display = 'block'; }
        return;
    }
    if (errEl) errEl.style.display = 'none';

    const hall = _mgrCurrentHall;
    const prefixMap = { kominkowa:'Z', lesna:'L', taras:'T' };
    const id = (prefixMap[hall]||'X') + '-MAN-' + Date.now().toString().slice(-6);

    await DB.saveBlock({
        id, hall, hallName: HALL_NAMES[hall]||hall,
        tableNum, tableCapacity: null,
        date, time, duration: parseFloat(dur),
        guests: 2, fname, lname, phone, email: '', notes: notes || 'Blokada ręczna',
        personMeals: {}, createdAt: new Date().toISOString()
    });

    closeManualBlockModal();
    renderMgrMap(hall);
    refreshBadges();
    refreshMgrPanel('active');
    showToast(`Stolik nr ${tableNum} zablokowany — ${fname} ${lname}`);
}

// Make map tables clickable in manager mode for manual blocking
function handleMgrMapClick(e) {
    const tbl = e.target.closest('.floor-table.free');
    if (!tbl) return;
    const num = parseInt(tbl.querySelector('.table-num')?.textContent);
    if (!num) return;
    openManualBlockModal(num);
}



// ─── HALL BLOCK (block all tables in a hall for a time range) ────────────────

const HALL_BLOCK_TIMES = ['11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00'];

function openHallBlockModal() {
    const modal = document.getElementById('hall-block-modal');
    if (!modal) return;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('hblock-date').value = today;
    document.getElementById('hblock-reason').value = '';
    document.getElementById('hblock-error').style.display = 'none';

    const hallName = _mgrCurrentHall === 'kominkowa' ? 'Złota Paproć'
                   : _mgrCurrentHall === 'lesna'     ? 'Sala Leśna' : 'Taras';
    document.getElementById('hblock-hall-name').textContent = hallName;

    // Populate time selects
    ['hblock-time-from', 'hblock-time-to'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '<option value="">Wybierz</option>' +
            HALL_BLOCK_TIMES.map(t => `<option>${t}</option>`).join('');
    });

    modal.classList.add('open');
}

function closeHallBlockModal() {
    document.getElementById('hall-block-modal')?.classList.remove('open');
}

async function confirmHallBlock() {
    const date      = document.getElementById('hblock-date')?.value;
    const timeFrom  = document.getElementById('hblock-time-from')?.value;
    const timeTo    = document.getElementById('hblock-time-to')?.value;
    const reason    = document.getElementById('hblock-reason')?.value?.trim() || 'Blokada sali';
    const errEl     = document.getElementById('hblock-error');

    if (!date || !timeFrom || !timeTo) {
        if (errEl) { errEl.textContent = 'Uzupełnij datę oraz godziny od/do.'; errEl.style.display = 'block'; }
        return;
    }

    // Validate from < to
    const [fh, fm] = timeFrom.split(':').map(Number);
    const [th, tm] = timeTo.split(':').map(Number);
    if (fh * 60 + fm >= th * 60 + tm) {
        if (errEl) { errEl.textContent = 'Godzina „od" musi być wcześniejsza niż godzina „do".'; errEl.style.display = 'block'; }
        return;
    }
    if (errEl) errEl.style.display = 'none';

    const hall   = _mgrCurrentHall;
    const layout = await DB.getLayout(hall);
    const hallName = hall === 'kominkowa' ? 'Złota Paproć' : hall === 'lesna' ? 'Sala Leśna' : 'Taras';
    const prefixMap = { kominkowa:'Z', lesna:'L', taras:'T' };

    // Calculate duration in hours between timeFrom and timeTo
    const durationH = ((th * 60 + tm) - (fh * 60 + fm)) / 60;

    // Create one confirmed block reservation per table
    const saves = layout.map(t => {
        const id = (prefixMap[hall]||'X') + '-HALL-' + t.n + '-' + Date.now().toString().slice(-5);
        return DB.saveBlock({
            id, hall, hallName,
            tableNum: t.n, tableCapacity: t.cap,
            date, time: timeFrom, duration: durationH,
            guests: 0, fname: 'BLOKADA', lname: 'SALI', phone: '000000000',
            email: '', notes: reason,
            personMeals: {}, createdAt: new Date().toISOString()
        });
    });

    await Promise.all(saves);
    closeHallBlockModal();
    renderMgrMap(hall);
    refreshBadges();
    refreshMgrPanel('active');
    showToast(`Cała sala ${hallName} zablokowana ${date} od ${timeFrom} do ${timeTo}`);
}

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

async function renderUsersList() {
    const container = document.getElementById('users-list');
    if (!container) return;
    const users = await DB.getUsers();
    container.innerHTML=`<div class="res-table-wrap"><table class="data-table"><thead><tr><th>Użytkownik</th><th>Rola</th><th>Utworzono</th></tr></thead><tbody>
        ${users.map(u=>`<tr>
            <td><strong>${u.username}</strong></td>
            <td>${u.role==='admin'?'<span class="admin-badge">ADMIN</span>':'<span class="status-pill confirmed">STAFF</span>'}</td>
            <td style="font-size:0.82rem;color:var(--text-light)">${u.createdAt||'—'}</td>
        </tr>`).join('')}
    </tbody></table></div>`;
}
async function addManagerUser() {
    if (!MgrAuth.user || MgrAuth.user.role!=='admin') { showToast('Brak uprawnień.'); return; }
    const u=document.getElementById('new-username')?.value.trim();
    const p=document.getElementById('new-password')?.value;
    const msgEl=document.getElementById('adduser-msg');
    const showMsg=(text,type)=>{if(!msgEl)return;msgEl.style.display='block';msgEl.textContent=text;msgEl.style.background=type==='success'?'#dcfce7':'#fde8e8';msgEl.style.color=type==='success'?'#166534':'#9b2c2c';msgEl.style.border=`1px solid ${type==='success'?'#86efac':'#f56565'}`;};
    if (!u||!p) {showMsg('Uzupełnij wszystkie pola.','error');return;}
    if (p.length<6) {showMsg('Hasło musi mieć min. 6 znaków.','error');return;}
    if (!await DB.addUser(u,p)) {showMsg('Użytkownik o tej nazwie już istnieje.','error');return;}
    document.getElementById('new-username').value='';
    document.getElementById('new-password').value='';
    showMsg('Konto utworzone pomyślnie!','success');
    await renderUsersList();
}
async function changeManagerPassword() {
    const old=document.getElementById('cp-old')?.value;
    const nw=document.getElementById('cp-new')?.value;
    const nw2=document.getElementById('cp-new2')?.value;
    const msgEl=document.getElementById('chpass-msg');
    const showMsg=(t,type)=>{if(!msgEl)return;msgEl.style.display='block';msgEl.textContent=t;msgEl.style.background=type==='success'?'#dcfce7':'#fde8e8';msgEl.style.color=type==='success'?'#166534':'#9b2c2c';msgEl.style.border=`1px solid ${type==='success'?'#86efac':'#f56565'}`;};
    if (!old||!nw||!nw2){showMsg('Uzupełnij wszystkie pola.','error');return;}
    if (nw.length<6){showMsg('Hasło min. 6 znaków.','error');return;}
    if (nw!==nw2){showMsg('Nowe hasła nie są identyczne.','error');return;}
    // Server verifies old password; no need for client-side re-auth
    const ok = await DB.changePassword(MgrAuth.user.username, old, nw);
    if (!ok){showMsg('Aktualne hasło jest nieprawidłowe.','error');return;}
    showMsg('Hasło zmienione!','success');
    ['cp-old','cp-new','cp-new2'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
}


// ============================================================
// === INIT