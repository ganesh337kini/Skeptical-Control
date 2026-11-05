import { Router, Response } from 'express';
import { EnvironmentModel, CreateEnvironmentInput } from '../models/Environment';
import { authenticate, AuthRequest } from '../middleware/auth';
import { ProjectModel } from '../models/Project';
import axios from 'axios';

const router = Router();

const RESEARCH_ENGINE_URL = process.env.RESEARCH_ENGINE_URL || 'http://localhost:8000';

router.use(authenticate);

router.post('/:projectId/start', async (req: AuthRequest, res: Response, next) => {
  try {
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.user_id !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Call research engine to start environment
    const response = await axios.post(`${RESEARCH_ENGINE_URL}/api/environments/start`, {
      project_id: req.params.projectId,
      upload_path: project.upload_path
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const input: CreateEnvironmentInput = {
      project_id: req.params.projectId,
      workspace_path: response.data.workspace_path,
      docker_compose_project: response.data.docker_compose_project,
      resource_limits: response.data.resource_limits
    };

    const environment = await EnvironmentModel.create(input);
    let started = await EnvironmentModel.start(environment.id);
    if (response.data.container_ids) {
      started = await EnvironmentModel.updateContainerIds(environment.id, response.data.container_ids);
    }

    res.status(201).json({ environment: started });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId/status', async (req: AuthRequest, res: Response, next) => {
  try {
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.user_id !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const environments = await EnvironmentModel.findByProjectId(req.params.projectId);
    const latest = environments[0];

    if (!latest) {
      res.json({ status: 'not_created' });
      return;
    }

    // Get live status from research engine
    try {
      const response = await axios.get(`${RESEARCH_ENGINE_URL}/api/environments/${latest.docker_compose_project || latest.id}/status`);
      res.json({ environment: latest, liveStatus: response.data });
    } catch (error) {
      res.json({ environment: latest, liveStatus: null });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/:projectId/stop', async (req: AuthRequest, res: Response, next) => {
  try {
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.user_id !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const environments = await EnvironmentModel.findByProjectId(req.params.projectId);
    const latest = environments[0];

    if (!latest) {
      res.status(404).json({ error: 'No environment found' });
      return;
    }

    // Call research engine to stop environment
    await axios.post(`${RESEARCH_ENGINE_URL}/api/environments/${latest.docker_compose_project || latest.id}/stop`);

    const stopped = await EnvironmentModel.stop(latest.id);
    res.json({ environment: stopped });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId/logs', async (req: AuthRequest, res: Response, next) => {
  try {
    const project = await ProjectModel.findById(req.params.projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (project.user_id !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const environments = await EnvironmentModel.findByProjectId(req.params.projectId);
    const latest = environments[0];

    if (!latest) {
      res.status(404).json({ error: 'No environment found' });
      return;
    }

    const response = await axios.get(`${RESEARCH_ENGINE_URL}/api/environments/${latest.docker_compose_project || latest.id}/logs`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
