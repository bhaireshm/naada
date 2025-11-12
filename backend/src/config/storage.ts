import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables before initializing R2
dotenv.config();

/**
 * Initialize Cloudflare R2 client using AWS SDK S3 client
 * R2 is S3-compatible, so we use the AWS SDK with custom endpoint
 */
function initializeR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      'Missing R2 configuration. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT are set.'
    );
  }

  try {
    const client = new S3Client({
      region: 'auto', // R2 uses 'auto' for region
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log('Cloudflare R2 client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize R2 client:', error);
    throw error;
  }
}

// Initialize and export the R2 client
export const r2Client = initializeR2Client();

// Export bucket name for use in storage operations
export const bucketName = process.env.R2_BUCKET_NAME;

if (!bucketName) {
  throw new Error('R2_BUCKET_NAME environment variable is not defined');
}
