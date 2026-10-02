# Brisk Internet

A React rebuild of the Brisk Internet website. Page templates and original theme assets were adapted from the supplied Demo snapshot; the snapshot itself is not part of the app bundle.

## Stack

- React 19
- Vite 7
- Tailwind CSS 4
- Original Elementor/Ekommart styles and local assets

## Pages

Home, About, Package, Offer, Bill Pay, Contact, Package Form, Privacy Policy, and Terms & Conditions.

## Project Layout

- `src/main.jsx` selects the page template and rewrites local links/assets.
- `src/templates/` contains the page markup rendered by React.
- `public/reference/` contains the page-specific CSS, fonts, and images.
- `public/reference/Main/images/` contains the homepage banners and shared brand assets.

## Run

```sh
npm install
npm run dev
```

Vite runs at `http://127.0.0.1:5180/`. The port is fixed; stop any existing server on 5180 before starting this app.

## Build

```sh
npm run build
npm run preview
```

The Package Form follows the supplied reference layout and does not collect order details. There is no backend service connected.
