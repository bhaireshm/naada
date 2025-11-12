import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, bucketName } from '../config/storage';
import { Readable } from 'stream';

/**
 * Upload a file to Cloudflare R2 storage
 * @param fileBuffer - File content as buffer
 * @param key - Unique key/path for the file in R2
 * @param mimeType - MIME type of the file (e.g., 'audio/mpeg')
 * @param metadata - Optional custom metadata to attach to the file
 * @returns The file key on success
 * @throws Error if upload fails
 */
export async function uploadFile(
  fileBuffer: Buffer,
  key: string,
  mimeType: string,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: metadata,
    });

    await r2Client.send(command);
    
    console.log(`File uploaded successfully to R2: ${key}`);
    if (metadata) {
      console.log('Custom metadata attached:', metadata);
    }
    return key;
  } catch (error) {
    if (error instanceof Error) {
      console.error('R2 upload error:', error.message);
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    throw new Error('Storage upload failed: Unknown error');
  }
}

/**
 * Retrieve a file from Cloudflare R2 storage
 * @param key - File key/path in R2
 * @param range - Optional range header for partial content (e.g., 'bytes=0-1023')
 * @returns Readable stream of the file content
 * @throws Error if retrieval fails
 */
export async function getFile(
  key: string,
  range?: string
): Promise<Readable> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      Range: range,
    });

    const response = await r2Client.send(command);
    
    if (!response.Body) {
      throw new Error('No file content returned from R2');
    }

    // Convert the response body to a readable stream
    const stream = response.Body as Readable;
    
    console.log(`File retrieved successfully from R2: ${key}`);
    return stream;
  } catch (error) {
    if (error instanceof Error) {
      console.error('R2 retrieval error:', error.message);
      throw new Error(`Storage retrieval failed: ${error.message}`);
    }
    throw new Error('Storage retrieval failed: Unknown error');
  }
}

/**
 * Check if a file exists in R2 storage
 * @param key - File key/path in R2
 * @returns true if file exists, false otherwise
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    // File doesn't exist or other error
    return false;
  }
}
