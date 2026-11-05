import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ProjectModel, CreateProjectInput } from '../models/Project';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip') {
      cb(new Error('Only ZIP files are allowed'));
      return;
    }
    cb(null, true);
  }
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const projects = await ProjectModel.findByUserId(req.userId!);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.user_id !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    const input: CreateProjectInput = {
      user_id: req.userId!,
      name,
      description,
      upload_path: req.file.path,
      file_size: req.file.size
    };

    const project = await ProjectModel.create(input);
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const project = await ProjectModel.findById(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.user_id !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await ProjectModel.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
