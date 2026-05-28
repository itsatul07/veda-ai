import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  type: 'MCQ' | 'ShortAnswer' | 'LongAnswer' | 'TrueFalse';
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
  options?: string[];
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswer {
  section: string;
  questionNumber: number;
  answer: string;
}

export interface IQuestionsResult {
  sections: ISection[];
  totalMarks: number;
  generatedAt: Date;
}

export interface IAssignment extends Document {
  title: string;
  description: string;
  dueDate: Date;
  teacherId: string;
  questionTypes: string[];
  numQuestions: number;
  marksPerQuestion: number;
  additionalInstructions: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'text';
  extractedText?: string;
  questionConfig?: Record<string, { count: number; marks: number }>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    result_questions: IQuestionsResult;
    result_answers: IAnswer[];
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'ShortAnswer', 'LongAnswer', 'TrueFalse'], required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
  options: [{ type: String }],
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
}, { _id: false });

const AnswerSchema = new Schema<IAnswer>({
  section: { type: String, required: true },
  questionNumber: { type: Number, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  teacherId: { type: String, required: true, index: true },
  questionTypes: [{ type: String }],
  numQuestions: { type: Number, required: true },
  marksPerQuestion: { type: Number, required: true },
  additionalInstructions: { type: String },
  fileUrl: { type: String },
  fileType: { type: String, enum: ['pdf', 'text'] },
  extractedText: { type: String },
  questionConfig: { type: Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  result: {
    result_questions: {
      sections: [SectionSchema],
      totalMarks: Number,
      generatedAt: Date
    },
    result_answers: [AnswerSchema]
  },
  error: { type: String }
}, { timestamps: true });

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);