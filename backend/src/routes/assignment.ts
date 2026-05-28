import { Router } from 'express';
import multer from 'multer';
import {
  createAssignment,
  getAssignment,
  getAssignmentResult,
  getAssignmentsByTeacher,
  deleteAssignment,
} from '../controllers/assignmentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authMiddleware);

router.post('/', upload.single('sourceFile'), createAssignment);
router.get('/myassignments', getAssignmentsByTeacher);
router.get("/:id/result", getAssignmentResult);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);

export default router;