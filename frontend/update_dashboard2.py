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

          const activeAuditoriums = auditoriumRecords.filter(item => item.status === 'active').length;
          const adminAccounts = userRecords.filter(item => item.usertype === 'admin').length;
          const confirmedBookings = bookingRecords.filter(item => item.status === 'booked').length;
          const cancelledBookings = bookingRecords.filter(item => item.status === 'cancelled').length;
          const estimatedRevenue = auditoriumRecords.reduce((sum, item) => sum + (Number(item.pricePerDay) || 0), 0);

          const stats = [
            ['Total Auditoriums', auditoriumRecords.length, '🏛️', 'linear-gradient(135deg, var(--gold), var(--gold2))'],
            ['Active Venues', activeAuditoriums, '✅', 'linear-gradient(135deg, var(--green), #6ee7b7)'],
            ['Total Users', userRecords.length, '👥', 'linear-gradient(135deg, var(--blue), #93c5fd)'],
            ['Administrators', adminAccounts, '🛡️', 'linear-gradient(135deg, var(--amber), #fcd34d)'],
            ['Total Events', eventRecords.length, '📅', 'linear-gradient(135deg, var(--gold), var(--gold2))'],
            ['Confirmed Bookings', confirmedBookings, '🎟️', 'linear-gradient(135deg, var(--green), #6ee7b7)'],
            ['Cancelled Bookings', cancelledBookings, '⚠️', 'linear-gradient(135deg, var(--red), #fca5a5)'],
            ['Venue Rate', auditoriumRecords.length ? Math.round((activeAuditoriums / auditoriumRecords.length) * 100) + '%' : '0%', '📈', 'linear-gradient(135deg, var(--blue), #93c5fd)']
          ];

          const maxCount = Math.max(...stats.map(item => Number(String(item[1]).replace('%', '')) || 0), 1);

          const recentBookings = bookingRecords.slice(0, 6).map((record) => `
            <tr>
              <td>
                <div class="person-cell">
                  <span class="avatar-chip">${escapeHTML((record.userId?.name || '-').charAt(0))}</span>
                  <div>
                    <strong>${escapeHTML(record.userId?.name || '-')}</strong>
                    <small>${escapeHTML(record.userId?.email || 'No email')}</small>
                  </div>
                </div>
              </td>
              <td>${escapeHTML(record.auditoriumId?.auditoriumName || '-')}</td>
              <td>${escapeHTML(record.bookingDate)}</td>
              <td>${escapeHTML(record.noOfPeople ?? '-')}</td>
              <td>${statusBadge(record.status)}</td>
            </tr>
          `).join('');

          const activityItems = [
            ...bookingRecords.slice(0, 4).map(record => ({
              icon: '🎟️',
              title: `Booking ${escapeHTML(record.status)} for ${escapeHTML(record.auditoriumId?.auditoriumName || 'an auditorium')}`,
              meta: `${escapeHTML(record.userId?.name || 'Unknown user')} • ${escapeHTML(record.bookingDate)}`
            })),
            ...eventRecords.slice(0, 3).map(record => ({
              icon: '📅',
              title: `Event registered: ${escapeHTML(record.eventName)}`,
              meta: `Organizer: ${escapeHTML(record.organizer || 'Not assigned')}`
            }))
          ].slice(0, 7).map(item => `
            <li>
              <span class="activity-icon">${item.icon}</span>
              <div>
                <strong>${item.title}</strong>
                <small>${item.meta}</small>
              </div>
            </li>
          `).join('');

          $('#view').innerHTML = `
            <div class="hero-banner">
              <div>
                <span class="hero-kicker">Administrator Control Center</span>
                <h1>Advanced Auditorium Dashboard</h1>
                <p>Monitor reservations, manage resources, and keep every venue, event, and user workflow running smoothly from one command center.</p>
              </div>
              <div class="hero-actions">
                <button onclick="showPage('auditoriums')">Manage Auditoriums</button>
                <button class="secondary" onclick="showPage('bookings')">Review Bookings</button>
              </div>
            </div>

            <div class="stats">
              ${stats.map(([title, count, icon, color]) => `
                <div class="stat-card stat-card-live">
                  <div class="stat-icon" style="background:${color}">${icon}</div>
                  <div>
                    <small>${escapeHTML(title)}</small>
                    <b>${escapeHTML(count)}</b>
                    <span class="stat-trend">Live count</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="dashboard-grid">
              <section class="card dashboard-panel panel-accent">
                <div class="panel-head">
                  <h3>Performance Analytics</h3>
                  <span>Current resource metrics</span>
                </div>
                <div class="analytics-chart">
                  ${stats.map(([title, count, , color]) => `
                    <div class="analytics-row">
                      <span>${escapeHTML(title)}</span>
                      <div class="analytics-track">
                        <div class="analytics-bar" style="width:${Math.max(8, (Number(String(count).replace('%', '')) || 0) / maxCount * 100)}%; background:${color}"></div>
                      </div>
                      <strong>${escapeHTML(count)}</strong>
                    </div>
                  `).join('')}
                </div>
                <div class="insight-row">
                  <div class="insight-card">
                    <small>Estimated Venue Rate</small>
                    <b>${escapeHTML(auditoriumRecords.length ? Math.round((activeAuditoriums / auditoriumRecords.length) * 100) + '%' : '0%')}</b>
                  </div>
                  <div class="insight-card">
                    <small>Standard Monthly Rate</small>
                    <b>₹${escapeHTML(estimatedRevenue)}</b>
                  </div>
                </div>
              </section>

              <section class="card dashboard-panel">
                <div class="panel-head">
                  <h3>Quick Actions</h3>
                  <span>Jump into management tasks</span>
                </div>
                <div class="quick-actions">
                  <button onclick="showPage('auditoriums')"><span>➕</span> Add Auditorium</button>
                  <button class="secondary" onclick="showPage('users')"><span>👤</span> Manage Users</button>
                  <button class="secondary" onclick="showPage('events')"><span>🎯</span> Create Event</button>
                  <button class="secondary" onclick="showPage('bookings')"><span>🧾</span> Review Bookings</button>
                </div>
                <div class="admin-note">
                  <h4>Operational Tip</h4>
                  <p<|message|>Keep auditorium statuses updated to prevent bookings on inactive venues and keep schedules accurate.</p>
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
                        <th>People</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${recentBookings || '<tr><td colspan="5">No bookings found yet.</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="card dashboard-panel">
                <div class="panel-head">
                  <h3>Activity Feed</h3>
                  <span>Latest system movement</span>
                </div>
                <ul class="activity-feed">
                  ${activityItems || '<li><span class="activity-icon">ℹ️</span><div><strong>No recent activity</strong><small>The latest bookings and events will appear here.</small></div></li>'}
                </ul>
              </section>

              <section class="card dashboard-panel">
                <div class="panel-head">
                  <h3>System Status</h3>
                  <span>Platform health overview</span>
                </div>
                <ul class="status-list">
                  <li><span>Backend API</span><b>Online</b></li>
                  <li><span>Admin Session</span><b>Active</b></li>
                  <li><span>Active Venues</span><b>${escapeHTML(activeAuditoriums)}</b></li>
                  <li><span>Upcoming Events</span><b>${escapeHTML(eventRecords.filter(item => item.status === 'upcoming').length)}</b></li>
                  <li><span>Confirmed Bookings</span><b>${escapeHTML(confirmedBookings)}</b></li>
                  <li><span>Cancelled Bookings</span><b>${escapeHTML(cancelledBookings)}</b></li>
                </ul>
              </section>

              <section class="card dashboard-panel welcome-card">
                <div class="panel-head">
                  <h3>Welcome, Administrator!</h3>
                  <span>Everything is organized and ready</span>
                </div>
                <p>Use the sidebar or quick actions above to manage auditoriums, users, events, and bookings. Every update stays synchronized directly with the backend API.</p>
                <div class="welcome-metrics">
                  <div><b>${escapeHTML(userRecords.length)}</b><span>Users</span></div>
                  <div><b>${escapeHTML(eventRecords.length)}</b><span>Events</span></div>
                  <div><b>${escapeHTML(bookingRecords.length)}</b><span>Bookings</span></div>
                </div>
              </section>
            </div>`;
          return;
        }'''

s = s[:start] + new_block + s[end:]
open(p, "w", encoding="utf-8").write(s)
print("done")
PY