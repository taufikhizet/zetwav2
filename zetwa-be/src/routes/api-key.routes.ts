import { Router, type Response, type NextFunction } from 'express';
import type { Request, ParamsDictionary } from 'express-serve-static-core';
import { apiKeyService, API_KEY_SCOPES, SCOPE_DESCRIPTIONS, SCOPE_CATEGORIES } from '../services/api-key/index.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createApiKeySchema, updateApiKeySchema, updateApiKeyScopesSchema } from '../schemas/index.js';

interface KeyParams extends ParamsDictionary {
  keyId: string;
}

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @route GET /api/api-keys
 * @desc Get all API keys for current user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeys = await apiKeyService.list(req.userId!);

    res.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/api-keys/scopes
 * @desc Get all available API key scopes
 */
router.get('/scopes', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      scopes: API_KEY_SCOPES,
      descriptions: SCOPE_DESCRIPTIONS,
      categories: SCOPE_CATEGORIES,
    },
  });
});

/**
 * @route GET /api/api-keys/stats
 * @desc Get API key statistics for current user
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await apiKeyService.getStats(req.userId!);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/api-keys
 * @desc Create a new API key
 */
router.post(
  '/',
  validateBody(createApiKeySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description, scopes, expiresAt } = req.body;

      const apiKey = await apiKeyService.create(req.userId!, {
        name,
        description,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'API key created. Save the key now, it will not be shown again.',
        data: apiKey,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/api-keys/:keyId
 * @desc Get API key by ID
 */
router.get('/:keyId', async (req: Request<KeyParams>, res: Response, next: NextFunction) => {
  try {
    const apiKey = await apiKeyService.getById(req.userId!, req.params.keyId);

    res.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PATCH /api/api-keys/:keyId
 * @desc Update API key
 */
router.patch(
  '/:keyId',
  validateBody(updateApiKeySchema),
  async (req: Request<KeyParams>, res: Response, next: NextFunction) => {
    try {
      const apiKey = await apiKeyService.update(req.userId!, req.params.keyId, req.body);

      res.json({
        success: true,
        message: 'API key updated',
        data: apiKey,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/api-keys/:keyId/scopes
 * @desc Update API key scopes
 */
router.patch(
  '/:keyId/scopes',
  validateBody(updateApiKeyScopesSchema),
  async (req: Request<KeyParams>, res: Response, next: NextFunction) => {
    try {
      const { scopes } = req.body;
      const apiKey = await apiKeyService.updateScopes(req.userId!, req.params.keyId, scopes);

      res.json({
        success: true,
        message: 'API key scopes updated',
        data: apiKey,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route DELETE /api/api-keys/:keyId
 * @desc Delete API key
 */
router.delete('/:keyId', async (req: Request<KeyParams>, res: Response, next: NextFunction) => {
  try {
    await apiKeyService.delete(req.userId!, req.params.keyId);

    res.json({
      success: true,
      message: 'API key deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/api-keys/:keyId/regenerate
 * @desc Regenerate API key
 */
router.post('/:keyId/regenerate', async (req: Request<KeyParams>, res: Response, next: NextFunction) => {
  try {
    const apiKey = await apiKeyService.regenerate(req.userId!, req.params.keyId);

    res.json({
      success: true,
      message: 'API key regenerated. Save the new key now, it will not be shown again.',
      data: apiKey,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/api-keys/revoke-all
 * @desc Revoke all API keys for current user
 */
router.post('/revoke-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await apiKeyService.revokeAll(req.userId!);

    res.json({
      success: true,
      message: `${result.revokedCount} API key(s) revoked`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
