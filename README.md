# Portfolio

Personal portfolio site for Alex Norton, hosted at [design.alexnortn.com](https://design.alexnortn.com).

## Tech Stack

- **Server**: Node.js with Express 4.x
- **Templating**: Pug
- **Styles**: Stylus with Autoprefixer
- **Build**: Gulp 4 with Babel 7
- **Frontend**: jQuery 3.7, p5.js, Hammer.js

## Recent Updates (March 2026)

### Security Improvements
- Added Helmet middleware for security headers
- HTTPS with Let's Encrypt SSL certificates
- HSTS header in nginx configuration
- Updated Express (4.13 → 4.22) and jQuery (2.1 → 3.7)
- Reduced npm vulnerabilities by 42%

### Build System Modernization
- Migrated Gulp 3 → Gulp 4 (rewrote gulpfile.js)
- Updated Babel 5 → Babel 7 with @babel/preset-env
- Replaced gulp-uglify with gulp-terser for modern JS minification
- Updated babelify, vinyl-source-stream, vinyl-buffer

## Deployment

### Service Management (AWS)

```bash
sudo systemctl start portfolio
sudo systemctl stop portfolio
sudo systemctl restart portfolio
sudo systemctl status portfolio
```

The systemd service runs `npm install`, `gulp`, and `npm start` automatically.

### Nginx

The site uses nginx as a reverse proxy with:
- HTTPS redirect (HTTP → HTTPS)
- Let's Encrypt SSL certificates
- Static asset proxying

Configuration: `/etc/nginx/sites-available/design.alexnortn.com`
