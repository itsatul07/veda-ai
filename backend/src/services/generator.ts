import 'dotenv/config';

const HF_API_KEY = process.env.HF_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface QuestionData {
  questionTypes: string[];
  numQuestions: number;
  marksPerQuestion: number;
  additionalInstructions: string;
  extractedText?: string;
  fileType?: 'pdf' | 'text';
  questionConfig?: Record<string, { count: number; marks: number }>;
}

export const generateQuestions = async (data: QuestionData) => {
  const {
    questionTypes,
    numQuestions,
    marksPerQuestion,
    additionalInstructions,
    extractedText,
    fileType,
    questionConfig,
  } = data;

  const questionTypeStr = questionTypes.join(', ');

  let sourceContent = '';
  if (extractedText && fileType) {
    sourceContent = `The following content was extracted from a ${fileType.toUpperCase()} file provided by the user:\n\n${extractedText}\n\n---\n\n`;
  }

  // Build config string if provided
  let configStr = '';
  let totalMarks = 0;
  if (questionConfig) {
    configStr = Object.entries(questionConfig)
      .map(([type, cfg]) => `${cfg.count} ${type} questions (${cfg.marks} marks each)`)
      .join(', ');
    totalMarks = Object.values(questionConfig).reduce((sum, cfg) => sum + cfg.count * cfg.marks, 0);
  } else {
    totalMarks = numQuestions * marksPerQuestion;
  }

  // Build section instructions based on config
  let sectionInstructions = '';
  if (questionConfig) {
    const sectionLetters = ['A', 'B', 'C', 'D', 'E'];
    const types = Object.keys(questionConfig);
    sectionInstructions = types.map((type, i) => {
      const cfg = questionConfig[type];
      return `Section ${sectionLetters[i]}: ${cfg.count} ${type} questions (${cfg.marks} marks each)`;
    }).join('\n');
  }

  const prompt = `${sourceContent}You are an expert question paper generator for educational assessments.

Using ONLY the content provided above (if any), generate a question paper with these specifications:
${questionConfig ? `- Question distribution:\n${sectionInstructions}` : `- Question types: ${questionTypeStr}\n- Number of questions: ${numQuestions}\n- Marks per question: ${marksPerQuestion}`}
- Total marks: ${totalMarks}
- Additional instructions: ${additionalInstructions || 'None'}

CRITICAL: You MUST generate CORRECT ANSWERS for ALL questions. This is mandatory.

STRUCTURE your question paper as follows:
${questionConfig ? `- Each question type goes in its own section\n- Section A = MCQ questions\n- Section B = Short Answer questions\n- etc.` : `- Organized sections (A, B, C, etc.) with 3-5 questions per section`}

For each question include:
- Question text (clear and unambiguous)
- Type (MCQ/Short Answer/Long Answer/True-False)
- Difficulty level (Easy/Moderate/Hard) - distribute evenly across questions
- For MCQ: exactly 4 options (A, B, C, D)

ANSWER REQUIREMENTS:
- MCQ: The correct option letter (A, B, C, or D) - e.g., "A" or "C"
- Short Answer: A brief correct answer (1-2 sentences) - e.g., "The mitochondria are the powerhouse of the cell."
- Long Answer: A detailed correct answer (2-3 sentences)
- True/False: Exactly "True" or "False"

Format your JSON response with TWO main sections:
{
  "result_questions": {
    "sections": [
      {
        "title": "Section A - MCQ",
        "instruction": "Answer all MCQ questions.",
        "questions": [
          {
            "text": "What is the capital of France?",
            "type": "MCQ",
            "difficulty": "Easy",
            "marks": 5,
            "options": ["London", "Paris", "Berlin", "Madrid"]
          }
        ]
      },
      {
        "title": "Section B - Short Answer",
        "instruction": "Answer all short answer questions briefly.",
        "questions": [
          {
            "text": "Explain the process of photosynthesis.",
            "type": "ShortAnswer",
            "difficulty": "Moderate",
            "marks": 10
          }
        ]
      }
    ],
    "totalMarks": ${totalMarks},
    "generatedAt": "${new Date().toISOString()}"
  },
  "result_answers": [
    { "section": "Section A - MCQ", "questionNumber": 1, "answer": "B" },
    { "section": "Section B - Short Answer", "questionNumber": 1, "answer": "Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen. It occurs in the chloroplasts and uses chlorophyll as a catalyst." }
  ]
}

The "result_answers" array MUST have an entry for EVERY question in the same order as they appear in result_questions.
DO NOT leave any question without an answer. All answers must be included in result_answers.

Return ONLY the JSON object, no additional text or explanation.`;

  try {
    const hasGroqKey = GROQ_API_KEY && GROQ_API_KEY.length > 0;
    const apiKey = hasGroqKey ? GROQ_API_KEY : HF_API_KEY;
    const isGroq = hasGroqKey;

    if (!apiKey) {
      throw new Error("No API key configured. Set GROQ_API_KEY or HF_API_KEY in .env");
    }

    let content = '';
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      const response = await fetch(
        isGroq
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isGroq
              ? {
                  model: "llama-3.1-8b-instant",
                  messages: [{ role: "user", content: prompt }],
                  temperature: 0.7,
                  max_tokens: 3000,
                }
              : {
                  inputs: prompt,
                  parameters: {
                    temperature: 0.7,
                    max_new_tokens: 3000,
                    return_full_text: false,
                  },
                }
          ),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error response:", errorText.substring(0, 500));

        // Check for rate limit
        const errorJson = JSON.parse(errorText);
        if (response.status === 429 && errorJson?.error?.type === 'tokens') {
          const retryAfter = errorJson.error.retryAfter || 7;
          console.log(`Rate limit hit, waiting ${retryAfter}s before retry... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          retryCount++;
          continue;
        }

        throw new Error(`API error: ${response.status} - ${errorText.substring(0, 200)}`);
      }

      if (isGroq) {
        const result = await response.json() as GroqResponse;
        content = result.choices?.[0]?.message?.content || "";
      } else {
        content = await response.text();
        console.log("Raw response:", content.substring(0, 500));
      }
      break;
    }

    if (!content) {
      throw new Error("Failed to get response from AI after retries");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const finalResult = JSON.parse(jsonMatch[0]);
    return finalResult;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};