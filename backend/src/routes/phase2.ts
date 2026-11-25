import { Router, Response } from 'express';
import axios from 'axios';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const RESEARCH_ENGINE_URL = process.env.RESEARCH_ENGINE_URL || 'http://localhost:8000';
router.use(authenticate);

router.all('*', async (req: AuthRequest, res: Response, next) => {
  try {
    const suffix = req.originalUrl.replace(/^\/api\/research/, '');
    const response = await axios.request({
      method: req.method,
      url: `${RESEARCH_ENGINE_URL}/api${suffix}`,
      data: req.body,
      params: req.query,
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
      return;
    }
    next(error);
  }
});

export default router;
