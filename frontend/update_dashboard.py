p = r"D:\Projects\miniprj\miniprj\frontend\public\admin.html"
s = open(p, encoding="utf-8").read()
start = s.index("        if (page === 'dashboard') {")
end = s.index("        const entity = config[page];", start)

new_block = r'''        if (page === 'dashboard') {
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
        }'''

s = s[:start] + new_block + s[end:]
open(p, "w", encoding="utf-8").write(s)
print("done")
PY