import { Request, Response } from 'express';
import Assignment from '../models/Assignment';
import { addGenerationJob } from '../services/queue';
import { extractTextFromFile } from '../services/fileExtractor';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      dueDate,
      questionTypes,
      questionTypeConfig,
      additionalInstructions,
    } = req.body;

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Parse questionTypeConfig if provided (e.g., {"MCQ":{"count":10,"marks":5},"ShortAnswer":{"count":3,"marks":10}})
    let parsedConfig: Record<string, { count: number; marks: number }> | null = null;
    if (questionTypeConfig) {
      parsedConfig = typeof questionTypeConfig === 'string'
        ? JSON.parse(questionTypeConfig)
        : questionTypeConfig;
    }

    let extractedText = '';
    let fileType = '';

    if (req.file) {
      fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'text';
      extractedText = await extractTextFromFile(req.file.path, fileType as 'pdf' | 'text');

      // Clean up temp file after extraction
      fs.unlinkSync(req.file.path);
    }

    const questionTypesArray = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;

    // Calculate total questions and marks from config or use legacy fields
    let numQuestions = 0;
    let marksPerQuestion = 0;
    let questionConfig: Record<string, { count: number; marks: number }> = {};

    if (parsedConfig) {
      questionConfig = parsedConfig;
      Object.values(parsedConfig).forEach(q => {
        numQuestions += q.count;
        marksPerQuestion = Math.max(marksPerQuestion, q.marks);
      });
    } else {
      numQuestions = parseInt(req.body.numQuestions) || 0;
      marksPerQuestion = parseInt(req.body.marksPerQuestion) || 0;
    }

    const assignment = new Assignment({
      title,
      description,
      dueDate,
      teacherId: userId,
      questionTypes: questionTypesArray,
      numQuestions,
      marksPerQuestion,
      additionalInstructions,
      fileType: fileType || undefined,
      extractedText: extractedText || undefined,
      questionConfig: parsedConfig || undefined,
      status: 'pending',
    });

    await assignment.save();
    //console.log("extractedText", extractedText);
    await addGenerationJob(assignment._id.toString());

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const getAssignmentsByTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }
    const assignments = await Assignment.find({ teacherId: userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const updateAssignmentResult = async (id: string, result: any) => {
  await Assignment.findByIdAndUpdate(id, {
    status: 'completed',
    result,
  });
};

export const getAssignmentResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found',
      });
    }

    if (!assignment.result) {
      return res.status(404).json({
        success: false,
        error: 'Result not yet generated',
      });
    }

    res.json({
      success: true,
      data: assignment.result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const deleteAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const assignment = await Assignment.findOne({ _id: id, teacherId: userId });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found or not authorized',
      });
    }

    await Assignment.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};