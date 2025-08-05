# 🚀 Vercel Deployment Guide

## Prerequisites
1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com) (free tier available)

## 📋 Deployment Steps

### Step 1: Prepare Your Repository
1. **Commit all changes** to your local repository:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   ```
   (Replace `main` with your branch name if different)

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Choose your project settings
   - Vercel will automatically detect the configuration

#### Option B: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. **Import your GitHub repository**
4. Vercel will auto-detect the settings from `vercel.json`
5. Click **"Deploy"**

### Step 3: Configure Domain (Optional)
- Vercel provides a free `.vercel.app` domain
- You can add a custom domain in the project settings

## 🔧 Project Configuration

The following files have been created for deployment:

### `vercel.json`
- Routes all requests to the correct files
- Handles static file serving
- Sets up caching for model files

### `package.json`
- Project metadata for Vercel
- Deployment scripts

### `.vercelignore`
- Excludes Python files and training data
- Reduces deployment size

### Root `index.html`
- Redirects visitors to the main app

## 🌐 Expected URLs

After deployment, your app will be available at:
- **Main Dashboard**: `https://your-app.vercel.app/`
- **Historical Analysis**: `https://your-app.vercel.app/predictor.html`
- **Real-Time Predictions**: `https://your-app.vercel.app/realtime.html`

## 🔍 Troubleshooting

### Common Issues:

1. **Model Loading Errors**
   - Check that `tfjs_model/` directory is included in deployment
   - Verify CORS headers are set correctly

2. **404 Errors**
   - Ensure all file paths in `vercel.json` are correct
   - Check that files exist in the expected locations

3. **API Rate Limits**
   - The Twelve Data API has rate limits
   - Consider upgrading for production use

### Debugging:
- Check Vercel deployment logs in the dashboard
- Use browser developer tools to check network requests
- Verify all assets are loading correctly

## 📊 Performance Tips

1. **Model Caching**: The TensorFlow.js model files are cached for 1 year
2. **API Efficiency**: Real-time predictions use efficient API calls
3. **Static Assets**: All CSS/JS files are served from Vercel's CDN

## 🔒 Security Notes

- **API Keys**: Users enter their own Twelve Data API keys
- **Client-Side**: All processing happens in the browser
- **No Server**: Pure static deployment, no backend required

## 🎯 Next Steps

After successful deployment:
1. Test all three pages (Dashboard, Historical, Real-Time)
2. Verify model loading works correctly
3. Test real-time predictions with API key
4. Share your live URL!

---

**Need Help?** Check the Vercel documentation or create an issue in your repository.