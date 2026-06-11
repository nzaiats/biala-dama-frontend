/**
 * view-public.js — Dworek Biała Dama
 * Public-facing UI logic:
 *   - Page navigation
 *   - Restaurant tabs, hall rendering, menu rendering
 *   - Reservation flow (steps 1-6)
 *   - Hotel page rendering
 *   - Okolica rendering
 *   - Toast notifications
 * Depends on: db.js, view-data.js
 */

// === APP STATE
// ============================================================

const State = {
    currentPage: 'home',
    currentRestoTab: 'sale',
    activeMenuCat: null,
    reservation: {
        step: 1,
        hall: null, hallName: null,
        tableNum: null, tableCapacity: null,
        date: null, time: null, duration: null, guests: 1,
        fname: '', lname: '', phone: '', email: '', notes: '',
        currentPerson: 1, personMeals: {},
    }
};


// ============================================================
// === PAGE NAVIGATION
// ============================================================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (link) link.classList.add('active');
    State.currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileMenu();
    if (pageId === 'restauracja') renderRestaurantPage();
    if (pageId === 'rezervacija') initReservationPage();
    if (pageId === 'hotel')       renderHotelPage();
    if (pageId === 'okolica')     renderOkolica();
}

// Mobile hamburger menu toggle
function toggleMobileMenu() {
    const menu = document.getElementById('nav-menu');
    const burger = document.getElementById('nav-hamburger');
    if (!menu || !burger) return;
    menu.classList.toggle('active');
    burger.classList.toggle('active');
}

function closeMobileMenu() {
    const menu = document.getElementById('nav-menu');
    const burger = document.getElementById('nav-hamburger');
    if (menu) menu.classList.remove('active');
    if (burger) burger.classList.remove('active');
}

function navToRestaurantMenu() {
    showPage('restauracja');
    setTimeout(() => switchRestoTab('menu'), 200);
}

function initHero() {
    const bg = document.querySelector('.hero-bg');
    if (bg) setTimeout(() => bg.classList.add('loaded'), 100);
}


// ============================================================
// === RESTAURACJA — HALLS + TABS
// ============================================================

function renderRestaurantPage() {
    renderHalls();
    if (State.currentRestoTab === 'menu') renderMenu();
}

