import type { VercelRequest, VercelResponse } from '@vercel/node';
import { aggregatorService } from '../backend/services/aggregatorService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cursor = (req.query.cursor as string) || '0';
    const limit = parseInt(req.query.limit as string) || 25;
    
    const response = await aggregatorService.getPaginatedTokens(cursor, limit);
    return res.status(200).json(response);
  } catch (error) {
    console.error('[API] Error fetching tokens:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch tokens from cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
