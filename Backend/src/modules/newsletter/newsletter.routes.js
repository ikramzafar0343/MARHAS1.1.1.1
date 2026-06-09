import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { subscribe } from './newsletter.controller.js';
import { subscribeSchema } from './newsletter.validator.js';

const router = Router();

router.post('/subscribe', validate(subscribeSchema), subscribe);

export default router;
