import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { searchService, SearchFilter } from '../services/searchService';

/**
 * Handle search requests
 * GET /search?q=query&filter=songs&limit=20&offset=0
 */
export async function search(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { q: query, filter = 'all', limit = '5', offset = '0' } = req.query;

    // Validate query parameter
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_QUERY',
          message: 'Search query is required',
        },
      });
      return;
    }

    // Validate query length
    if (query.length > 100) {
      res.status(400).json({
        error: {
          code: 'QUERY_TOO_LONG',
          message: 'Search query must be 100 characters or less',
        },
      });
      return;
    }

    // Validate filter parameter
    const validFilters: SearchFilter[] = ['all', 'songs', 'artists', 'albums', 'playlists'];
    if (typeof filter !== 'string' || !validFilters.includes(filter as SearchFilter)) {
      res.status(400).json({
        error: {
          code: 'INVALID_FILTER',
          message: 'Filter must be one of: all, songs, artists, albums, playlists',
        },
      });
      return;
    }

    // Parse and validate limit and offset
    const parsedLimit = parseInt(limit as string, 10);
    const parsedOffset = parseInt(offset as string, 10);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      res.status(400).json({
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be a number between 1 and 100',
        },
      });
      return;
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      res.status(400).json({
        error: {
          code: 'INVALID_OFFSET',
          message: 'Offset must be a non-negative number',
        },
      });
      return;
    }

    // Perform search
    const results = await searchService.search(
      query.trim(),
      req.userId!,
      filter as SearchFilter,
      parsedLimit,
      parsedOffset
    );

    res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      error: {
        code: 'SEARCH_FAILED',
        message: 'Failed to perform search',
        details: errorMessage,
      },
    });
  }
}
