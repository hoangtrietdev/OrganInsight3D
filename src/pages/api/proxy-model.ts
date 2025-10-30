import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API Route: Proxy Google Drive downloads
 * 
 * This route proxies Google Drive file downloads to handle:
 * - Large files (>100MB)
 * - CORS issues
 * - Virus scan warnings
 * - Authentication bypassing
 * 
 * Usage: /api/proxy-model?fileId=YOUR_FILE_ID
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { fileId } = req.query;

  if (!fileId || typeof fileId !== 'string') {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    // Try multiple Google Drive URL formats for large files
    const urls = [
      // Method 1: Use Google Drive API export (works for files <100MB)
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      // Method 2: Direct download with confirmation (may work for some large files)
      `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
      // Method 3: Try the usercontent domain
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    ];

    let response: Response | null = null;
    let lastError: Error | null = null;

    // Try each URL until one works
    for (const url of urls) {
      try {
        console.log(`[Proxy] Attempting to fetch from: ${url.substring(0, 80)}...`);
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
          },
          redirect: 'follow',
        });

        // Check if we got an HTML page (virus scan warning) instead of the file
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/html')) {
          console.warn(`[Proxy] Got HTML response (virus scan?), trying next URL...`);
          lastError = new Error('Virus scan page returned');
          continue;
        }

        if (response.ok) {
          console.log(`[Proxy] ✅ Success with URL`);
          break;
        } else {
          console.warn(`[Proxy] ❌ Failed with status ${response.status}`);
          lastError = new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn(`[Proxy] ❌ Error fetching:`, error);
        lastError = error as Error;
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error('[Proxy] All download methods failed');
      throw lastError || new Error('All download URLs failed. File may be too large or not publicly shared.');
    }

    // Get content length if available
    const contentLength = response.headers.get('content-length');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'model/gltf-binary');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Stream the response instead of loading into memory
    // This prevents memory issues with large files
    if (response.body) {
      const reader = response.body.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            res.end();
            break;
          }
          
          // Write chunk to response
          res.write(Buffer.from(value));
        }
      } catch (streamError) {
        console.error('Error streaming file:', streamError);
        reader.releaseLock();
        throw streamError;
      }
    } else {
      // Fallback to buffer method for smaller files
      const buffer = await response.arrayBuffer();
      res.status(200).send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error('Error proxying Google Drive file:', error);
    res.status(500).json({ 
      error: 'Failed to fetch model from Google Drive',
      details: error instanceof Error ? error.message : 'Unknown error',
      fileId,
    });
  }
}

// Configure API route for large file streaming
export const config = {
  api: {
    responseLimit: false, // Disable limit for streaming
    bodyParser: false, // Disable body parsing for streaming
    externalResolver: true, // Mark as external to avoid timeouts
  },
};
