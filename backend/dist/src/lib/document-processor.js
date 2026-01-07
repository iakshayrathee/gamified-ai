"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentProcessor = void 0;
const client_1 = require("@prisma/client");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const mammoth_1 = __importDefault(require("mammoth"));
const pdf_lib_1 = require("pdf-lib");
const sharp_1 = __importDefault(require("sharp"));
const openai_service_1 = __importDefault(require("./openai-service"));
const s3_service_1 = require("./s3-service");
const prisma = new client_1.PrismaClient();
const ai = openai_service_1.default;
/**
 * Document Processor Service
 * Extracts questions and images from PDF/DOCX documents using AI
 */
class DocumentProcessor {
    /**
     * Process an uploaded document
     */
    async processDocument(fileBuffer, fileName, fileType, uploadedBy, fileUrl) {
        // Create document record - omit uploadedBy if it's 'admin' (not a real user ID)
        const document = await prisma.uploadedDocument.create({
            data: {
                ...(uploadedBy !== 'admin' ? { uploadedBy } : {}),
                fileName,
                fileType,
                fileUrl,
                status: 'PROCESSING'
            }
        });
        try {
            // 1. Extract text and images
            const { text, images } = await this.extractContent(fileBuffer, fileType);
            // 2. Use AI to extract structured questions
            const questions = await this.extractQuestions(text);
            // 3. Upload images to S3
            const imageUrls = await this.uploadImages(images, document.id);
            // 4. Save extracted questions to database
            await this.saveExtractedQuestions(document.id, questions, imageUrls);
            // 5. Update document status
            await prisma.uploadedDocument.update({
                where: { id: document.id },
                data: {
                    status: 'COMPLETED',
                    processedAt: new Date(),
                    extractedQuestions: questions.length,
                    extractedImages: images.length
                }
            });
            return await prisma.uploadedDocument.findUnique({
                where: { id: document.id },
                include: {
                    questions: true
                }
            });
        }
        catch (error) {
            // Update document with error
            await prisma.uploadedDocument.update({
                where: { id: document.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            throw error;
        }
    }
    /**
     * Extract text and images from document
     */
    async extractContent(buffer, fileType) {
        if (fileType === 'PDF') {
            return await this.extractFromPDF(buffer);
        }
        else {
            return await this.extractFromDOCX(buffer);
        }
    }
    /**
     * Extract content from PDF
     */
    async extractFromPDF(buffer) {
        // Extract text
        const pdfData = await (0, pdf_parse_1.default)(buffer);
        const text = pdfData.text;
        // Extract images
        const images = [];
        try {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(buffer);
            const pages = pdfDoc.getPages();
            for (const page of pages) {
                // Note: pdf-lib doesn't directly support image extraction
                // This is a simplified version - in production, you might need
                // additional libraries like pdf2pic or pdfjs-dist
                // For now, we'll skip image extraction from PDF
            }
        }
        catch (error) {
            console.warn('Image extraction from PDF failed:', error);
        }
        return { text, images };
    }
    /**
     * Extract content from DOCX
     */
    async extractFromDOCX(buffer) {
        // Extract text
        const result = await mammoth_1.default.extractRawText({ buffer });
        const text = result.value;
        // Extract images
        const images = [];
        try {
            const imageResult = await mammoth_1.default.convertToHtml({ buffer });
            // Parse images from HTML (simplified - in production, use proper HTML parsing)
            // For now, we'll skip image extraction from DOCX
        }
        catch (error) {
            console.warn('Image extraction from DOCX failed:', error);
        }
        return { text, images };
    }
    /**
     * Extract questions using AI
     */
    async extractQuestions(text) {
        if (!text || text.trim().length < 10) {
            return [];
        }
        const systemPrompt = `You are an expert at extracting educational questions from documents.
You can identify and extract ALL types of questions including:
- Multiple choice questions
- True/False questions
- Fill-in-the-blank questions
- Matching exercises
- Activity instructions that can be converted to questions
- Short answer questions

Convert all educational content into structured question format with options and correct answers.
Return valid JSON only.`;
        const userPrompt = `Extract ALL educational questions and activities from this document text and convert them into a structured question format:

${text}

IMPORTANT INSTRUCTIONS:
1. For multiple choice questions: Extract as-is with all options
2. For fill-in-the-blank: Convert to multiple choice by creating plausible options
   Example: "The capital of France is _____. Answer: Paris"
   Convert to: Question: "What is the capital of France?", Options: ["Paris", "London", "Berlin", "Madrid"], Answer: "Paris"

3. For True/False: Extract with two options ["True", "False"]
4. For matching exercises: Create individual questions for each match pair
   Example: "Match A with 1, B with 2"
   Convert to: Q1: "What matches with A?", Options: ["1", "2", "3"], Answer: "1"

5. For activity instructions: Convert to actionable questions
   Example: "Match the letters. Say a word that starts with each letter."
   Convert to: Q: "What should you do with the letters?", Options: ["Match them", "Count them", "Color them"], Answer: "Match them"

6. ANALYZE DIFFICULTY: For each question, determine difficulty level (1-3):
   - Level 1 (Easy): Simple recall, basic concepts, obvious answers
   - Level 2 (Medium): Requires understanding, some reasoning
   - Level 3 (Hard): Complex reasoning, multiple steps, advanced concepts

7. SUGGEST GAME TEMPLATE: Based on question format, suggest the best game template:
   - TAP_SELECT: Standard multiple choice (most common)
   - TRUE_FALSE: True/False questions
   - DRAG_DROP: Matching, ordering, categorization
   - SORTING: Sequence or order questions
   - PICTURE_TO_WORD: Visual identification questions
   - MEMORY_CARD: Pair matching questions
   - ODD_ONE_OUT: Find the different item

For each question, provide:
{
  "questionText": "The complete question",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "the correct option from the options array",
  "explanation": "Brief explanation if available",
  "hasImage": true/false,
  "imageDescription": "Description if question references images",
  "difficultyLevel": 1 or 2 or 3,
  "gameTemplate": "TAP_SELECT" or "TRUE_FALSE" or "DRAG_DROP" etc.
}

Return a JSON object with this structure:
{
  "questions": [
    {
      "questionText": "What is 2 + 2?",
      "options": ["2", "3", "4", "5"],
      "correctAnswer": "4",
      "explanation": "Basic addition",
      "hasImage": false,
      "imageDescription": null,
      "difficultyLevel": 1,
      "gameTemplate": "TAP_SELECT"
    }
  ]
}

CRITICAL: Extract and convert ALL educational content. Be creative in converting activities and instructions into questions.
If the document contains worksheets or activities, create questions based on what students are asked to do.
Return an empty array ONLY if there is absolutely no educational content.`;
        try {
            console.log('🤖 Calling OpenAI for question extraction...');
            const response = await ai.generateStructuredResponse(userPrompt, systemPrompt);
            console.log('✅ AI extraction successful. Found', response.questions?.length || 0, 'questions');
            // Validate and clean up extracted questions
            const validQuestions = (response.questions || []).filter(q => {
                return q.questionText &&
                    q.options &&
                    q.options.length >= 2 &&
                    q.correctAnswer &&
                    q.options.includes(q.correctAnswer);
            });
            if (validQuestions.length < response.questions?.length) {
                console.warn(`⚠️ Filtered out ${response.questions.length - validQuestions.length} invalid questions`);
            }
            return validQuestions;
        }
        catch (error) {
            console.error('❌ AI extraction failed:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            return [];
        }
    }
    /**
     * Upload images to S3
     */
    async uploadImages(images, documentId) {
        const urls = [];
        for (let i = 0; i < images.length; i++) {
            try {
                // Process image with sharp (resize, optimize)
                const processedImage = await (0, sharp_1.default)(images[i])
                    .resize(800, 800, { fit: 'inside' })
                    .jpeg({ quality: 85 })
                    .toBuffer();
                // Upload to S3 using uploadAsset
                const result = await (0, s3_service_1.uploadAsset)({
                    file: processedImage,
                    fileName: `image-${i}.jpg`,
                    folder: 'images',
                    subFolder: `documents/${documentId}`,
                    contentType: 'image/jpeg'
                });
                urls.push(result.url);
            }
            catch (error) {
                console.error(`Failed to upload image ${i}:`, error);
            }
        }
        return urls;
    }
    /**
     * Save extracted questions to database
     */
    async saveExtractedQuestions(documentId, questions, imageUrls) {
        for (const q of questions) {
            await prisma.extractedQuestion.create({
                data: {
                    documentId,
                    questionText: q.questionText,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || null,
                    imageUrls: q.hasImage ? imageUrls : [],
                    gameTemplate: q.gameTemplate || 'TAP_SELECT',
                    difficultyLevel: q.difficultyLevel || 1,
                    confidence: 0.85, // Could be calculated based on AI response
                    reviewStatus: 'PENDING'
                }
            });
        }
    }
    /**
     * Get document processing status
     */
    async getDocumentStatus(documentId) {
        return await prisma.uploadedDocument.findUnique({
            where: { id: documentId },
            include: {
                questions: true
            }
        });
    }
    /**
     * Get all documents for admin
     */
    async getAllDocuments(limit = 50) {
        return await prisma.uploadedDocument.findMany({
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                questions: true // Include ALL questions, let frontend filter
            },
            orderBy: {
                uploadedAt: 'desc'
            },
            take: limit
        });
    }
    /**
     * Approve and assign question to skill
     */
    async approveQuestion(questionId, skillId) {
        try {
            // Get the extracted question first
            const extractedQuestion = await prisma.extractedQuestion.findUnique({
                where: { id: questionId }
            });
            if (!extractedQuestion) {
                console.error('Extracted question not found:', questionId);
                throw new Error('Extracted question not found');
            }
            console.log('Approving question:', {
                questionId,
                skillId,
                questionText: extractedQuestion.questionText,
                options: extractedQuestion.options,
                correctAnswer: extractedQuestion.correctAnswer
            });
            // Update the extracted question status
            await prisma.extractedQuestion.update({
                where: { id: questionId },
                data: {
                    skillId,
                    reviewStatus: 'APPROVED'
                }
            });
            // Parse options from JSON
            const options = Array.isArray(extractedQuestion.options)
                ? extractedQuestion.options
                : JSON.parse(extractedQuestion.options);
            // Create distractors by filtering out the correct answer
            const distractors = options.filter(opt => opt !== extractedQuestion.correctAnswer);
            console.log('Creating Question record:', {
                microSkillId: skillId,
                promptText: extractedQuestion.questionText,
                correctAnswer: extractedQuestion.correctAnswer,
                distractors,
                optionsCount: options.length,
                distractorsCount: distractors.length
            });
            // Create actual question in the Question table for gameplay
            const createdQuestion = await prisma.question.create({
                data: {
                    microSkillId: skillId,
                    difficultyLevel: extractedQuestion.difficultyLevel || 1, // Use AI suggestion or default to 1
                    promptText: extractedQuestion.questionText,
                    correctAnswer: extractedQuestion.correctAnswer,
                    distractors: distractors,
                    hasConfusingDistractors: false,
                    assetUrls: {
                        images: extractedQuestion.imageUrls || []
                    }
                }
            });
            console.log('✅ Question created successfully:', {
                questionId: createdQuestion.id,
                microSkillId: createdQuestion.microSkillId,
                promptText: createdQuestion.promptText
            });
            return extractedQuestion;
        }
        catch (error) {
            console.error('❌ Error in approveQuestion:', error);
            throw error;
        }
    }
    /**
     * Reject extracted question
     */
    async rejectQuestion(questionId) {
        return await prisma.extractedQuestion.update({
            where: { id: questionId },
            data: {
                reviewStatus: 'REJECTED'
            }
        });
    }
}
exports.DocumentProcessor = DocumentProcessor;
exports.default = new DocumentProcessor();
