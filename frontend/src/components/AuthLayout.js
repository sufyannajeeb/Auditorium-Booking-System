import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../auth.css';

const THEME_CSS = [
  '/home/assets/vendor/bootstrap/css/bootstrap.min.css',
  '/home/assets/vendor/bootstrap-icons/bootstrap-icons.css',
  '/home/assets/css/main.css'
];

const THEME_FONTS =
  'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Raleway:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';

// The auth pages need the template assets as long as any of them is mounted.
// A ref count avoids tearing the stylesheets down while switching between
// Login and Registration.
let themeRefCount = 0;

function addThemeAssets() {
  if (!document.querySelector('link[data-auth-event-fonts]')) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = THEME_FONTS;
    fontLink.dataset.authEventFonts = 'true';
    document.head.appendChild(fontLink);
  }

  THEME_CSS.forEach((file) => {
    if (!document.querySelector(`link[data-auth-event-css="${file}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = file;
      link.dataset.authEventCss = file;
      document.head.appendChild(link);
    }
  });
}

function removeThemeAssets() {
  document
    .querySelectorAll('link[data-auth-event-css]')
    .forEach((link) => link.remove());
  const fontLink = document.querySelector('link[data-auth-event-fonts]');
  if (fontLink) fontLink.remove();
}

function AuthLayout({ title, subtitle, breadcrumb, children }) {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  // Load the same template assets the Home page uses so both share the new look.
  useEffect(() => {
    themeRefCount += 1;
    addThemeAssets();
    document.body.classList.add('auth-body');

    return () => {
      themeRefCount -= 1;
      document.body.classList.remove('auth-body', 'mobile-nav-active');
      if (themeRefCount <= 0) {
        themeRefCount = 0;
        removeThemeAssets();
      }
    };
  }, []);

  // Mirror the template's mobile menu behaviour without loading main.js.
  useEffect(() => {
    document.body.classList.toggle('mobile-nav-active', navOpen);
  }, [navOpen]);

  const isActive = (path) => (pathname === path ? 'active' : undefined);

  const navItems = [
    { to: '/', label: 'Home', type: 'route' },
    { href: '/#venue', label: 'Venue' },
    { href: '/#gallery', label: 'Gallery' },
    { href: '/#contact', label: 'Contact' },
    { to: '/login', label: 'Login', type: 'route' },
    { to: '/registration', label: 'Registration', type: 'route' }
  ];

  return (
    <div className="auth-page">
      <header
        id="header"
        className="header auth-header d-flex align-items-center fixed-top"
      >
        <div className="container-fluid container-xl position-relative d-flex align-items-center">
          <Link to="/" className="logo d-flex align-items-center me-auto">
            <img src="/home/assets/img/logo.png" alt="Auditorium Booking System" />
          </Link>

          <nav id="navmenu" className="navmenu">
            <ul className={navOpen ? 'auth-nav-open' : undefined}>
              {navItems.map((item) =>
                item.type === 'route' ? (
                  <li key={item.label}>
                    <Link to={item.to} className={isActive(item.to)}>
                      {item.label}
                    </Link>
                  </li>
                ) : (
                  <li key={item.label}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                )
              )}
            </ul>
            <i
              className={`mobile-nav-toggle d-xl-none bi ${
                navOpen ? 'bi-x' : 'bi-list'
              }`}
              role="button"
              aria-label="Toggle navigation"
              onClick={() => setNavOpen((open) => !open)}
            ></i>
          </nav>
        </div>
      </header>

      <main className="main">
        <div
          className="page-title auth-page-title"
          style={{
            backgroundImage: "url('/home/assets/img/page-title-bg.webp')"
          }}
        >
          <div className="container position-relative">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            <nav className="breadcrumbs">
              <ol>
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li className="current">{breadcrumb}</li>
              </ol>
            </nav>
          </div>
        </div>

        <section className="section auth-section">
          <div className="container">{children}</div>
        </section>
      </main>

      <footer id="footer" className="footer dark-background auth-footer">
        <div className="footer-top">
          <div className="container">
            <div className="row gy-4">
              <div className="col-lg-5 col-md-6 footer-about">
                <Link to="/" className="logo d-flex align-items-center">
                  <span className="sitename">Auditorium Booking System</span>
                </Link>
                <p className="pt-3">
                  Book, manage, and track auditorium reservations online.
                </p>
              </div>

              <div className="col-lg-3 col-md-6 footer-links">
                <h4>Explore</h4>
                <ul>
                  <li>
                    <Link to="/">Home</Link>
                  </li>
                  <li>
                    <a href="/#venue">Venue</a>
                  </li>
                  <li>
                    <a href="/#gallery">Gallery</a>
                  </li>
                  <li>
                    <a href="/#contact">Contact</a>
                  </li>
                </ul>
              </div>

              <div className="col-lg-4 col-md-6 footer-links">
                <h4>Account</h4>
                <ul>
                  <li>
                    <Link to="/login">Login</Link>
                  </li>
                  <li>
                    <Link to="/registration">Registration</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright text-center">
          <div className="container">
            <div>
              © Copyright <strong>Auditorium Booking System</strong>. All Rights
              Reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AuthLayout;
