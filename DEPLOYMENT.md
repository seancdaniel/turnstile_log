# DigitalOcean Deployment Guide

This guide will walk you through deploying the Passholder Tracker app to DigitalOcean.

## Prerequisites

1. A DigitalOcean account ([sign up here](https://www.digitalocean.com))
2. A GitHub account
3. Git installed on your local machine

## Option 1: DigitalOcean App Platform (Recommended - Easiest)

This is the simplest method and handles everything automatically.

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository**:
   - Go to GitHub and create a new repository
   - Don't initialize it with README, .gitignore, or license

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/passholder-tracker.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy via App Platform

1. **Go to DigitalOcean App Platform**:
   - Log into DigitalOcean
   - Click "Create" → "Apps"
   - Select "GitHub" as your source

2. **Connect GitHub**:
   - Authorize DigitalOcean to access your GitHub
   - Select your `passholder-tracker` repository
   - Choose the `main` branch

3. **Configure the App**:
   - **App Type**: Static Site
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **HTTP Port**: Leave default (or 8080)
   - **Index Document**: `index.html`
   - **Error Document**: `index.html` (for React Router compatibility)

4. **Review and Deploy**:
   - Review your configuration
   - Click "Create Resources"
   - Wait for deployment (usually 2-5 minutes)

5. **Access Your App**:
   - Once deployed, you'll get a URL like `https://your-app-name.ondigitalocean.app`
   - You can add a custom domain later in the app settings

### Step 3: Update app.yaml (Optional)

If you want to use the `app.yaml` file for configuration:
1. Update `.do/app.yaml` with your GitHub username
2. Commit and push the changes
3. DigitalOcean will automatically detect and use it

## Option 2: Static Site on Spaces + CDN

For a more cost-effective static hosting option:

### Step 1: Build Your App

```bash
npm run build
```

This creates a `dist` folder with your production build.

### Step 2: Create a DigitalOcean Space

1. Go to DigitalOcean → Spaces
2. Create a new Space
3. Enable CDN
4. Set it to "Public" or "Restricted" (public for static sites)

### Step 3: Upload Your Build

1. Install the DigitalOcean CLI (`doctl`) or use the web interface
2. Upload the contents of the `dist` folder to your Space
3. Set `index.html` as the index document

### Step 4: Configure Custom Domain (Optional)

1. Add your custom domain in Space settings
2. Update DNS records as instructed

## Option 3: Droplet with Nginx (More Control)

For full server control:

### Step 1: Create a Droplet

1. Create a new Droplet (Ubuntu 22.04 recommended)
2. Choose size (Basic $4/month is fine for small apps)
3. Add SSH keys for secure access

### Step 2: Set Up the Server

SSH into your droplet and run:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 3: Deploy Your App

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/passholder-tracker.git
cd passholder-tracker

# Install dependencies
npm install

# Build the app
npm run build

# Serve with PM2
pm2 serve dist 8080 --spa --name passholder-tracker
pm2 startup
pm2 save
```

### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/passholder-tracker`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/passholder-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Set Up SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Post-Deployment Checklist

- [ ] Test all functionality on the live site
- [ ] Set up a custom domain (if desired)
- [ ] Configure environment variables (if needed)
- [ ] Set up monitoring/analytics
- [ ] Enable HTTPS/SSL
- [ ] Set up automated backups (if using database)
- [ ] Configure error tracking (e.g., Sentry)

## Environment Variables

If you need to add environment variables later (for API keys, etc.):

1. **App Platform**: Add them in the app settings → Environment Variables
2. **Droplet**: Create a `.env` file or use system environment variables

## Updating Your App

### App Platform:
- Just push to GitHub, and it auto-deploys!

### Spaces:
- Rebuild: `npm run build`
- Re-upload the `dist` folder

### Droplet:
```bash
cd passholder-tracker
git pull
npm install
npm run build
pm2 restart passholder-tracker
```

## Cost Estimates

- **App Platform**: ~$5-12/month (basic plan)
- **Spaces + CDN**: ~$5/month (250GB storage + 1TB transfer)
- **Droplet**: ~$4-6/month (basic droplet)

## Need Help?

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Community Tutorials](https://www.digitalocean.com/community/tags/app-platform)

