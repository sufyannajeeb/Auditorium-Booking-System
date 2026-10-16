
    // Backend URL
    const API = 'http://localhost:5000';

    let token = localStorage.getItem('tok');
    let currentPage = 'dashboard';
    let records = [];

    const $ = selector => document.querySelector(selector);

    const escapeHTML = value =>
      String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]);

    const dateText = value =>
      value ? new Date(value).toLocaleDateString() : '';

    function imageHTML(record) {
      if (!record.image) return '';
      const url = /^https?:\/\//i.test(record.image)
        ? record.image
        : API + (record.image.startsWith('/')
          ? record.image
          : '/' + record.image);

      return `<img src="${escapeHTML(url)}"
        width="44" height="44"
        style="object-fit:cover;border-radius:6px"
        alt="Record image">`;
    }

    function statusBadge(status) {
      const safeStatus = String(status ?? '');
      return `<span class="badge ${escapeHTML(safeStatus)}">${escapeHTML(safeStatus || '-')}</span>`;
    }

    const config = {
      auditoriums: {
        title: 'Auditoriums',
        fields: [
          ['auditoriumName', 'Auditorium name'],
          ['location', 'Location'],
          ['capacity', 'Capacity', 'number'],
          ['pricePerDay', 'Price per day', 'number'],
          ['status', 'Status', 'select', ['active', 'inactive']],
          ['facilities', 'Facilities (comma separated)'],
          ['image', 'Image', 'file']
        ],
        columns: [
          ['', r => imageHTML(r)],
          ['Name', r => escapeHTML(r.auditoriumName)],
          ['Location', r => escapeHTML(r.location)],
          ['Capacity', r => escapeHTML(r.capacity)],
          ['Price/day', r => '₹' + escapeHTML(r.pricePerDay)],
          ['Status', r => statusBadge(r.status)]
        ]
      },

      users: {
        title: 'Users',
        fields: [
          ['name', 'Name'],
          ['email', 'Email', 'email'],
          ['phoneNumber', 'Phone number'],
          ['address', 'Address'],
          ['username', 'Username'],
          ['password', 'Password', 'password'],
          ['usertype', 'User type', 'select', ['user', 'admin']]
        ],
        columns: [
          ['Name', r => escapeHTML(r.name)],
          ['Email', r => escapeHTML(r.email)],
          ['Phone', r => escapeHTML(r.phoneNumber)],
          ['Username', r => escapeHTML(r.username)],
          ['Type', r => statusBadge(r.usertype)]
        ]
      },

      events: {
        title: 'Events',
        fields: [
          ['eventName', 'Event name'],
          ['description', 'Description', 'textarea'],
          ['organizer', 'Organizer'],
          ['image', 'Image', 'file'],
          ['status', 'Status', 'select',
            ['upcoming', 'ongoing', 'completed', 'cancelled']]
        ],
        columns: [
          ['', r => imageHTML(r)],
          ['Event', r => escapeHTML(r.eventName)],
          ['Organizer', r => escapeHTML(r.organizer)],
          ['Status', r => statusBadge(r.status)]
        ]
      },

      bookings: {
        title: 'Bookings',
        fields: [],
        columns: [
          ['User', r => escapeHTML(r.userId?.name || '-')],
          ['Auditorium', r => escapeHTML(r.auditoriumId?.auditoriumName || '-')],
          ['Event', r => escapeHTML(r.eventId?.eventName || '-')],
          ['Date', r => escapeHTML(dateText(r.bookingDate))],
          ['Time', r => escapeHTML(r.time)],
          ['People', r => escapeHTML(r.noOfPeople)],
          ['Status', r => statusBadge(r.status)]
        ]
      }
    };

    async function api(endpoint, options = {}) {
      const headers = {
        Authorization: 'Bearer ' + token,
        ...(options.headers || {})
      };

      // FormData sets its own Content-Type boundary.
      const response = await fetch(API + '/api/' + endpoint, {
        ...options,
        headers
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error(result.message || 'Access denied. Please log in again.');
      }

      if (!response.ok) {
        throw new Error(result.message || `Request failed (${response.status})`);
      }

      return result;
    }

    function logout() {
      localStorage.removeItem('tok');
      localStorage.removeItem('usertype');
      token = null;
      window.location.href = '/';
    }

    function extractRecords(result) {
      if (Array.isArray(result)) return result;
      if (Array.isArray(result.records)) return result.records;
      if (Array.isArray(result.data)) return result.data;
      if (Array.isArray(result.users)) return result.users;
      if (Array.isArray(result.auditoriums)) return result.auditoriums;
      if (Array.isArray(result.events)) return result.events;
      if (Array.isArray(result.bookings)) return result.bookings;
      return [];
    }

    async function start() {
      const usertype = localStorage.getItem('usertype');

      if (!token || usertype !== 'admin') {
        $('#view').innerHTML = `
          <div class="card">
            <h2>Admin login required</h2>
            <p>Please log in using an administrator account.</p>
            <button onclick="window.location.href='/'">Go to Login</button>
          </div>`;
        $('#app').hidden = false;
        return;
      }

      $('#app').hidden = false;
      await showPage('dashboard');
    }

    async function showPage(page) {
      currentPage = page;

      document.querySelectorAll('aside button[data-page]').forEach(button => {
        button.classList.toggle('active', button.dataset.page === page);
      });

      $('#view').innerHTML = '<p class="notice">Loading data...</p>';

      try {
        if (page === 'dashboard') {
          const [auditoriums, users, events, bookings] = await Promise.all([
            api('auditoriums'),
            api('users'),
            api('events'),
            api('bookings')
          ]);

          const auditoriumRecords = extractRecords(auditoriums);
          const userRecords = extractRecords(users);
          const eventRecords = extractRecords(events);
          const bookingRecords = extractRecords(bookings);

          const stats = [
            ['Total Auditoriums', auditoriumRecords.length, '🏛️', 'var(--gold2)'],
            ['Active Auditoriums', auditoriumRecords.filter(item => item.status === 'active').length, '✅', 'var(--green)'],
            ['Total Users', userRecords.length, '👥', 'var(--blue)'],
            ['Administrator Accounts', userRecords.filter(item => item.usertype === 'admin').length, '🛡️', 'var(--amber)'],
            ['Total Events', eventRecords.length, '📅', 'var(--gold2)'],
            ['Total Bookings', bookingRecords.length, '🎟️', 'var(--green)'],
            ['Confirmed Bookings', bookingRecords.filter(item => item.status === 'booked').length, '📌', 'var(--green)'],
            ['Cancelled Bookings', bookingRecords.filter(item => item.status === 'cancelled').length, '⚠️', 'var(--red)']
          ];

          const recentBookings = bookingRecords.slice(0, 5).map((record) => `
            <tr>
              <td>${escapeHTML(record.userId?.name || '-')}</td>
              <td>${escapeHTML(record.auditoriumId?.auditoriumName || '-')}</td>
              <td>${escapeHTML(record.bookingDate)}</td>
              <td>${statusBadge(record.status)}</td>
            </tr>
          `).join('');

          $('#view').innerHTML = `
            <div class="hero-banner">
              <div>
                <span class="hero-kicker">Administrator Control Center</span>
                <h1>Advanced Auditorium Dashboard</h1>
                <p>Monitor bookings, manage resources, and keep every event workflow running smoothly from one place.</p>
              </div>
              <div class="hero-actions">
                <button onclick="showPage('auditoriums')">Manage Auditoriums</button>
                <button class="secondary" onclick="showPage('bookings')">View Bookings</button>
              </div>
            </div>

            <div class="stats">
              ${stats.map(([title, count, icon, color]) => `
                <div class="stat-card">
                  <div class="stat-icon" style="color:${color}">${icon}</div>
                  <div>
                    <small>${escapeHTML(title)}</small>
                    <b style="color:${color}">${escapeHTML(count)}</b>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="dashboard-grid">
              <section class="card dashboard-panel">
                <div class="panel-head">
                  <h3>Quick Actions</h3>
                  <span>Manage core records instantly</span>
                </div>
                <div class="quick-actions">
                  <button onclick="showPage('auditoriums')">+ Add Auditorium</button>
                  <button class="secondary" onclick="showPage('users')">Manage Users</button>
                  <button class="secondary" onclick="showPage('events')">Create Event</button>
                  <button class="secondary" onclick="showPage('bookings')">Review Bookings</button>
                </div>
              </section>

              <section class="card dashboard-panel">
                <div class="panel-head">
                  <h3>Recent Bookings</h3>
                  <span>Latest reservation activity</span>
                </div>
                <div class="table-wrap">
                  <table class="mini-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Auditorium</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${recentBookings || '<tr><td colspan="4">No bookings yet.</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="card dashboard-panel">
                <div class="panel-head">
                  <h3>System Status</h3>
                  <span>Platform overview</span>
                </div>
                <ul class="status-list">
                  <li><span>Backend API</span><b>Online</b></li>
                  <li><span>Admin Session</span><b>Active</b></li>
                  <li><span>Active Venues</span><b>${escapeHTML(auditoriumRecords.filter(item => item.status === 'active').length)}</b></li>
                  <li><span>Upcoming Events</span><b>${escapeHTML(eventRecords.filter(item => item.status === 'upcoming').length)}</b></li>
                  <li><span>Confirmed Bookings</span><b>${escapeHTML(bookingRecords.filter(item => item.status === 'booked').length)}</b></li>
                </ul>
              </section>
            </div>

            <div class="card welcome-card">
              <h3>Welcome, Administrator!</h3>
              <p>Use the sidebar or quick actions to manage auditoriums, users, events and bookings. Every change is synced directly with the backend API.</p>
            </div>`;
          return;
        }        const entity = config[page];
        if (!entity) throw new Error('Invalid page');

        const result = await api(page);
        records = extractRecords(result);

        const rows = records.map((record, index) => `
          <tr>
            ${entity.columns.map(column =>
              `<td>${column[1](record)}</td>`
            ).join('')}
            <td>
              <div class="actions">
                <button class="secondary" onclick="viewRecord(${index})">View</button>
                ${page !== 'bookings'
                  ? `<button class="secondary" onclick="editRecord(${index})">Edit</button>
                     <button class="danger" onclick="deleteRecord(${index})">Delete</button>`
                  : ''}
              </div>
            </td>
          </tr>
        `).join('');

        $('#view').innerHTML = `
          <div class="top">
            <h2>${escapeHTML(entity.title)}</h2>
            ${page !== 'bookings'
              ? '<button onclick="editRecord()">+ Add New</button>'
              : ''}
          </div>
          <div class="card table-wrap">
            <table>
              <thead>
                <tr>
                  ${entity.columns.map(column => `<th>${column[0]}</th>`).join('')}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="${entity.columns.length + 1}">No records found.</td></tr>`}
              </tbody>
            </table>
          </div>`;
      } catch (error) {
        $('#view').innerHTML = `
          <div class="card">
            <h2>${escapeHTML(config[page]?.title || 'Dashboard')}</h2>
            <p style="color:#dc2626">${escapeHTML(error.message)}</p>
            <p>Check that the backend is running and that the API route exists.</p>
            <button onclick="showPage('${page}')">Try Again</button>
          </div>`;
      }
    }

    function openModal(html) {
      $('#modalContent').innerHTML = html;
      $('#modal').hidden = false;
    }

    function closeModal() {
      $('#modal').hidden = true;
    }

    function viewRecord(index) {
      const record = records[index];
      if (!record) return;

      const rows = Object.entries(record)
        .filter(([key]) => !['_id', '__v', 'password'].includes(key))
        .map(([key, value]) => {
          let display;

          if (key === 'image' && value) {
            display = imageHTML(record);
          } else if (value && typeof value === 'object') {
            display = escapeHTML(
              value.name ||
              value.auditoriumName ||
              value.eventName ||
              value._id ||
              JSON.stringify(value)
            );
          } else {
            display = escapeHTML(/date/i.test(key) ? dateText(value) : value);
          }

          return `<tr><th>${escapeHTML(key)}</th><td>${display ?? ''}</td></tr>`;
        }).join('');

      openModal(`
        <h3>Record Details</h3>
        <table class="detail-table">${rows}</table>
        <br>
        <button class="secondary" onclick="closeModal()">Close</button>
      `);
    }

    function editRecord(index) {
      const entity = config[currentPage];
      if (!entity || currentPage === 'bookings') return;

      const record = index == null ? null : records[index];

      const fields = entity.fields.map(([key, label, type = 'text', options]) => {
        const value = record && type !== 'password' && type !== 'file'
          ? (record[key] ?? '')
          : '';

        const required = type === 'file' ||
          (type === 'password' && record) ? '' : 'required';

        let input;

        if (type === 'select') {
          input = `<select name="${key}" ${required}>
            ${options.map(option => `
              <option value="${escapeHTML(option)}"
                ${option === value ? 'selected' : ''}>${escapeHTML(option)}</option>
            `).join('')}
          </select>`;
        } else if (type === 'textarea') {
          input = `<textarea name="${key}" rows="3" ${required}>${escapeHTML(value)}</textarea>`;
        } else {
          input = `<input name="${key}" type="${type}"
            value="${escapeHTML(value)}" ${required}
            ${type === 'file' ? 'accept="image/*"' : ''}
            ${type === 'password' && record
              ? 'placeholder="Leave blank to keep current password"' : ''}>`;
        }

        return `<label>${escapeHTML(label)}${input}</label>`;
      }).join('');

      openModal(`
        <h3>${record ? 'Edit' : 'Add'} ${escapeHTML(entity.title.replace(/s$/, ''))}</h3>
        <form id="recordForm" enctype="multipart/form-data">
          ${fields}
          <div class="actions">
            <button type="submit">Save</button>
            <button type="button" class="secondary" onclick="closeModal()">Cancel</button>
          </div>
        </form>
      `);

      $('#recordForm').onsubmit = async event => {
        event.preventDefault();

        const formData = new FormData(event.target);

        if (record && currentPage === 'users' && !formData.get('password')) {
          formData.delete('password');
        }

        const file = formData.get('image');
        if (file instanceof File && !file.name) {
          formData.delete('image');
        }

        // Convert the facilities field to an array if your schema uses an array.
        if (currentPage === 'auditoriums' && formData.has('facilities')) {
          const facilities = String(formData.get('facilities') || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
          formData.set('facilities', JSON.stringify(facilities));
        }

        try {
          const endpoint = currentPage +
            (record ? '/' + record._id : '');

          await api(endpoint, {
            method: record ? 'PUT' : 'POST',
            body: formData
          });

          closeModal();
          await showPage(currentPage);
        } catch (error) {
          alert(error.message);
        }
      };
    }

    async function deleteRecord(index) {
      const record = records[index];
      if (!record) return;

      if (!confirm('Are you sure you want to delete this record?')) return;

      try {
        await api(currentPage + '/' + record._id, {
          method: 'DELETE'
        });
        await showPage(currentPage);
      } catch (error) {
        alert(error.message);
      }
    }

    document.querySelectorAll('aside button[data-page]').forEach(button => {
      button.addEventListener('click', () => showPage(button.dataset.page));
    });

    $('#logoutButton').addEventListener('click', logout);

    $('#modal').addEventListener('click', event => {
      if (event.target.id === 'modal') closeModal();
    });

    start();
  