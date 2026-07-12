
document.addEventListener('DOMContentLoaded', async () => {


    const status = await DB.init();
    if (status.authenticated && status.user) {
        MgrAuth.login(status.user);
        openManagerDashboard();
        return; 
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

    document.addEventListener('click', e => {
        const hc = e.target.closest('#step-1 .hall-card[data-hall]');
        if (hc) selectHall(hc.dataset.hall, hc.dataset.hallName, hc);
    });

    _initLayoutDragListeners();
});