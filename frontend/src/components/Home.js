import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Home() {
  const [content, setContent] = useState('');

  useEffect(() => {
    const cssFiles = [
      '/home/assets/vendor/bootstrap/css/bootstrap.min.css',
      '/home/assets/vendor/bootstrap-icons/bootstrap-icons.css',
      '/home/assets/vendor/aos/aos.css',
      '/home/assets/vendor/glightbox/css/glightbox.min.css',
      '/home/assets/vendor/swiper/swiper-bundle.min.css',
      '/home/assets/css/main.css'
    ];
    cssFiles.forEach((file) => {
      if (!document.querySelector(`link[data-home-event-css="${file}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = file;
        link.dataset.homeEventCss = file;
        document.head.appendChild(link);
      }
    });

    let cancelled = false;

    fetch('/home/index.html')
      .then((res) => res.text())
      .then((html) => {
        if (cancelled) return;

        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        let body = bodyMatch ? bodyMatch[1] : html;

        // Use absolute asset URLs for the React app.
        body = body.replace(/(href|src)="assets\//g, '$1="/home/assets/');
        body = body.replace(/href="forms\//g, 'href="/home/forms/');

        // Remove original script tags; React loads them after rendering.
        body = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

        // Remove less relevant conference sections while keeping the venue/gallery/contact look.
        body = body.replace(/<section id="speakers"[\s\S]*?<\/section>/gi, '');
        body = body.replace(/<section id="schedule"[\s\S]*?<\/section>/gi, '');
        body = body.replace(/<section id="hotels"[\s\S]*?<\/section>/gi, '');
        body = body.replace(/<section id="sponsors"[\s\S]*?<\/section>/gi, '');
        body = body.replace(/<section id="faq"[\s\S]*?<\/section>/gi, '');
        body = body.replace(/<section id="buy-tickets"[\s\S]*?<\/section>/gi, '');

        // Remove any YouTube play button from the hero section.
        body = body.replace(/<div[^>]*>\s*<a[^>]*pulsating-play-btn[^>]*><\/a>\s*<\/div>/gi, '');
        body = body.replace(/<a[^>]*pulsating-play-btn[^>]*><\/a>/gi, '');
        body = body.replace(/THE ANNUAL<br><span>MARKETING<\/span> CONFERENCE/g, 'AUDITORIUM<br><span>BOOKING<\/span> SYSTEM');
        body = body.replace(/10-12 December, Downtown Conference Center, New York/g, 'Book, manage, and track auditorium reservations online');
        body = body.replace(/About The Event/g, 'About The System');
        body = body.replace(/Event Venue/g, 'Our Location');
        body = body.replace(/Event Speakers/g, 'Available Venues');

        // Make the navigation focused on the remaining sections plus auth routes.
        body = body.replace(
          /<nav id="navmenu" class="navmenu">[\s\S]*?<\/nav>/i,
          `<nav id="navmenu" class="navmenu">
            <ul>
              <li><a href="#hero" class="active">Home<br></a></li>
              <li><a href="#venue">Venue</a></li>
              <li><a href="#gallery">Gallery</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/registration">Registration</a></li>
            </ul>
            <i class="mobile-nav-toggle d-xl-none bi bi-list"></i>
          </nav>`
        );

        // Update the call to action.
        body = body.replace(/Buy Tickets/g, 'Book an Auditorium');
        body = body.replace(/MyWebsite/g, 'Auditorium Booking System');

        setContent(body);

        window.setTimeout(() => {
          const preloader = document.getElementById('preloader');
          if (preloader) preloader.remove();
        }, 0);

        // Load template behavior after the HTML is present.
        const scripts = [
          '/home/assets/vendor/bootstrap/js/bootstrap.bundle.min.js',
          '/home/assets/vendor/aos/aos.js',
          '/home/assets/vendor/glightbox/js/glightbox.min.js',
          '/home/assets/vendor/swiper/swiper-bundle.min.js',
          '/home/assets/js/main.js'
        ];

        const loadSequentially = async () => {
          for (const src of scripts) {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (!existing) {
              await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = false;
                script.onload = resolve;
                script.onerror = resolve;
                document.body.appendChild(script);
              });
            }
          }

          try {
            window.dispatchEvent(new Event('load'));
          } catch (err) {
            // Ignore synthetic load errors.
          }

          const preloader = document.getElementById('preloader');
          if (preloader) preloader.remove();
        };

        window.setTimeout(() => {
          loadSequentially();
        }, 50);
      })
      .catch(() => {
        setContent('<main class="container py-5"><h1>Auditorium Booking System</h1><p>The template could not be loaded.</p></main>');
      });

    return () => {
      cancelled = true;
      document.querySelectorAll('link[data-home-event-css]').forEach((link) => link.remove());
    };
  }, []);

  return (
    <div
      className="index-page home-event-page"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default Home;