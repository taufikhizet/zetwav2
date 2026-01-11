import { Router, type Request, type Response, type NextFunction } from 'express';
import { apiKeyService } from '../services/api-key.service.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createApiKeySchema, updateApiKeySchema } from '../schemas/index.js';

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
 * @route POST /api/api-keys
 * @desc Create a new API key
 */
router.post(
  '/',
  validateBody(createApiKeySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, permissions, expiresAt } = req.body;

      const apiKey = await apiKeyService.create(req.userId!, {
        name,
        permissions,
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
router.get('/:keyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = await apiKeyService.getById(req.userId!, req.params.keyId!);

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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const apiKey = await apiKeyService.update(req.userId!, req.params.keyId!, req.body);

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
 * @route DELETE /api/api-keys/:keyId
 * @desc Delete API key
 */
router.delete('/:keyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await apiKeyService.delete(req.userId!, req.params.keyId!);

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
router.post('/:keyId/regenerate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = await apiKeyService.regenerate(req.userId!, req.params.keyId!);

    res.json({
      success: true,
      message: 'API key regenerated. Save the new key now, it will not be shown again.',
      data: apiKey,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
