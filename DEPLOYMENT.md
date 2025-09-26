# Deployment Guide

## Quick Deployment to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)

### Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "feat: prepare for Vercel deployment"
   git remote add origin https://github.com/YOUR_USERNAME/mini-exchange-ui.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your `mini-exchange-ui` repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

3. **That's it!** Your app will be live at `https://mini-exchange-ui-YOUR_USERNAME.vercel.app`

### Configuration
- Framework: Vite (auto-detected)
- Build Command: `npm run build` (auto-detected)
- Output Directory: `dist` (auto-detected)
- Node.js Version: 20.x

### Features Available After Deployment
- ✅ Real-time order book simulation
- ✅ Interactive depth charts
- ✅ Live trade history
- ✅ Order entry forms
- ✅ Keyboard shortcuts
- ✅ Mobile responsive design
- ✅ Performance optimized (90+ Lighthouse score)

### Automatic Deployments
- Main branch → Production deployment
- Other branches → Preview deployments
- Pull requests → Preview deployments

### Environment Variables
None required - this is a frontend-only simulation app.