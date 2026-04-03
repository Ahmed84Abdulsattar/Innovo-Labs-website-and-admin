# Innovo Labs — CMS

A clean, lightweight content management system for the Innovo Labs website. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies, no build step. Just open the files in a browser.

---

## Project Structure

```
innovo/
├── index.html          # Main public-facing website
├── style.css           # Main site styles
├── script.js           # Main site logic (article grid, modal, nav)
│
│
└── admin/
    ├── index.html      # CMS login page
    ├── dashboard.html  # CMS dashboard (articles, editor, stats)
    ├── admin.css       # Shared admin stylesheet (login + dashboard)
    ├── cms-users.js    # Single source of truth for user accounts
    └── dashboard.js    # All dashboard logic (extracted, readable)
```

---

## Features

**Public site**
- Full-screen hero with background video
- Dynamic article grid with a repeating layout pattern
- Featured/hero article support (set from the admin panel)
- Article modal with browser history integration (back button works)
- Scroll-driven nav transition and reading progress bar
- Responsive down to mobile

**Admin CMS**
- Secure login with session management
- Password change per user, with a master reset code
- Article list with stats overview (total, video count, hero article, last published)
- Rich text editor with formatting, image insertion, and video support (upload or YouTube)
- Set any article as the Hero — it appears first and full-width on the main site
- Toast notifications for all actions
- Fully responsive dashboard

---

## Getting Started

No installation required. Open `index.html` in a browser, or use a local server:

```bash
# Using VS Code Live Server — right-click index.html → Open with Live Server

# Or using Python
python -m http.server 8000

# Or using Node
npx serve .
```

Then visit `http://localhost:8000` for the main site and `http://localhost:8000/admin/` for the CMS.

---

## Default Login Credentials

> ⚠️ Credentials are defined in `admin/cms-users.js`. Change all passwords before deploying or pushing to a public repository — never commit real passwords to version control.

Passwords can be changed from inside the dashboard (Change Password), or reset using the master reset code defined in `admin/cms-users.js`.

---

## Adding or Removing Users

Open `admin/cms-users.js` and edit the `INNOVO_USERS` array:

```js
var INNOVO_USERS = [
  { username: 'admin', password: 'something-strong-here',   name: 'Admin' },
  { username: 'ahmed', password: 'something-strong-here',   name: 'Ahmed' },
  // Add or remove users here
];
```

---

## How Articles Are Stored

Articles are stored in the browser's `localStorage` under the key `innovo_articles`. This means:

- Articles are tied to the browser and machine where they were created
- Clearing browser data will delete all articles
- To move articles between machines, export the `localStorage` value manually

For a production setup, replace the `localStorage` calls in `dashboard.js` and `script.js` with a real backend (Firebase, Supabase, or a custom API).

---

## Customising the Hero Video

In `index.html`, replace the video source with your own MP4 file:

```html
<video autoplay muted loop playsinline
  poster="your-poster-image.jpg">
  <source src="your-hero-video.mp4" type="video/mp4">
</video>
```

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Internet Explorer is not supported.

---

## Security Note

This CMS uses client-side authentication with `sessionStorage`. It is suitable for internal or password-protected environments. **Do not expose the admin folder publicly without adding server-side authentication** if the site contains sensitive content.

---

&copy; 2026 Innovo Innovations. All rights reserved.
