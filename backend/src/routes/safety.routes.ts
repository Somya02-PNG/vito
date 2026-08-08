import { Router } from 'express';
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  triggerSOS,
  generateShareableLink,
} from '../controllers/safety.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protected safety routes
router.get('/safety/contacts', protect, getContacts);
router.post('/safety/contacts', protect, addContact);
router.put('/safety/contacts/:id', protect, updateContact);
router.delete('/safety/contacts/:id', protect, deleteContact);

router.post('/safety/sos', protect, triggerSOS);
router.post('/safety/share-link', protect, generateShareableLink);

export default router;
