p=r"D:\Projects\miniprj\miniprj\frontend\public\admin.html"
s=open(p,encoding="utf-8").read()
old="""    <aside>
      <h3>Auditorium Admin</h3>
      <button data-page="dashboard">Dashboard</button>
      <button data-page="auditoriums">Auditoriums</button>
      <button data-page="users">Users</button>
      <button data-page="events">Events</button>
      <button data-page="bookings">Bookings</button>
      <button id="logoutButton" style="margin-top:20px">Logout</button>
    </aside>"""
new="""    <aside>
      <div class="brand-mark">
        <span class="brand-icon">A</span>
        <div>
          <h3>Auditorium Admin</h3>
          <small>Management Console</small>
        </div>
      </div>
      <nav class="side-nav">
        <button data-page="dashboard"><span class="nav-icon">📊</span> Dashboard</button>
        <button data-page="auditoriums"><span class="nav-icon">🏛️</span> Auditoriums</button>
        <button data-page="users"><span class="nav-icon">👥</span> Users</button>
        <button data-page="events"><span class="nav-icon">📅</span> Events</button>
        <button data-page="bookings"><span class="nav-icon">🎟️</span> Bookings</button>
      </nav>
      <button id="logoutButton"><span class="nav-icon">🚪</span> Logout</button>
    </aside>"""
assert old in s
s=s.replace(old,new)
open(p,"w",encoding="utf-8").write(s)
print("done")
PY