function switchRestoTab(tab) {
    State.currentRestoTab = tab;
    document.querySelectorAll('.resto-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const tabEl = document.querySelector(`.resto-tab[data-tab="${tab}"]`);
    if (tabEl) tabEl.classList.add('active');
    const panelEl = document.getElementById('tab-' + tab);
    if (panelEl) panelEl.classList.add('active');
    if (tab === 'menu') renderMenu();
    if (tab === 'sale') renderHalls();
}

function renderHalls() {
    const container = document.getElementById('halls-grid');
    if (!container || container.dataset.rendered) return;
    container.innerHTML = HALLS_DATA.map(h => `
        <div class="hall-card">
            <img class="hall-card-img" src="${h.img}" alt="${h.name}"
                 onerror="this.style.cssText='height:230px;background:linear-gradient(135deg,#1a2e2e,#2d4a3e)'">
            <div class="hall-card-info">
                <h3>${h.name}</h3>
                <p>${h.desc}</p>
                <p class="hall-capacity"><i class="fas fa-users"></i> Do ${h.capacity} osób</p>
            </div>
        </div>`).join('');
    container.dataset.rendered = '1';
}


// ============================================================
// === MENU RENDERING — with category nav + improved layout
// ============================================================

function renderMenu() {
    const container = document.getElementById('menu-list');
    if (!container) return;

    // Build category nav
    const catNavHtml = `
        <div class="menu-cat-nav" id="menu-cat-nav">
            <button class="menu-cat-btn active" onclick="scrollToMenuCat('all', this)">
                <i class="fas fa-utensils"></i> Wszystkie
            </button>
            ${MENU_CATEGORIES.map(c => `
                <button class="menu-cat-btn" onclick="scrollToMenuCat('${c.key}', this)">
                    ${c.label}
                </button>`).join('')}
        </div>`;

    // Build all category sections
    const sectionsHtml = MENU_CATEGORIES.map(cat => {
        const items = MENU_DATA.filter(i => i.cat === cat.key);
        if (!items.length) return '';
        return `
            <div class="menu-section" id="menu-cat-${cat.key}" data-cat="${cat.key}">
                <div class="menu-category-title">
                    <span class="menu-cat-pl">${cat.label}</span>
                    <span class="menu-cat-en">${cat.en}</span>
                </div>
                <div class="menu-items-list">
                    ${items.map(item => `
                        <div class="menu-item-card">
                            <div class="mic-img">
                                ${item.img
                                    ? `<img src="${item.img}" alt="${item.name}" onerror="this.outerHTML='<div class=\\"mic-emoji\\">${item.emoji}</div>'">`
                                    : `<div class="mic-emoji">${item.emoji}</div>`}
                            </div>
                            <div class="mic-body">
                                <h4 class="mic-name">${item.name}</h4>
                                <p class="mic-en">(${item.en})</p>
                            </div>
                            <div class="mic-price-block">
                                <div class="mic-price">${item.price} <span>zł</span></div>
                                <div class="mic-unit">${item.unit}</div>
                            </div>
                        </div>`).join('')}
                </div>
            </div>`;
    }).join('');

    container.innerHTML = catNavHtml + sectionsHtml;
}

function scrollToMenuCat(catKey, btn) {
    document.querySelectorAll('.menu-cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (catKey === 'all') {
        document.getElementById('menu-list').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    const sec = document.getElementById('menu-cat-' + catKey);
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ============================================================
// === RESERVATION FLOW
// ============================================================

function initReservationPage() {
    const today = new Date().toISOString().split('T')[0];
    const dateEl = document.getElementById('res-date');
    if (dateEl) { dateEl.min = today; if (!dateEl.value) dateEl.value = today; }
    goToStep(State.reservation.step || 1);
    _startReservationTimer();
}

// ── 30-minute countdown timer for the reservation flow ──────────────────────
let _resTimerInterval = null;
let _resTimerSeconds  = 30 * 60;  // 30 minutes

function _startReservationTimer() {
    _stopReservationTimer();
    _resTimerSeconds = 30 * 60;
    const bar = document.getElementById('res-timer-bar');
    if (bar) bar.style.display = 'flex';
    _updateTimerDisplay();
    _resTimerInterval = setInterval(() => {
        _resTimerSeconds--;
        _updateTimerDisplay();
        if (_resTimerSeconds <= 0) {
            _stopReservationTimer();
            _onTimerExpired();
        }
    }, 1000);
}

function _stopReservationTimer() {
    if (_resTimerInterval) { clearInterval(_resTimerInterval); _resTimerInterval = null; }
    const bar = document.getElementById('res-timer-bar');
    if (bar) bar.style.display = 'none';
}

function _updateTimerDisplay() {
    const m = Math.floor(_resTimerSeconds / 60);
    const s = _resTimerSeconds % 60;
    const text = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const display = document.getElementById('res-timer-display');
    if (display) display.textContent = text;
    const bar = document.getElementById('res-timer-bar');
    if (!bar) return;
    bar.classList.remove('warning', 'danger');
    if (_resTimerSeconds <= 60)       bar.classList.add('danger');
    else if (_resTimerSeconds <= 300) bar.classList.add('warning');
}

function _onTimerExpired() {
    // Show expiry overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999',
        'background:rgba(0,0,0,0.7)',
        'display:flex', 'align-items:center', 'justify-content:center'
    ].join(';');
    overlay.innerHTML = `
        <div style="background:var(--color-bg);border-radius:var(--radius-md);
                    padding:48px 40px;max-width:440px;text-align:center;
                    box-shadow:0 20px 60px rgba(0,0,0,0.4)">
            <div style="font-size:3rem;margin-bottom:16px">⏰</div>
            <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;
                       margin-bottom:12px;color:var(--text-color)">Czas minął</h2>
            <p style="color:var(--text-light);margin-bottom:28px;font-size:0.95rem;line-height:1.6">
                Rezerwacja została przerwana z powodu przekroczenia limitu czasu (30 minut).
                Prosimy spróbować ponownie.
            </p>
            <button onclick="
                document.body.removeChild(this.closest('[style*=inset]'));
                resetReservation();
                showPage('home');
            " style="padding:14px 32px;background:var(--gold-gradient);
                     color:#fff;border:none;border-radius:var(--radius-sm);
                     font-size:1rem;cursor:pointer;font-family:'Jost',sans-serif">
                Wróć na stronę główną
            </button>
        </div>`;
    document.body.appendChild(overlay);
    // Also reset reservation state
    resetReservation();
}

function goToStep(n) {
    State.reservation.step = n;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('step-' + n);
    if (panel) panel.classList.add('active');
    updateStepDots(n);
    if (n === 3) renderFilteredFloorMap();
    if (n === 5) buildPersonSelector();
    if (n === 6) _stopReservationTimer();  // reservation complete — stop countdown
    // NOTE: buildConfirmation() is called ONLY from nextStep(5), never from goToStep(6),
    // to prevent the reservation being saved twice (duplicate bug fix).
}

function updateStepDots(current) {
    for (let i = 1; i <= 6; i++) {
        const dot  = document.getElementById('sdot-' + i);
        const line = document.getElementById('sline-' + i);
        if (dot) { dot.classList.toggle('active', i === current); dot.classList.toggle('done', i < current); }
        if (line) line.classList.toggle('done', i < current);
    }
}

async function nextStep(from) {
    const r = State.reservation;
    if (from === 1 && !r.hallName) { showToast('Wybierz salę, by kontynuować!'); return; }

    if (from === 2) {
        r.date     = document.getElementById('res-date')?.value;
        r.time     = document.getElementById('res-time')?.value;
        r.duration = parseFloat(document.getElementById('res-duration')?.value) || 0;
        r.guests   = parseInt(document.getElementById('res-guests')?.value) || 0;
        if (!r.date || !r.time || !r.duration || !r.guests) {
            showToast('Uzupełnij datę, godzinę, czas trwania i liczbę gości!');
            return;
        }
        const busy   = await _busyTablesForSlot(r.hall, r.date, r.time, r.duration, null);
        const layout = await DB.getLayout(r.hall);
        const freeCount = layout.filter(t => t.type !== 'obstacle' && !busy.has(t.n)).length;
        const banner = document.getElementById('availability-banner');
        if (banner) {
            banner.innerHTML = `<i class="fas fa-info-circle" style="color:var(--accent-color);margin-right:8px"></i>
                W sali <strong>${r.hallName}</strong> w dniu <strong>${r.date}</strong> o godz. <strong>${r.time}</strong>
                (czas: ${r.duration}h) dostępne są <strong>${freeCount}</strong> stoliki.`;
        }
    }

    if (from === 3 && !r.tableNum) { showToast('Kliknij na wolny stolik (zielony)!'); return; }

    if (from === 4) {
        r.fname = document.getElementById('res-fname')?.value?.trim();
        r.lname = document.getElementById('res-lname')?.value?.trim();
        r.phone = document.getElementById('res-phone')?.value?.trim();
        r.email = document.getElementById('res-email')?.value?.trim();
        r.notes = document.getElementById('res-notes')?.value?.trim();
        if (!r.fname || !r.lname || !r.phone) { showToast('Imię, nazwisko i telefon są wymagane!'); return; }
    }

    if (from === 5) { await buildConfirmation(); goToStep(6); return; }
    goToStep(from + 1);
}

function prevStep(from) { goToStep(from - 1); }

function selectHall(hallId, hallName, el) {
    document.querySelectorAll('#step-1 .hall-card').forEach(c => { c.style.borderColor=''; c.style.boxShadow=''; });
    if (el) { el.style.borderColor = 'var(--accent-color)'; el.style.boxShadow = '0 0 0 3px rgba(197,160,111,0.22)'; }
    State.reservation.hall     = hallId;
    State.reservation.hallName = hallName;
    // Reset table selection if hall changed
    State.reservation.tableNum = null;
    State.reservation.tableCapacity = null;
    showToast('Wybrano: ' + hallName);
}


// --- Time conflict check ---
function _timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

async function _busyTablesForSlot(hall, date, time, duration, excludeId) {
    const startMin = _timeToMinutes(time);
    const endMin   = startMin + Math.round((duration || 0) * 60);
    const busy = new Set();
    const reservations = await DB.getReservations();
    reservations.forEach(r => {
        if (r.hall !== hall || r.date !== date || r.status === 'cancelled') return;
        if (excludeId && r.id === excludeId) return;
        const rStart = _timeToMinutes(r.time);
        const rEnd   = rStart + Math.round((r.duration || 2) * 60);
        if (startMin < rEnd && endMin > rStart) busy.add(r.tableNum);
    });
    return busy;
}


// --- Filtered floor map (reservation step 3) ---
async function renderFilteredFloorMap() {
    const r = State.reservation;
    const container = document.getElementById('floor-map-main');
    if (!container) return;

    const [layout, elements, busy] = await Promise.all([
        DB.getLayout(r.hall),
        DB.getFloorElements(r.hall),
        _busyTablesForSlot(r.hall, r.date, r.time, r.duration, null)
    ]);

    container.innerHTML = _buildMapHTML(layout, elements, busy, 'reservation');

    // Reset selected table
    r.tableNum = null;
    r.tableCapacity = null;
    const info = document.getElementById('selected-table-info');
    if (info) info.style.display = 'none';
}

function renderFloorMap(containerId) {
    // Legacy call — render current hall's map without filters
    const container = document.getElementById(containerId);
    if (!container) return;
    const hall   = State.reservation.hall || 'kominkowa';
    const layout = DB.getLayout(hall);
    const elements = DB.getFloorElements(hall);
    container.innerHTML = _buildMapHTML(layout, elements, new Set(), 'reservation');
}

function _buildMapHTML(tables, elements, busySet, mode, statusMap) {
    // statusMap (optional): { tableNum -> 'pending'|'confirmed'|'blocked' }
    // Manager mode uses this for precise colors: pending=yellow, confirmed/blocked=red
    let html = '';
    (elements || []).forEach(el => {
        const rot = el.rotation ? `transform:rotate(${el.rotation}deg);` : '';
        if (el.type === 'entrance') {
            html += `<div class="floor-element fe-entrance" style="left:${el.l};top:${el.t};width:${el.w};height:${el.h};${rot}">
                <i class="fas fa-door-open"></i><span>${el.label || 'Wejście'}</span></div>`;
        } else if (el.type === 'window') {
            html += `<div class="floor-element fe-window" style="left:${el.l};top:${el.t};width:${el.w};height:${el.h};${rot}">
                <i class="fas fa-border-all"></i><span>${el.label || 'Okno'}</span></div>`;
        } else if (el.type === 'obstacle') {
            html += `<div class="floor-element fe-obstacle" style="left:${el.l};top:${el.t};width:${el.w};height:${el.h};${rot}">
                <span>${el.label || 'Bar'}</span></div>`;
        }
    });
    tables.forEach(t => {
        const isBusy = busySet.has(t.n);
        let cls;
        if (mode === 'reservation') {
            cls = isBusy ? 'occupied' : 'free';
        } else {
            const st = statusMap && statusMap[t.n];
            if (!st)                  cls = 'free';
            else if (st === 'pending') cls = 'reserved';  // yellow
            else                       cls = 'occupied';  // red (confirmed / blocked)
        }
        const clickAttr = (mode === 'reservation' && !isBusy)
            ? `onclick="selectTable(this, ${t.n}, ${t.cap})"`
            : '';
        const mgr = mode === 'manager';
        html += `<div class="floor-table ${cls}${mgr ? ' drag-mode' : ''}"
             ${mgr ? `id="lt-${t.n}" data-idx="${t.n}"` : ''}
             style="left:${t.l};top:${t.top || t.t};width:${t.w};height:${t.h}"
             ${clickAttr}>
            <span class="table-num">${t.n}</span>
            <span class="table-cap">${t.cap} os.</span>
        </div>`;
    });
    return html;
}

function selectTable(el, num, cap) {
    if (!el || el.classList.contains('occupied')) return;
    document.querySelectorAll('.floor-table.selected').forEach(t => { t.classList.remove('selected'); t.classList.add('free'); });
    el.classList.remove('free');
    el.classList.add('selected');
    State.reservation.tableNum      = num;
    State.reservation.tableCapacity = cap;
    const info = document.getElementById('selected-table-info');
    if (info) {
        info.style.display = 'block';
        info.innerHTML = `<i class="fas fa-check-circle" style="color:var(--status-selected);margin-right:8px"></i>Wybrany: <strong>Stolik nr ${num}</strong> (do ${cap} osób)`;
    }
}

// --- Person meal selector (step 5) ---
function buildPersonSelector() {
    const r = State.reservation;
    const n = r.guests || 1;
    let btnsHtml = '';
    for (let i = 1; i <= n; i++) {
        const count = (r.personMeals[i] || []).length;
        btnsHtml += `<button class="person-btn ${i === r.currentPerson ? 'active' : ''}" id="pbtn-${i}" onclick="switchPerson(${i})">
            <i class="fas fa-user" style="margin-right:6px"></i>Osoba ${i}
            <span class="person-badge ${count > 0 ? 'show' : ''}" id="pbadge-${i}">${count}</span>
        </button>`;
    }
    const pBtns = document.getElementById('persons-btns');
    if (pBtns) pBtns.innerHTML = btnsHtml;
    renderMiniMenu(r.currentPerson || 1);
}

function switchPerson(idx) {
    State.reservation.currentPerson = idx;
    document.querySelectorAll('.person-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('pbtn-' + idx);
    if (btn) btn.classList.add('active');
    const label = document.getElementById('current-person-label');
    if (label) label.textContent = 'Osoby ' + idx;
    renderMiniMenu(idx);
}

function renderMiniMenu(personIdx) {
    const selected   = State.reservation.personMeals[personIdx] || [];
    const container  = document.getElementById('mini-menu-list');
    if (!container) return;
    container.innerHTML = MENU_CATEGORIES.map(cat => {
        const items = MENU_DATA.filter(i => i.cat === cat.key);
        if (!items.length) return '';
        return `<div style="margin-bottom:14px">
            <div style="font-size:0.68rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text-light);margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid var(--glass-border)">${cat.label}</div>
            ${items.map(item => `
                <div class="mini-menu-item ${selected.includes(item.id) ? 'selected' : ''}" onclick="toggleMeal(${personIdx}, ${item.id}, this)">
                    <div style="background:linear-gradient(135deg,#2d4a3e,#1a2e2e);display:flex;align-items:center;justify-content:center;font-size:1.4rem;border-radius:8px;width:56px;height:42px;flex-shrink:0;">${item.emoji}</div>
                    <div class="mini-item-info"><h4>${item.name}</h4><p>${cat.label}</p></div>
                    <div class="mini-item-price">${item.price} zł</div>
                    <div class="mini-item-check">${selected.includes(item.id) ? '<i class="fas fa-check"></i>' : ''}</div>
                </div>`).join('')}
        </div>`;
    }).join('');
}

function toggleMeal(personIdx, itemId, el) {
    if (!State.reservation.personMeals[personIdx]) State.reservation.personMeals[personIdx] = [];
    const arr = State.reservation.personMeals[personIdx];
    const idx = arr.indexOf(itemId);
    if (idx === -1) arr.push(itemId); else arr.splice(idx, 1);
    const isSelected = arr.includes(itemId);
    el.classList.toggle('selected', isSelected);
    const check = el.querySelector('.mini-item-check');
    if (check) check.innerHTML = isSelected ? '<i class="fas fa-check"></i>' : '';
    const badge = document.getElementById('pbadge-' + personIdx);
    if (badge) { badge.textContent = arr.length; badge.classList.toggle('show', arr.length > 0); }
}

// --- Confirmation (step 6) ---
async function buildConfirmation() {
    const r = State.reservation;
    const prefixMap = { kominkowa: 'Z', lesna: 'L', taras: 'T' };
    const reservationId = (prefixMap[r.hall] || 'X') + '-' + Date.now().toString().slice(-6);
    const idEl = document.getElementById('confirm-reservation-id');
    if (idEl) idEl.textContent = reservationId;
    const n = r.guests || 1;
    let mealsHtml = '';
    for (let i = 1; i <= n; i++) {
        const meals = r.personMeals[i] || [];
        if (meals.length) {
            const names = meals.map(id => MENU_DATA.find(m => m.id === id)?.name).filter(Boolean).join(', ');
            mealsHtml += `<div class="confirm-row"><span class="c-label">Osoba ${i}</span><span class="c-value" style="font-size:0.85rem">${names}</span></div>`;
        }
    }
    const detailsEl = document.getElementById('confirm-details');
    if (detailsEl) {
        const durationLabel = r.duration === 1 ? '1 godzina' : r.duration + ' godz.';
        detailsEl.innerHTML = `
            <div class="confirm-row"><span class="c-label">Sala</span><span class="c-value">${r.hallName}</span></div>
            <div class="confirm-row"><span class="c-label">Stolik</span><span class="c-value">Nr ${r.tableNum} (do ${r.tableCapacity} os.)</span></div>
            <div class="confirm-row"><span class="c-label">Data</span><span class="c-value">${r.date}</span></div>
            <div class="confirm-row"><span class="c-label">Godzina</span><span class="c-value">${r.time}</span></div>
            <div class="confirm-row"><span class="c-label">Czas trwania</span><span class="c-value">${durationLabel}</span></div>
            <div class="confirm-row"><span class="c-label">Liczba gości</span><span class="c-value">${r.guests} os.</span></div>
            <div class="confirm-row"><span class="c-label">Gość</span><span class="c-value">${r.fname} ${r.lname}</span></div>
            <div class="confirm-row"><span class="c-label">Telefon</span><span class="c-value">${r.phone}</span></div>
            ${r.email ? `<div class="confirm-row"><span class="c-label">E-mail</span><span class="c-value">${r.email}</span></div>` : ''}
            ${mealsHtml}
            ${r.notes ? `<div class="confirm-row"><span class="c-label">Uwagi</span><span class="c-value" style="font-size:0.85rem">${r.notes}</span></div>` : ''}`;
    }
    await DB.saveReservation({
        id: reservationId,
        hall: r.hall, hallName: r.hallName,
        tableNum: r.tableNum, tableCapacity: r.tableCapacity,
        date: r.date, time: r.time, duration: r.duration, guests: r.guests,
        fname: r.fname, lname: r.lname, phone: r.phone, email: r.email || '', notes: r.notes || '',
        personMeals: JSON.parse(JSON.stringify(r.personMeals)),
        status: 'pending', createdAt: new Date().toISOString()
    });
}

function resetReservation() {
    Object.assign(State.reservation, {
        step:1, hall:null, hallName:null,
        tableNum:null, tableCapacity:null,
        date:null, time:null, duration:null, guests:1,
        fname:'', lname:'', phone:'', email:'', notes:'',
        currentPerson:1, personMeals:{}
    });
    document.querySelectorAll('#step-1 .hall-card').forEach(c => { c.style.borderColor=''; c.style.boxShadow=''; });
    const info = document.getElementById('selected-table-info');
    if (info) info.style.display = 'none';
    goToStep(1);
}


// ============================================================
// === HOTEL PAGE
// ============================================================

function renderHotelPage() {
    const container = document.getElementById('price-grid');
    if (!container || container.dataset.rendered) return;
    container.innerHTML = HOTEL_PRICES.map(p => `
        <div class="price-card ${p.featured ? 'featured' : ''}">
            <div class="price-persons">${p.persons}</div>
            <h3 class="price-name ${p.featured ? 'light' : ''}">${p.title}</h3>
            <p class="price-sub ${p.featured ? 'light' : ''}">${p.subtitle}</p>
            <div class="price-amount ${p.featured ? 'light' : ''}"><sup></sup>${p.price}<sup style="font-size:1.2rem"> zł</sup></div>
            <div class="price-night ${p.featured ? 'light' : ''}">za dobę</div>
            <ul class="price-includes">
                ${p.includes.map(inc => `<li class="${p.featured?'light':''}"><i class="fas fa-check"></i>${inc}</li>`).join('')}
            </ul>
        </div>`).join('');
    container.dataset.rendered = '1';
}


// ============================================================
// === OKOLICA PAGE
// ============================================================

function renderOkolica() {
    const container = document.getElementById('attractions-grid');
    if (!container || container.dataset.rendered) return;
    container.innerHTML = ATTRACTIONS_DATA.map(a => `
        <div class="attraction-card">
            <div style="width:100%;height:155px;background:linear-gradient(135deg,#1a2e2e,#2d4a3e);display:flex;align-items:center;justify-content:center;font-size:3.5rem;">${a.emoji}</div>
            <div class="attraction-info">
                <h3>${a.name}</h3>
                <p>${a.desc}</p>
                <span class="attraction-dist"><i class="fas fa-route" style="margin-right:4px"></i>${a.dist}</span>
            </div>
        </div>`).join('');
    container.dataset.rendered = '1';
}


// ============================================================
// === TOAST
// ============================================================

let _toastTimer = null;
function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}


// ============================================================