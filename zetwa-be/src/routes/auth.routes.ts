import { Router, type Request, type Response, type NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rate-limit.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../schemas/index.js';

const router = Router();

/**
 * @route POST /api/auth/verify-email
 */
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.verifyEmail(req.body.token);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/resend-verification
 */
router.post('/resend-verification', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resendVerification(req.userId!);
    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/social
 */
router.post('/social', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.socialLogin(req.body.provider, req.body.token);
    res.json({ success: true, message: 'Login successful', data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/onboarding
 */
router.post('/onboarding', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.completeOnboarding(req.userId!, req.body);
    res.json({ success: true, message: 'Onboarding completed' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/forgot-password
 */
router.post('/forgot-password', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/reset-password
 */
router.post('/reset-password', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 */
router.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refreshTokens(req.body.refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (revoke refresh token)
 */
router.post(
  '/logout',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/logout-all
 * @desc Logout from all devices
 */
router.post(
  '/logout-all',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logoutAll(req.userId!);

      res.json({
        success: true,
        message: 'Logged out from all devices',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 */
router.get(
  '/profile',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await authService.getProfile(req.userId!);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route PATCH /api/auth/profile
 * @desc Update user profile
 */
router.patch(
  '/profile',
  authenticate,
  validateBody(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await authService.updateProfile(req.userId!, req.body);

      res.json({
        success: true,
        message: 'Profile updated',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(
        req.userId!,
        req.body.currentPassword,
        req.body.newPassword
      );

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
