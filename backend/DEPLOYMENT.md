# Backend Deployment Guide - Render

This guide walks you through deploying the Online Music Player backend to Render.

## Prerequisites

1. A [Render](https://render.com) account
2. Your GitHub repository connected to Render
3. MongoDB Atlas database (or another MongoDB hosting service)
4. Cloudflare R2 bucket configured
5. Firebase project with service account credentials

## Deployment Steps

### 1. Create a New Web Service on Render

1. Log in to your Render dashboard
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository containing this backend code

### 2. Configure Build Settings

Render will automatically detect the `render.yaml` configuration file. Verify these settings:

- **Name**: `online-music-player-backend` (or your preferred name)
- **Region**: Choose the region closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` (if backend is in a subdirectory)
- **Environment**: `Node`
- **Build Command**: `pnpm install && pnpm run build`
- **Start Command**: `pnpm start`
- **Plan**: Free (or your preferred plan)

### 3. Configure Environment Variables

Add the following environment variables in the Render dashboard under "Environment":

#### Server Configuration
- `NODE_ENV`: `production`
- `PORT`: `3000` (Render will override this automatically)

#### MongoDB Configuration
- `MONGODB_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas)
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/online-music-player?retryWrites=true&w=majority`

#### Cloudflare R2 Configuration
- `R2_ACCOUNT_ID`: Your Cloudflare account ID
- `R2_ACCESS_KEY_ID`: Your R2 access key ID
- `R2_SECRET_ACCESS_KEY`: Your R2 secret access key
- `R2_BUCKET_NAME`: Your R2 bucket name
- `R2_ENDPOINT`: Your R2 endpoint URL
  - Example: `https://your-account-id.r2.cloudflarestorage.com`

#### Firebase Configuration
Firebase credentials are configured via the `firebase-config.json` file in the backend root directory. This file must be present in your repository or added as a secret file in Render.

**Option 1: Add firebase-config.json to repository (not recommended for public repos)**
- Ensure `firebase-config.json` is in the backend directory
- Make sure it's not in `.gitignore` if you want it deployed

**Option 2: Use Render Secret Files (recommended)**
- In Render dashboard, go to your service settings
- Navigate to "Secret Files"
- Add a new secret file with path: `firebase-config.json`
- Paste your Firebase service account JSON content

### 4. Enable Auto-Deploy

1. In your service settings, ensure "Auto-Deploy" is enabled
2. This will automatically deploy your backend when you push to the main branch

### 5. Verify Deployment

After deployment completes:

1. Check the deployment logs for any errors
2. Visit your service URL + `/health` endpoint
   - Example: `https://your-service.onrender.com/health`
   - You should see: `{"status":"ok","message":"Server is running"}`

### 6. Update Frontend Configuration

Once your backend is deployed, update your frontend environment variables:

- `VITE_API_URL`: Your Render service URL
  - Example: `https://your-service.onrender.com`

## Troubleshooting

### Build Failures

- **pnpm not found**: Render should automatically detect pnpm from `package.json`. If not, you can specify the Node version in `package.json`:
  ```json
  "engines": {
    "node": ">=18.0.0"
  }
  ```

### MongoDB Connection Issues

- Ensure your MongoDB Atlas cluster allows connections from all IP addresses (0.0.0.0/0) or add Render's IP addresses to the allowlist
- Verify your connection string is correct and includes the database name

### Firebase Authentication Errors

- Ensure `firebase-config.json` is present and properly formatted
- Verify the service account has the necessary permissions in Firebase Console
- If using Render Secret Files, confirm the file path is exactly `firebase-config.json`

### R2 Storage Issues

- Verify your R2 credentials are correct
- Ensure your R2 bucket has the appropriate CORS settings configured

## Health Check

The backend includes a health check endpoint at `/health` that Render uses to monitor service health:

```bash
curl https://your-service.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Monitoring

- View logs in the Render dashboard under "Logs"
- Monitor service metrics under "Metrics"
- Set up alerts for service downtime or errors

## Scaling

To handle more traffic:

1. Upgrade your Render plan for more resources
2. Consider using Render's autoscaling features
3. Optimize database queries and add indexes
4. Implement caching strategies

## Security Best Practices

- Never commit `.env` files or `firebase-config.json` to version control
- Rotate credentials regularly
- Use Render's secret management for sensitive values
- Enable HTTPS (Render provides this automatically)
- Keep dependencies updated

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
