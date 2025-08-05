# 🔧 Vercel Deployment Troubleshooting Guide

## Common Errors & Solutions

### 🚨 Most Likely Errors for Your Stock Predictor App

#### 1. **NOT_FOUND (404)** - "Page not found"
**Symptoms:** 
- Blank page or "404 - This page could not be found"
- Model files not loading

**Causes & Solutions:**
```bash
# Check if files exist in deployment
- Verify tfjs_model/ directory is deployed
- Check .vercelignore doesn't exclude needed files
- Ensure all paths in vercel.json are correct
```

**Quick Fix:**
1. Check Vercel dashboard → Project → Functions tab
2. Look for missing files in the build log
3. Update `.vercelignore` if needed

#### 2. **RESOURCE_NOT_FOUND (404)** - "TensorFlow.js model not found"
**Symptoms:**
- Console error: "Failed to load model"
- App loads but predictions don't work

**Solution:**
```javascript
// Check browser console for:
// "Error loading model from ../tfjs_model/model/model.json"
```

**Quick Fix:**
1. Verify `tfjs_model/` folder is in your repository
2. Check that `.vercelignore` doesn't exclude `tfjs_model/`
3. Redeploy if needed

#### 3. **ROUTER_CANNOT_MATCH (502)** - "Routing error"
**Symptoms:**
- Some pages work, others don't
- Inconsistent loading

**Solution:**
- Our updated `vercel.json` includes a catch-all route
- This should prevent routing errors

#### 4. **CORS Errors** - "Cross-origin request blocked"
**Symptoms:**
- Model loads but API calls fail
- Console errors about CORS

**Solution:**
- Our configuration includes CORS headers
- Twelve Data API should work fine
- No action needed

### 🔍 Debugging Steps

#### Step 1: Check Deployment Status
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Check the "Deployments" tab for errors

#### Step 2: Check Build Logs
1. Click on the failed deployment
2. Look for error messages in the build log
3. Common issues:
   - Missing files
   - Invalid JSON syntax
   - Path resolution errors

#### Step 3: Test Individual Components
Test each page individually:
- `https://your-app.vercel.app/` - Main dashboard
- `https://your-app.vercel.app/predictor.html` - Historical analysis
- `https://your-app.vercel.app/realtime.html` - Real-time predictions

#### Step 4: Check Browser Console
1. Open browser developer tools (F12)
2. Look for JavaScript errors
3. Check Network tab for failed requests

### 🛠️ Common Fixes

#### Fix 1: Model Loading Issues
If TensorFlow.js model doesn't load:

```javascript
// Check these URLs work:
https://your-app.vercel.app/tfjs_model/model/model.json
https://your-app.vercel.app/tfjs_model/scaler_info.json
```

#### Fix 2: JSON File Issues
If sample data doesn't load:

```javascript
// Check these URLs work:
https://your-app.vercel.app/sample_data.json
https://your-app.vercel.app/historical_predictions.json
```

#### Fix 3: CSS/JS Not Loading
If styling is broken:

```javascript
// Check these URLs work:
https://your-app.vercel.app/styles.css
https://your-app.vercel.app/app.js
https://your-app.vercel.app/realtime.js
```

### 🚀 Prevention Tips

#### 1. Test Locally First
```bash
# Before deploying, test locally:
cd web_app
python -m http.server 8000
# Visit http://localhost:8000
```

#### 2. Validate JSON Files
```bash
# Check JSON syntax:
python -m json.tool web_app/sample_data.json
python -m json.tool tfjs_model/scaler_info.json
```

#### 3. Check File Sizes
Vercel has limits:
- Free tier: 100MB per deployment
- Your model files should be well under this

#### 4. Monitor Deployment
- Watch the deployment process in Vercel dashboard
- Check for warnings or errors during build

### 📞 Getting Help

#### If You're Still Stuck:

1. **Check Vercel Status**: [status.vercel.com](https://status.vercel.com)
2. **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
3. **GitHub Issues**: Create an issue in your repository
4. **Vercel Support**: Contact support if using paid plan

#### Useful Information to Include:
- Error code (e.g., "NOT_FOUND", "ROUTER_CANNOT_MATCH")
- Deployment URL
- Browser console errors
- Steps to reproduce the issue

### 🎯 Success Indicators

Your deployment is successful when:
- ✅ All three pages load (Dashboard, Historical, Real-time)
- ✅ Charts and visualizations appear
- ✅ No console errors in browser
- ✅ Model loads (check browser network tab)
- ✅ Sample data displays correctly
- ✅ Real-time page accepts API keys

---

**Remember**: Most issues are simple file path or configuration problems that can be fixed quickly!