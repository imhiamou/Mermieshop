# Mermy Shop

A small pink online shop built from scratch using plain HTML, CSS, and JavaScript.

## Features

- Pink-themed responsive storefront
- Category bubble filters with icons (jewelry, books, toys, kitchen, clothes, accessories)
- Currently no items for sale (coming soon state)
- Add-to-cart with quantity controls
- Sliding cart drawer with subtotal/shipping/total in heart format (`❤️`)
- Checkout dialog with simple form validation
- Cart persistence via `localStorage`

## Run locally

Open `index.html` directly in your browser, or serve it with a simple static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

This project is set up for GitHub Pages using GitHub Actions.

### 1) Push this repo to GitHub

Make sure your repository exists at:

`https://github.com/<username>/<repository>`

### 2) Enable Pages with GitHub Actions

In your repository:

- Go to **Settings → Pages**
- Under **Build and deployment**, set **Source** to **GitHub Actions**

### 3) Deploy

Push to the `main` branch (or run the workflow manually from the **Actions** tab).
The workflow file is:

`.github/workflows/deploy-pages.yml`

After deployment, your shop will be available at:

`https://<username>.github.io/<repository>/`

## Notes

- Asset links in this project are relative, so it works correctly under a repository subpath.
- If your default branch is not `main`, update the workflow trigger branch accordingly.
