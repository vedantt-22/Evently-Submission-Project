import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listEvents, getEvent, createEvent, updateEvent, cancelEvent,
  addTier, updateTier, removeTier,
} from '../controllers/eventController';

const router = Router();

// All event routes require authentication
router.use(authenticate);

// Events CRUD
router.get('/', listEvents);
router.get('/:id', getEvent);

router.post('/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('venueName').trim().notEmpty().withMessage('Venue name is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    body('status').optional().isIn(['draft', 'published', 'cancelled']),
  ],
  validate,
  createEvent
);

router.put('/:id',
  [
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('status').optional().isIn(['draft', 'published', 'cancelled']),
  ],
  validate,
  updateEvent
);

router.delete('/:id', cancelEvent);

// Ticket Tiers
router.post('/:id/tiers',
  [
    body('name').trim().notEmpty().withMessage('Tier name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('totalCapacity').isInt({ min: 1 }).withMessage('Total capacity must be at least 1'),
  ],
  validate,
  addTier
);

router.put('/:id/tiers/:tierId',
  [
    body('price').optional().isFloat({ min: 0 }),
    body('totalCapacity').optional().isInt({ min: 1 }),
  ],
  validate,
  updateTier
);

router.delete('/:id/tiers/:tierId', removeTier);

export default router;
