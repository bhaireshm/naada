import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { Song, ISong } from '../models/Song';

const execAsync = promisify(exec);

/**
 * Result of fingerprint generation including the method used
 */
export interface FingerprintResult {
  fingerprint: string;
  method: 'acoustic' | 'hash';
}

/**
 * Generate SHA-256 hash of file buffer as fallback fingerprint
 * @param fileBuffer - Audio file buffer
 * @returns Hash string prefixed with "HASH:"
 */
function generateFileHash(fileBuffer: Buffer): string {
  const hash = createHash('sha256').update(fileBuffer).digest('hex');
  return `HASH:${hash}`;
}

/**
 * Generate audio fingerprint using Chromaprint's fpcalc tool with fallback to file hash
 * @param fileBuffer - Audio file buffer
 * @returns FingerprintResult containing fingerprint and method used
 */
export async function generateFingerprint(fileBuffer: Buffer): Promise<FingerprintResult> {
  try {
    // Write buffer to temporary file for fpcalc processing
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`);

    // Write buffer to temp file
    fs.writeFileSync(tempFilePath, fileBuffer);

    try {
      // Try to find fpcalc in common locations
      const os = require('os');
      const path = require('path');

      // Common fpcalc locations on Windows
      const fpcalcPaths = [
        'fpcalc', // Check if it's in PATH
        path.join(os.homedir(), '.chromaprint', 'fpcalc.exe'),
        path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Chromaprint', 'fpcalc.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Chromaprint', 'fpcalc.exe'),
      ];

      let fpcalcCommand = 'fpcalc';

      // Try to find fpcalc executable
      for (const fpcalcPath of fpcalcPaths) {
        try {
          const fs = require('fs');
          if (fs.existsSync(fpcalcPath)) {
            fpcalcCommand = `"${fpcalcPath}"`;
            break;
          }
        } catch (e) {
          // Continue to next path
        }
      }

      // Execute fpcalc to generate fingerprint
      const { stdout, stderr } = await execAsync(`${fpcalcCommand} "${tempFilePath}"`);

      if (stderr) {
        console.error('fpcalc stderr:', stderr);
      }

      // Parse fpcalc output to extract fingerprint
      // Expected format:
      // DURATION=123
      // FINGERPRINT=AQADtNQ...
      const lines = stdout.split('\n');
      const fingerprintLine = lines.find(line => line.startsWith('FINGERPRINT='));

      if (!fingerprintLine) {
        throw new Error('Failed to extract fingerprint from fpcalc output');
      }

      const fingerprint = fingerprintLine.replace('FINGERPRINT=', '').trim();

      if (!fingerprint) {
        throw new Error('Extracted fingerprint is empty');
      }

      // Log info message when using acoustic fingerprint
      console.log('Fingerprint generated using acoustic method:', {
        method: 'acoustic',
        fingerprintLength: fingerprint.length,
      });

      return {
        fingerprint,
        method: 'acoustic'
      };
    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
  } catch (error) {
    // Fallback to file hash when fpcalc fails
    const reason = error instanceof Error ? error.message : 'Unknown error';

    // Log warning when falling back to file hash with reason
    console.warn('Fingerprint generation falling back to file hash:', {
      reason,
      method: 'hash',
      message: 'fpcalc acoustic fingerprinting failed or unavailable',
    });

    const hashFingerprint = generateFileHash(fileBuffer);
    return {
      fingerprint: hashFingerprint,
      method: 'hash'
    };
  }
}

/**
 * Check if a song with the given fingerprint already exists in the database
 * @param fingerprint - Audio fingerprint hash to check
 * @returns Existing song document if found, null otherwise
 */
export async function checkDuplicate(fingerprint: string): Promise<ISong | null> {
  try {
    const existingSong = await Song.findOne({ fingerprint }).exec();
    return existingSong;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Duplicate check failed: ${error.message}`);
    }
    throw new Error('Duplicate check failed: Unknown error');
  }
}
