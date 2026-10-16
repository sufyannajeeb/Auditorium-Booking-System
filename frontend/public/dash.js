
    // Backend URL
    const API = 'http://localhost:5000';

    let token = localStorage.getItem('tok');
    let currentPage = 'dashboard';
    let me = { id: '', name: 'User', email: '', phoneNumber: '', address: '', username: '', usertype: 'user' };
    let data = { auditoriums: [], events: [], bookings: [] };
    const ui = { search: '', filter: '' };

    const $ = s => document.querySelector(s);

    /* ---------- Icons ---------- */
    const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    const ICON = {
      dashboard: svg('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
      auditoriums: svg('<path d="M3 21h18"/><path d="M5 21V9a7 7 0 0 1 14 0v12"/><path d="M9 21v-7a3 3 0 0 1 6 0v7"/>'),
      events: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
      bookings: svg('<path d="M2 9a3 3 0 0 1 0 6v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a3 3 0 0 1 0-6V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M13 5v2M13 17v2M13 11v2"/>'),
      profile: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'),
      logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'),
      search: svg('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>'),
      menu: svg('<path d="M3 6h18M3 12h18M3 18h18"/>'),
      moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
      sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
      pin: svg('<path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
      people: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>'),
      clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
      user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>'),
      warn: svg('<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
      empty: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z"/>'),
      eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
      x: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
      check: svg('<path d="M20 6L9 17l-5-5"/>')
    };

    /* ---------- Helpers ---------- */
    const escapeHTML = v => String(v ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);

    const lower = v => String(v ?? '').toLowerCase();
    const idOf = v => (v && typeof v === 'object' ? v._id : v);
    const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

    const dateText = v => {
      if (!v) return '-';
      const d = new Date(v);
      return isNaN(d) ? '-' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const dayISO = v => String(v || '').slice(0, 10);
    const todayISO = () => {
      const d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    function imageURL(r) {
      if (!r || !r.image) return '';
      return /^https?:\/\//i.test(r.image) ? r.image : API + (r.image.startsWith('/') ? r.image : '/' + r.image);
    }

    function facilitiesOf(r) {
      const out = [];
      const walk = v => {
        if (Array.isArray(v)) return v.forEach(walk);
        if (typeof v !== 'string') return;
        const s = v.trim();
        if (s.startsWith('[')) {
          try { return walk(JSON.parse(s)); } catch (e) { /* treat as plain text */ }
        }
        s.split(',').forEach(x => { const t = x.trim(); if (t) out.push(t); });
      };
      walk(r && r.facilities);
      return out;
    }

    function decodeToken() {
      try {
        const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(part));
      } catch (e) { return {}; }
    }

    const badge = s => `<span class="badge ${escapeHTML(lower(s))}">${escapeHTML(s || '-')}</span>`;

    function toast(message, type = 'success') {
      const el = document.createElement('div');
      el.className = 'toast ' + type;
      el.textContent = message;
      $('#toasts').appendChild(el);
      setTimeout(() => el.remove(), 3500);
    }

    function coverHTML(r, icon) {
      const url = imageURL(r);
      return `<div class="cover">${url ? `<img src="${escapeHTML(url)}" alt="" loading="lazy">` : ICON[icon]}${r.status ? badge(r.status) : ''}</div>`;
    }

    /* ---------- API ---------- */
    async function api(endpoint, options = {}) {
      const response = await fetch(API + '/api/' + endpoint, {
        ...options,
        headers: { Authorization: 'Bearer ' + token, ...(options.headers || {}) }
      });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error(result.message || 'Session expired. Please log in again.');
      if (!response.ok) throw new Error(result.message || 'Request failed (' + response.status + ')');
      return result;
    }

    function extractRecords(result) {
      if (Array.isArray(result)) return result;
      for (const k of ['records', 'data', 'users', 'auditoriums', 'events', 'bookings']) {
        if (Array.isArray(result && result[k])) return result[k];
      }
      return [];
    }

    function logout() {
      localStorage.removeItem('tok');
      localStorage.removeItem('usertype');
      token = null;
      window.location.href = '/';
    }

    /* ---------- Data ---------- */
    function myBookings() {
      if (!me.id) return [];
      return data.bookings.filter(b => String(idOf(b.userId)) === String(me.id));
    }

    async function loadAll() {
      const endpoints = ['auditoriums', 'events', 'bookings/my'];
      const res = await Promise.allSettled(endpoints.map(e => api(e)));
      if (res.every(r => r.status === 'rejected')) throw res[0].reason;
      data.auditoriums = res[0].status === 'fulfilled' ? extractRecords(res[0].value) : [];
      data.events = res[1].status === 'fulfilled' ? extractRecords(res[1].value) : [];
      data.bookings = res[2].status === 'fulfilled' ? extractRecords(res[2].value) : [];
    }

    async function loadProfile() {
      const p = decodeToken();
      me.id = localStorage.getItem('userId') || localStorage.getItem('id') ||
        p.id || p._id || p.userId || (p.user && (p.user.id || p.user._id)) || '';
      me.name = localStorage.getItem('name') || p.name || p.username || 'User';
      me.email = p.email || '';
      me.username = p.username || '';
      if (me.id) {
        try {
          const r = await api('users/' + me.id);
          const u = r.user || r.data || r;
          if (u && typeof u === 'object' && !Array.isArray(u)) {
            me = { ...me, ...Object.fromEntries(Object.entries(u).filter(([, v]) => v != null && typeof v !== 'object')) };
            me.id = u._id || me.id;
          }
        } catch (e) { /* profile endpoint is optional */ }
      }
      $('#sideName').textContent = me.name;
      $('#sideAvatar').textContent = initials(me.name);
    }

    /* ---------- Shell ---------- */
    const TITLES = {
      dashboard: ['Dashboard', 'Your bookings and venues at a glance'],
      auditoriums: ['Auditoriums', 'Browse halls and book your next event'],
      events: ['Events', 'Shows and programs hosted at our venues'],
      bookings: ['My Bookings', 'Track and manage your reservations'],
      profile: ['My Profile', 'Your account details']
    };

    function buildNav() {
      document.querySelectorAll('aside nav button[data-page]').forEach(b => {
        const p = b.dataset.page;
        b.innerHTML = `${ICON[p]}<span>${p === 'bookings' ? 'My Bookings' : p === 'profile' ? 'My Profile' : p.charAt(0).toUpperCase() + p.slice(1)}</span><span class="count" id="count-${p}" hidden></span>`;
      });
      $('#logoutButton').innerHTML = `${ICON.logout}<span>Logout</span>`;
      $('#menuButton').innerHTML = ICON.menu;
    }

    function updateCounts() {
      const map = { auditoriums: data.auditoriums.length, events: data.events.length, bookings: myBookings().length };
      Object.entries(map).forEach(([k, v]) => {
        const el = $('#count-' + k);
        if (el) { el.textContent = v; el.hidden = false; }
      });
    }

    function applyTheme(t) {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
      $('#themeButton').innerHTML = t === 'dark' ? ICON.sun : ICON.moon;
    }

    function closeSidebar() {
      $('#sidebar').classList.remove('open');
      $('#scrim').classList.remove('show');
    }

    const skeleton = () => `<div class="stats">${'<div class="skel"></div>'.repeat(4)}</div><div class="skel" style="min-height:260px"></div>`;

    const errorCard = (title, msg, retry) => `
      <div class="card empty" style="max-width:520px;margin:30px auto">
        ${ICON.warn}
        <h3 class="serif" style="font-size:20px">${escapeHTML(title)}</h3>
        <p style="color:var(--red);margin-bottom:8px">${escapeHTML(msg)}</p>
        <p style="margin-bottom:16px">Check that the backend is running and that the API route exists.</p>
        ${retry ? `<button onclick="${retry}">Try Again</button>` : ''}
      </div>`;

    /* ---------- Start ---------- */
    async function start() {
      buildNav();
      applyTheme(localStorage.getItem('theme') || 'dark');
      $('#app').hidden = false;

      if (!token) {
        $('#sidebar').style.display = 'none';
        $('#menuButton').style.display = 'none';
        $('#pageTitle').textContent = 'Login Required';
        $('#pageSub').textContent = 'Please sign in to continue';
        $('#view').innerHTML = `
          <div class="card empty" style="max-width:480px;margin:40px auto">
            ${ICON.warn}
            <h3 class="serif" style="font-size:22px">Please log in</h3>
            <p style="margin-bottom:16px">You need to be signed in to view your dashboard.</p>
            <button onclick="window.location.href='/'">Go to Login</button>
          </div>`;
        return;
      }

      await loadProfile();
      await showPage('dashboard');
    }

    async function showPage(page, force = true) {
      currentPage = page;
      ui.search = '';
      ui.filter = '';
      closeSidebar();

      document.querySelectorAll('aside nav button[data-page]').forEach(b =>
        b.classList.toggle('active', b.dataset.page === page));
      $('#pageTitle').textContent = TITLES[page][0];
      $('#pageSub').textContent = TITLES[page][1];
      window.scrollTo({ top: 0 });

      try {
        if (force || !data.auditoriums.length) {
          $('#view').innerHTML = skeleton();
          await loadAll();
        }
        updateCounts();
        if (page === 'dashboard') renderDashboard();
        else if (page === 'auditoriums') renderAuditoriums();
        else if (page === 'events') renderEvents();
        else if (page === 'bookings') renderBookings();
        else renderProfile();
      } catch (e) {
        $('#view').innerHTML = errorCard(TITLES[page][0], e.message, `showPage('${page}')`);
      }
    }

    /* ---------- Toolbar ---------- */
    function toolbar(placeholder, options, label) {
      return `
        <div class="toolbar">
          <div class="search">${ICON.search}<input id="searchBox" type="search" placeholder="${escapeHTML(placeholder)}"></div>
          ${options.length ? `
            <select id="filterBox">
              <option value="">${escapeHTML(label)}</option>
              ${options.map(o => `<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('')}
            </select>` : ''}
        </div>
        <div id="listArea"></div>`;
    }

    function wireToolbar(renderFn) {
      $('#searchBox').addEventListener('input', e => { ui.search = e.target.value; renderFn(); });
      const fb = $('#filterBox');
      if (fb) fb.addEventListener('change', e => { ui.filter = e.target.value; renderFn(); });
    }

    function matches(r, statusKey) {
      if (ui.filter && lower(r[statusKey]) !== lower(ui.filter)) return false;
      const q = ui.search.trim().toLowerCase();
      if (!q) return true;
      return JSON.stringify(r).toLowerCase().includes(q);
    }

    const emptyCard = (title, text) => `
      <div class="card empty">${ICON.empty}<h3>${escapeHTML(title)}</h3><p>${escapeHTML(text)}</p></div>`;

    /* ---------- Dashboard ---------- */
    function renderDashboard() {
      const my = myBookings();
      const today = todayISO();
      const upcoming = my
        .filter(b => lower(b.status) !== 'cancelled' && dayISO(b.bookingDate) >= today)
        .sort((a, b) => dayISO(a.bookingDate).localeCompare(dayISO(b.bookingDate)));
      const pending = my.filter(b => lower(b.status) === 'pending').length;
      const available = data.auditoriums.filter(a => lower(a.status) !== 'inactive');
      const liveEvents = data.events.filter(e => ['upcoming', 'ongoing'].includes(lower(e.status))).slice(0, 4);
      const next = upcoming[0];
      const hour = new Date().getHours();
      const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

      const stats = [
        ['My Bookings', my.length, 'bookings', '#d4a24c', 'rgba(212,162,76,.16)', 'bookings'],
        ['Upcoming', upcoming.length, 'bookings', '#34d399', 'rgba(52,211,153,.15)', 'clock'],
        ['Pending', pending, 'bookings', '#fbbf24', 'rgba(251,191,36,.15)', 'warn'],
        ['Available Halls', available.length, 'auditoriums', '#c084fc', 'rgba(192,132,252,.15)', 'auditoriums']
      ];

      let nextHTML = '<div class="empty" style="padding:24px 0">No upcoming bookings yet.</div>';
      if (next) {
        const d = new Date(next.bookingDate);
        nextHTML = `
          <div class="next">
            <div class="date"><div><b>${isNaN(d) ? '-' : d.getDate()}</b><small>${isNaN(d) ? '' : d.toLocaleString(undefined, { month: 'short' })}</small></div></div>
            <div style="flex:1;min-width:160px">
              <h3 class="serif" style="font-size:20px">${escapeHTML((next.auditoriumId && next.auditoriumId.auditoriumName) || 'Auditorium')}</h3>
              <div class="meta" style="margin-top:8px">
                <span>${ICON.clock}${escapeHTML(next.time || '-')}</span>
                <span>${ICON.people}${escapeHTML(next.noOfPeople ?? '-')} people</span>
                ${next.eventId && next.eventId.eventName ? `<span>${ICON.events}${escapeHTML(next.eventId.eventName)}</span>` : ''}
              </div>
            </div>
            ${badge(next.status)}
          </div>`;
      }

      $('#view').innerHTML = `
        ${me.id ? '' : `<div class="form-err">Could not detect your user ID, so your bookings can't be shown. Make sure login saves <code>userId</code> in localStorage.</div>`}
        <div class="hero">
          <div>
            <h2>${greet}, ${escapeHTML(me.name)}</h2>
            <p>${upcoming.length ? `You have ${upcoming.length} upcoming booking${upcoming.length > 1 ? 's' : ''}.` : 'You have no upcoming bookings. Find the perfect hall for your next event.'}</p>
          </div>
          <button onclick="showPage('auditoriums', false)">${ICON.auditoriums}<span>Browse Auditoriums</span></button>
        </div>

        <div class="stats">
          ${stats.map(([t, c, p, col, tint, ic]) => `
            <div class="card stat" style="--tc:${col};--tint:${tint}" onclick="showPage('${p}', false)">
              <div class="ico">${ICON[ic]}</div>
              <div><small>${escapeHTML(t)}</small><b>${c}</b></div>
            </div>`).join('')}
        </div>

        <div class="grid-2">
          <div class="card"><h3>Next Booking</h3><div class="sub">Your closest upcoming reservation</div>${nextHTML}</div>
          <div class="card">
            <h3>Upcoming Events</h3><div class="sub">Happening at our venues</div>
            <div class="mini-list">
              ${liveEvents.length ? liveEvents.map(e => {
                const url = imageURL(e);
                return `
                  <div class="mini-item">
                    ${url ? `<img class="thumb" src="${escapeHTML(url)}" alt="">` : `<div class="thumb ph">${ICON.events}</div>`}
                    <div><b>${escapeHTML(e.eventName)}</b><small>${escapeHTML(e.organizer || '')}</small></div>
                    ${badge(e.status)}
                  </div>`;
              }).join('') : '<div class="empty" style="padding:24px 0">No upcoming events.</div>'}
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Recent Bookings</h3><div class="sub">Your latest reservations</div>
          ${my.length ? bookingsTable([...my].sort((a, b) => dayISO(b.bookingDate).localeCompare(dayISO(a.bookingDate))).slice(0, 5), false)
                      : '<div class="empty" style="padding:24px 0">You have not made any bookings yet.</div>'}
        </div>`;
    }

    /* ---------- Auditoriums ---------- */
    function renderAuditoriums() {
      $('#view').innerHTML = toolbar('Search auditoriums...', ['active', 'inactive'], 'All statuses');
      wireToolbar(drawAuditoriums);
      drawAuditoriums();
    }

    function drawAuditoriums() {
      const list = data.auditoriums.filter(a => matches(a, 'status'));
      if (!list.length) {
        $('#listArea').innerHTML = emptyCard('No auditoriums found', data.auditoriums.length ? 'Try a different search or filter.' : 'No auditoriums are available yet.');
        return;
      }
      $('#listArea').innerHTML = `<div class="cards-grid">${list.map(a => {
        const fac = facilitiesOf(a);
        const inactive = lower(a.status) === 'inactive';
        const id = escapeHTML(a._id);
        return `
          <div class="card item">
            ${coverHTML(a, 'auditoriums')}
            <div class="body">
              <h3>${escapeHTML(a.auditoriumName)}</h3>
              <div class="meta">
                <span>${ICON.pin}${escapeHTML(a.location || '-')}</span>
                <span>${ICON.people}Capacity: ${escapeHTML(a.capacity ?? '-')}</span>
              </div>
              ${fac.length ? `<div class="chips">${fac.slice(0, 4).map(f => `<span class="chip">${escapeHTML(f)}</span>`).join('')}${fac.length > 4 ? `<span class="chip">+${fac.length - 4}</span>` : ''}</div>` : ''}
              <div class="price">₹${escapeHTML(a.pricePerDay ?? '-')} <small>/ day</small></div>
            </div>
            <div class="foot">
              <button class="secondary sm" onclick="viewAuditorium('${id}')">Details</button>
              <button class="sm" ${inactive ? 'disabled' : ''} onclick="openBooking('${id}')">${inactive ? 'Unavailable' : 'Book Now'}</button>
            </div>
          </div>`;
      }).join('')}</div>`;
    }

    function viewAuditorium(id) {
      const a = data.auditoriums.find(x => x._id === id);
      if (!a) return;
      const fac = facilitiesOf(a);
      const url = imageURL(a);
      openModal(`
        ${url ? `<img class="preview" src="${escapeHTML(url)}" alt="">` : ''}
        <h3>${escapeHTML(a.auditoriumName)}</h3>
        <div class="sub">${badge(a.status)}</div>
        <dl class="kv">
          <dt>Location</dt><dd>${escapeHTML(a.location || '-')}</dd>
          <dt>Capacity</dt><dd>${escapeHTML(a.capacity ?? '-')} people</dd>
          <dt>Price</dt><dd>₹${escapeHTML(a.pricePerDay ?? '-')} per day</dd>
          <dt>Facilities</dt><dd>${fac.length ? fac.map(f => `<span class="chip" style="margin-right:4px">${escapeHTML(f)}</span>`).join('') : '-'}</dd>
        </dl>
        <div class="form-actions">
          <button class="secondary" onclick="closeModal()">Close</button>
          ${lower(a.status) !== 'inactive' ? `<button onclick="openBooking('${escapeHTML(a._id)}')">Book Now</button>` : ''}
        </div>`);
    }

    /* ---------- Events ---------- */
    function renderEvents() {
      $('#view').innerHTML = toolbar('Search events...', ['upcoming', 'ongoing', 'completed', 'cancelled'], 'All statuses');
      wireToolbar(drawEvents);
      drawEvents();
    }

    function drawEvents() {
      const list = data.events.filter(e => matches(e, 'status'));
      if (!list.length) {
        $('#listArea').innerHTML = emptyCard('No events found', data.events.length ? 'Try a different search or filter.' : 'No events have been added yet.');
        return;
      }
      $('#listArea').innerHTML = `<div class="cards-grid">${list.map(e => {
        const desc = String(e.description || '');
        return `
          <div class="card item">
            ${coverHTML(e, 'events')}
            <div class="body">
              <h3>${escapeHTML(e.eventName)}</h3>
              <div class="meta">
                <span>${ICON.user}${escapeHTML(e.organizer || '-')}</span>
                <span>${escapeHTML(desc.slice(0, 90))}${desc.length > 90 ? '…' : ''}</span>
              </div>
            </div>
            <div class="foot"><button class="secondary sm" onclick="viewEvent('${escapeHTML(e._id)}')">View Details</button></div>
          </div>`;
      }).join('')}</div>`;
    }

    function viewEvent(id) {
      const e = data.events.find(x => x._id === id);
      if (!e) return;
      const url = imageURL(e);
      openModal(`
        ${url ? `<img class="preview" src="${escapeHTML(url)}" alt="">` : ''}
        <h3>${escapeHTML(e.eventName)}</h3>
        <div class="sub">${badge(e.status)}</div>
        <dl class="kv">
          <dt>Organizer</dt><dd>${escapeHTML(e.organizer || '-')}</dd>
          <dt>About</dt><dd>${escapeHTML(e.description || '-')}</dd>
        </dl>
        <div class="form-actions"><button class="secondary" onclick="closeModal()">Close</button></div>`);
    }

    /* ---------- Bookings ---------- */
    function canCancel(b) {
      if (lower(b.status) === 'cancelled' || lower(b.status) === 'completed') return false;
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() + 2);
      const bookingDate = new Date(dayISO(b.bookingDate) + 'T00:00:00');
      return !isNaN(bookingDate.getTime()) && bookingDate >= cutoff;
    }

    function bookingsTable(list, withActions = true) {
      return `
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Auditorium</th><th>Event</th><th>Date</th><th>Time</th><th>People</th><th>Status</th>${withActions ? '<th>Actions</th>' : ''}
            </tr></thead>
            <tbody>
              ${list.map(b => `
                <tr>
                  <td><b>${escapeHTML((b.auditoriumId && b.auditoriumId.auditoriumName) || '-')}</b></td>
                  <td>${escapeHTML((b.eventId && b.eventId.eventName) || '-')}</td>
                  <td>${escapeHTML(dateText(b.bookingDate))}</td>
                  <td>${escapeHTML(b.time || '-')}</td>
                  <td>${escapeHTML(b.noOfPeople ?? '-')}</td>
                  <td>${badge(b.status)}</td>
                  ${withActions ? `<td><div class="actions">
                    <button class="secondary sm" title="View" onclick="viewBooking('${escapeHTML(b._id)}')">${ICON.eye}</button>
                    ${canCancel(b) ? `<button class="danger sm" title="Cancel" onclick="confirmCancel('${escapeHTML(b._id)}')">${ICON.x}</button>` : ''}
                  </div></td>` : ''}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    }

    function renderBookings() {
      $('#view').innerHTML = toolbar('Search my bookings...', ['booked', 'pending', 'cancelled'], 'All statuses');
      wireToolbar(drawBookings);
      drawBookings();
    }

    function drawBookings() {
      const all = myBookings();
      const list = all.filter(b => matches(b, 'status'))
        .sort((a, b) => dayISO(b.bookingDate).localeCompare(dayISO(a.bookingDate)));
      if (!list.length) {
        $('#listArea').innerHTML = emptyCard('No bookings found',
          !me.id ? 'Could not detect your user ID. Make sure login saves userId.' :
          all.length ? 'Try a different search or filter.' : 'You have not made any bookings yet. Browse auditoriums to get started.');
        return;
      }
      $('#listArea').innerHTML = `
        <div style="display:flex;justify-content:flex-end;margin-bottom:10px">
          <button class="secondary sm" id="clearBookingFilters">Clear Booking Details</button>
        </div>
        <div class="card table-wrap">${bookingsTable(list)}<div class="table-foot">Showing ${list.length} of ${all.length} bookings</div></div>`;
      const cbf = $('#clearBookingFilters');
      if (cbf) cbf.onclick = () => { ui.search=''; ui.filter=''; const sb=$('#searchBox'); if(sb) sb.value=''; const fb=$('#filterBox'); if(fb) fb.value=''; drawBookings(); };
    }

    function viewBooking(id) {
      const b = data.bookings.find(x => x._id === id);
      if (!b) return;
      openModal(`
        <h3>Booking Details</h3>
        <div class="sub">${badge(b.status)}</div>
        <dl class="kv">
          <dt>Auditorium</dt><dd>${escapeHTML((b.auditoriumId && b.auditoriumId.auditoriumName) || '-')}</dd>
          <dt>Event</dt><dd>${escapeHTML((b.eventId && b.eventId.eventName) || '-')}</dd>
          <dt>Date</dt><dd>${escapeHTML(dateText(b.bookingDate))}</dd>
          <dt>Time</dt><dd>${escapeHTML(b.time || '-')}</dd>
          <dt>People</dt><dd>${escapeHTML(b.noOfPeople ?? '-')}</dd>
        </dl>
        <div class="form-actions">
          <button class="secondary" onclick="closeModal()">Close</button>
          ${canCancel(b) ? `<button class="danger" onclick="confirmCancel('${escapeHTML(b._id)}')">Cancel Booking</button>` : ''}
        </div>`);
    }

    function confirmCancel(id) {
      openModal(`
        <div class="confirm-box">
          <div class="confirm-ico">${ICON.x}</div>
          <h3>Cancel this booking?</h3>
          <p>This action cannot be undone.</p>
          <div class="form-actions">
            <button class="secondary" onclick="closeModal()">Keep Booking</button>
            <button id="cancelYes" style="background:var(--red);color:#fff">Yes, Cancel</button>
          </div>
        </div>`);
      $('#cancelYes').onclick = async () => {
        const btn = $('#cancelYes');
        btn.disabled = true;
        try {
          await api('bookings/' + id + '/cancel', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
          });
          closeModal();
          toast('Booking cancelled');
          await showPage(currentPage);
        } catch (e) {
          btn.disabled = false;
          toast(e.message, 'error');
        }
      };
    }

    /* ---------- New booking ---------- */
    function openBooking(auditoriumId) {
      const open = data.auditoriums.filter(a => lower(a.status) !== 'inactive');
      if (!open.length) { toast('No auditoriums are available right now', 'error'); return; }
      const selected = open.find(a => a._id === auditoriumId) || open[0];
      const events = data.events.filter(e => !['completed', 'cancelled'].includes(lower(e.status)));

      openModal(`
        <h3>Book an Auditorium</h3>
        <div class="sub">Fill in the details to reserve your date</div>
        <div id="formErr"></div>
        <form id="bookForm" novalidate>
          <label>Auditorium
            <select id="bkAud">
              ${open.map(a => `<option value="${escapeHTML(a._id)}" ${a._id === selected._id ? 'selected' : ''}>${escapeHTML(a.auditoriumName)}</option>`).join('')}
            </select>
          </label>
          <label>Event (optional)
            <select id="bkEvent">
              <option value="">No specific event</option>
              ${events.map(e => `<option value="${escapeHTML(e._id)}">${escapeHTML(e.eventName)}</option>`).join('')}
            </select>
          </label>
          <div id="bkCalendarWrap" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div style="font-weight:600" id="bkCalTitle"></div>
              <div style="display:flex;gap:6px">
                <button type="button" class="secondary sm" id="bkCalPrev">&lt;</button>
                <button type="button" class="secondary sm" id="bkCalNext">&gt;</button>
              </div>
            </div>
            <div id="bkCalendar" style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px"></div>
            <div style="display:flex;gap:12px;margin-top:8px;font-size:12px">
              <span><span style="display:inline-block;width:10px;height:10px;background:var(--green);border-radius:2px;margin-right:4px"></span>Available</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:#fbbf24;border-radius:2px;margin-right:4px"></span>Partial</span>
              <span><span style="display:inline-block;width:10px;height:10px;background:var(--red);border-radius:2px;margin-right:4px"></span>Booked</span>
            </div>
          </div>
          <input type="hidden" id="bkDate" required>
          <div style="font-size:13px;margin:6px 0" id="bkSelectedDate">No date selected</div>
          <div class="form-row">
            <label>From<input type="time" id="bkFromTime" required></label>
            <label>To<input type="time" id="bkToTime" required></label>
          </div>
          <div id="bkAvail" style="margin:6px 0 10px;font-size:13px;font-weight:600"></div>
          <label>Number of people<input type="number" id="bkPeople" min="1" step="1" value="1" required></label>
          <div class="summary"><span id="bkInfo"></span><b id="bkPrice"></b></div>
          <div class="form-actions">
            <button type="button" class="secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" id="bkSubmit">${ICON.check}<span>Confirm Booking</span></button>
          </div>
        </form>`);

      let bkCalMonth = todayISO().slice(0, 7);
      let bkSelectedDate = '';

      const refresh = () => {
        const a = data.auditoriums.find(x => x._id === $('#bkAud').value);
        if (!a) return;
        $('#bkInfo').textContent = 'Capacity ' + (a.capacity ?? '-') + ' • per day';
        $('#bkPrice').textContent = '₹' + (a.pricePerDay ?? '-');
        if (a.capacity) $('#bkPeople').max = a.capacity;
      };

      const shiftMonth = (ym, delta) => {
        const parts = ym.split('-').map(Number);
        const d = new Date(parts[0], parts[1] - 1 + delta, 1);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      };

      const loadCalendar = async () => {
        const a = data.auditoriums.find(x => x._id === $('#bkAud').value);
        if (!a) return;
        $('#bkCalTitle').textContent = new Date(bkCalMonth + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        $('#bkCalendar').innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--mut)">Loading...</div>';
        try {
          const r = await api('auditoriums/' + encodeURIComponent(a._id) + '/availability?month=' + encodeURIComponent(bkCalMonth));
          const days = (r && r.days) ? r.days : [];
          const statusMap = {};
          days.forEach(d => { statusMap[d.date] = d; });
          const first = new Date(bkCalMonth + '-01');
          const startWeekday = first.getDay();
          const today = todayISO();
          const dim = new Date(Number(bkCalMonth.slice(0,4)), Number(bkCalMonth.slice(5,7)), 0).getDate();
          const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          let html = names.map(n => '<div style="text-align:center;font-size:11px;color:var(--mut)">' + n + '</div>').join('');
          for (let i = 0; i < startWeekday; i++) html += '<div></div>';
          for (let d = 1; d <= dim; d++) {
            const ds = bkCalMonth + '-' + String(d).padStart(2, '0');
            const info = statusMap[ds] || { status: 'available' };
            const color = info.status === 'booked' ? 'var(--red)' : (info.status === 'partial' ? '#fbbf24' : 'var(--green)');
            const past = ds < today;
            const disabled = info.status === 'booked' || past;
            const selected = ds === bkSelectedDate ? 'outline:2px solid var(--gold);outline-offset:-2px;' : '';
            html += '<button type="button" class="secondary sm" data-date="' + ds + '" style="padding:6px 0;background:' + color + ';color:#fff;opacity:' + (disabled ? '.45' : '1') + ';' + selected + '" ' + (disabled ? 'disabled' : '') + '>' + d + '</button>';
          }
          $('#bkCalendar').innerHTML = html;
          $('#bkCalendar').querySelectorAll('button[data-date]').forEach(btn => {
            btn.addEventListener('click', () => {
              const ds = btn.dataset.date;
              selectDate(ds, statusMap[ds] || { status: 'available' });
            });
          });
        } catch (e) {
          $('#bkCalendar').innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--red)">Could not load calendar</div>';
        }
      };

      function selectDate(date, info) {
        bkSelectedDate = date;
        $('#bkDate').value = date;
        $('#bkSelectedDate').textContent = 'Selected date: ' + dateText(date);
        const el = $('#bkAvail');
        const s = info ? info.status : 'available';
        if (s === 'booked') {
          el.textContent = 'Already fully booked';
          el.style.color = 'var(--red)';
          $('#bkSubmit').disabled = true;
        } else if (s === 'partial') {
          el.textContent = 'Partially booked - pick a free time' + (info && info.slots && info.slots.length ? ' (booked: ' + info.slots.map(x => (x.fromTime || '?') + '-' + (x.toTime || '?')).join(', ') + ')' : '');
          el.style.color = '#fbbf24';
          $('#bkSubmit').disabled = false;
        } else {
          el.textContent = 'Available';
          el.style.color = 'var(--green)';
          $('#bkSubmit').disabled = false;
        }
        loadCalendar();
      }

      $('#bkCalPrev').addEventListener('click', () => { bkCalMonth = shiftMonth(bkCalMonth, -1); loadCalendar(); });
      $('#bkCalNext').addEventListener('click', () => { bkCalMonth = shiftMonth(bkCalMonth, 1); loadCalendar(); });
      $('#bkAud').addEventListener('change', () => { refresh(); loadCalendar(); });
      refresh();
      loadCalendar();


      $('#bookForm').onsubmit = async ev => {
        ev.preventDefault();
        const a = data.auditoriums.find(x => x._id === $('#bkAud').value);
        const date = $('#bkDate').value;
        const people = Number($('#bkPeople').value);
        const showErr = m => { $('#formErr').innerHTML = `<div class="form-err">${escapeHTML(m)}</div>`; };

        if (!me.id) return showErr('Could not detect your user ID. Please log out and log in again.');
        if (!date) return showErr('Please choose a date.');
        if (date < todayISO()) return showErr('The date cannot be in the past.');
        const from = $('#bkFromTime').value;
        const to = $('#bkToTime').value;
        if (!from || !to) return showErr('Please choose from and to times.');
        if (from >= to) return showErr('End time must be after start time.');
        if (!Number.isInteger(people) || people < 1) return showErr('Enter a valid number of people.');
        if (a && a.capacity && people > Number(a.capacity)) return showErr('This hall holds up to ' + a.capacity + ' people.');

        const toMins = t => { const p = String(t).split(':').map(Number); return p[0]*60 + (p[1]||0); };
        const newStart = toMins(from);
        const newEnd = toMins(to);
        const clash = data.bookings.some(b => {
          if (String(idOf(b.auditoriumId)) !== String(a._id)) return false;
          if (dayISO(b.bookingDate) !== date) return false;
          if (lower(b.status) === 'cancelled') return false;
          let es = toMins(b.fromTime), ee = toMins(b.toTime);
          if (es === null || ee === null) {
            if (b.time && String(b.time).includes('-')) {
              const parts = String(b.time).split('-').map(x => x.trim());
              es = toMins(parts[0]); ee = toMins(parts[1]);
            }
          }
          if (es === null || ee === null || ee <= es) { es = 0; ee = 24*60; }
          return es < newEnd && newStart < ee;
        });
        if (clash) return showErr('This auditorium is already booked for the selected time. Please pick another time.');

        const payload = {
          userId: me.id,
          auditoriumId: a._id,
          bookingDate: date,
          fromTime: from,
          toTime: to,
          time: from + ' - ' + to,
          noOfPeople: people,
          status: 'booked'
        };
        if ($('#bkEvent').value) payload.eventId = $('#bkEvent').value;

        const btn = $('#bkSubmit');
        btn.disabled = true;
        try {
          await api('bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          closeModal();
          toast('Booking request submitted');
          await showPage('bookings');
        } catch (e) {
          btn.disabled = false;
          showErr(e.message);
        }
      };
    }

    /* ---------- Profile ---------- */
    function renderProfile() {
      const my = myBookings();
      const rows = [
        ['Full name', me.name], ['Email', me.email], ['Phone', me.phoneNumber],
        ['Address', me.address], ['Username', me.username], ['Account type', me.usertype]
      ];
      $('#view').innerHTML = `
        <div class="profile">
          <div class="card profile-card">
            <div class="avatar wine big">${escapeHTML(initials(me.name))}</div>
            <h3>${escapeHTML(me.name)}</h3>
            <p>${escapeHTML(me.email || me.username || '')}</p>
            <div style="margin-top:16px">${badge(me.usertype || 'user')}</div>
          </div>
          <div class="card">
            <h3>Account Details</h3><div class="sub">Information saved on your account</div>
            <dl class="kv">${rows.map(([k, v]) => `<dt>${escapeHTML(k)}</dt><dd>${escapeHTML(v || '-')}</dd>`).join('')}</dl>
            <h3 style="margin-top:8px">Activity</h3><div class="sub">Your booking summary</div>
            <dl class="kv" style="margin-bottom:0">
              <dt>Total</dt><dd>${my.length}</dd>
              <dt>Confirmed</dt><dd>${my.filter(b => ['booked', 'confirmed'].includes(lower(b.status))).length}</dd>
              <dt>Pending</dt><dd>${my.filter(b => lower(b.status) === 'pending').length}</dd>
              <dt>Cancelled</dt><dd>${my.filter(b => lower(b.status) === 'cancelled').length}</dd>
            </dl>
          </div>
        </div>`;
    }

    /* ---------- Modal ---------- */
    function openModal(html) { $('#modalContent').innerHTML = html; $('#modal').hidden = false; }
    function closeModal() { $('#modal').hidden = true; $('#modalContent').innerHTML = ''; }

    /* ---------- Events ---------- */
    document.querySelectorAll('aside nav button[data-page]').forEach(b =>
      b.addEventListener('click', () => showPage(b.dataset.page)));
    $('#logoutButton').addEventListener('click', logout);
    $('#themeButton').addEventListener('click', () =>
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    $('#menuButton').addEventListener('click', () => {
      $('#sidebar').classList.add('open');
      $('#scrim').classList.add('show');
    });
    $('#scrim').addEventListener('click', closeSidebar);
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    start();
  