import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBooking, getUserBookings, cancelBooking } from '../controllers/bookingController';

const router = Router();

router.use(authenticate);

router.get('/', getUserBookings);

router.post('/',
  [
    body('eventId').isInt({ min: 1 }).withMessage('Valid eventId is required'),
    body('tierId').isInt({ min: 1 }).withMessage('Valid tierId is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validate,
  createBooking
);

router.delete('/:id', cancelBooking);

export default router;
