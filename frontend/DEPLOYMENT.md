# Frontend Deployment Guide - Vercel

This guide walks you through deploying the Online Music Player frontend to Vercel.

## Prerequisites

- GitHub repository with your code
- Vercel account (sign up at https://vercel.com)
- Backend API deployed and accessible (e.g., on Render)
- Firebase project configured

## Step 1: Create Vercel Project from GitHub

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository containing your music player code
5. Vercel will automatically detect it's a Next.js project

## Step 2: Configure Build Settings

Vercel should auto-detect the following settings (verify they match):

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Step 3: Configure Environment Variables

Add the following environment variables in the Vercel dashboard:

### Backend API Configuration

```
NEXT_PUBLIC_API_URL=https://your-backend-api.onrender.com
```

Replace with your actual backend API URL from Render.

### Firebase Configuration

Add these environment variables with your Firebase project credentials:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDBMy5rcZkk3Qgm55PKWy6FX90OUd--KOs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=music-player-779ed.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=music-player-779ed
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=music-player-779ed.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=852972919513
NEXT_PUBLIC_FIREBASE_APP_ID=1:852972919513:web:136f9e3261b6f6cf60fcc8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-EEJT1HKRBB
```

**Note**: These values are from your `firebase-config.json` file. In production, you should use environment variables instead of committing the config file.

### How to Add Environment Variables in Vercel:

1. In your Vercel project dashboard, go to "Settings"
2. Click on "Environment Variables" in the left sidebar
3. Add each variable:
   - Enter the variable name (e.g., `NEXT_PUBLIC_API_URL`)
   - Enter the value
   - Select which environments to apply it to (Production, Preview, Development)
4. Click "Save"

## Step 4: Enable Auto-Deploy from Main Branch

Vercel automatically enables auto-deploy by default:

1. Go to your project settings
2. Navigate to "Git" section
3. Verify that "Production Branch" is set to `main` (or your default branch)
4. Ensure "Automatic Deployments" is enabled

Every push to the main branch will trigger a new deployment automatically.

## Step 5: Deploy and Verify

### Initial Deployment

1. Click "Deploy" in the Vercel dashboard
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Run the build command
   - Deploy to production

### Verify Production Build

1. Once deployment completes, click on the deployment URL
2. Test the following functionality:
   - Homepage loads correctly
   - User authentication (sign up/login)
   - Music player interface renders
   - API calls to backend work (check browser console for errors)
   - Firebase authentication works

### Check Deployment Logs

If there are issues:

1. Go to the "Deployments" tab in Vercel
2. Click on the failed deployment
3. Review build logs for errors
4. Common issues:
   - Missing environment variables
   - Build errors (TypeScript, ESLint)
   - API connection issues (CORS, wrong URL)

## Step 6: Configure Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS
4. Vercel will automatically provision SSL certificate

## Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Environment variables are set correctly
- [ ] Firebase authentication works
- [ ] API calls to backend succeed
- [ ] CORS is configured on backend to allow frontend domain
- [ ] All pages and routes work correctly
- [ ] Production build is optimized (check Lighthouse scores)

## Continuous Deployment

Once configured, your deployment workflow is:

1. Make changes to your code
2. Commit and push to GitHub
3. Vercel automatically detects the push
4. Vercel builds and deploys the new version
5. Deployment URL is updated

## Monitoring and Logs

- **Analytics**: Vercel provides built-in analytics in the dashboard
- **Logs**: View real-time logs in the "Deployments" section
- **Performance**: Check Web Vitals and performance metrics

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

### Environment Variables Not Working

- Ensure variable names start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables
- Check that variables are set for the correct environment (Production/Preview)

### API Connection Issues

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS configuration allows your Vercel domain
- Test API endpoint directly in browser

### Firebase Authentication Issues

- Verify all Firebase environment variables are set
- Check Firebase console for authorized domains
- Add your Vercel domain to Firebase authorized domains

## Rollback

If a deployment has issues:

1. Go to "Deployments" tab
2. Find a previous working deployment
3. Click "..." menu → "Promote to Production"

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
