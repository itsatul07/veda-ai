import 'dotenv/config';
import { Queue, Worker } from 'bullmq';
import redis from '../config/redis';
import { generateQuestions } from './generator';
import Assignment from '../models/Assignment';
import { updateAssignmentResult } from '../controllers/assignmentController';

const assignmentQueue = new Queue('assignment-generation', {
  connection: redis,
});

export const addGenerationJob = async (assignmentId: string) => {
  await assignmentQueue.add('generate', { assignmentId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};

export const startWorker = (io: any) => {
  const worker = new Worker(
    'assignment-generation',
    async (job) => {
      const { assignmentId } = job.data;
      console.log(`Processing job for assignment: ${assignmentId}`);
      io.to(assignmentId).emit('job:progress', { status: 'processing', progress: 10 });

      try {
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error('Assignment not found');
        }

        io.to(assignmentId).emit('job:progress', { status: 'processing', progress: 30 });
        //console.log(`Fetched assignment: ${assignment}`);
        const result = await generateQuestions({
          questionTypes: assignment.questionTypes,
          numQuestions: assignment.numQuestions,
          marksPerQuestion: assignment.marksPerQuestion,
          additionalInstructions: assignment.additionalInstructions,
          extractedText: assignment.extractedText,
          fileType: assignment.fileType,
          questionConfig: assignment.questionConfig,
        });

        io.to(assignmentId).emit('job:progress', { status: 'processing', progress: 80 });

        await updateAssignmentResult(assignmentId, result);

        io.to(assignmentId).emit('job:progress', { status: 'completed', progress: 100, result });
        return result;
      } catch (error) {
        io.to(assignmentId).emit('job:error', { error: (error as Error).message });
        throw error;
      }
    },
    { connection: redis }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
};

export default assignmentQueue;