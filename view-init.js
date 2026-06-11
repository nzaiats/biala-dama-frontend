/**
 * view-init.js — Dworek Biała Dama
 * Bootstrap: runs after DOM is ready.
 * Must be loaded LAST (after db.js, view-data.js, view-public.js, view-manager.js).
 */

document.addEventListener('DOMContentLoaded', async () => {

    // Init: check if a manager session is already active (page refresh)
    const status = await DB.init();
    if (status.authenticated && status.user) {
        MgrAuth.login(status.user);
        openManagerDashboard();
        return;  // Dashboard already shown — skip public init
    }

    initHero();
    showPage('home');

    // Wire nav links
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        link.addEventListener('click', () => showPage(link.dataset.page));
    });

    // Default date on reservation form
    const dateEl = document.getElementById('res-date');
    if (dateEl) {
        const today = new Date().toISOString().split('T')[0];
        dateEl.min   = today;
        dateEl.value = today;
    }

    // Hall card clicks (reservation step 1)
    document.addEventListener('click', e => {
        const hc = e.target.closest('#step-1 .hall-card[data-hall]');
        if (hc) selectHall(hc.dataset.hall, hc.dataset.hallName, hc);
    });

    // Drag listeners for layout editor (attached once, survive re-renders)
    _initLayoutDragListeners();
});