// File: api/rss-proxy.js
// A simple Vercel serverless function to fetch RSS feeds

export default async function handler(req, res) {
  // Dynamically import fetch (fixes ESM issue)
  const { default: fetch } = await import('node-fetch');
  
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the URL from the query parameter
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate the URL
    const validUrl = new URL(url);
    
    // Make sure it's an HTTP/HTTPS URL
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS URLs are supported' });
    }

    console.log('Fetching RSS feed from:', url);

    // Fetch the RSS feed
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Podcast-to-MusicBrainz-Importer/1.0'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch RSS feed:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: `Failed to fetch RSS feed: ${response.statusText}` 
      });
    }

    // Get the response as text
    const xmlData = await response.text();
    
    console.log('Successfully fetched RSS feed, size:', xmlData.length);
    
    // Set content type to XML
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(xmlData);
    
  } catch (error) {
    console.error('Error fetching RSS feed:', error.message);
    // Return JSON error response
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ 
      error: 'Failed to fetch RSS feed',
      details: error.message
    });
  }
}
