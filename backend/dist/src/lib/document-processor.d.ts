/**
 * Document Processor Service
 * Extracts questions and images from PDF/DOCX documents using AI
 */
export declare class DocumentProcessor {
    /**
     * Process an uploaded document
     */
    processDocument(fileBuffer: Buffer, fileName: string, fileType: 'PDF' | 'DOCX', uploadedBy: string, fileUrl: string): Promise<any>;
    /**
     * Extract text and images from document
     */
    private extractContent;
    /**
     * Extract content from PDF
     */
    private extractFromPDF;
    /**
     * Extract content from DOCX
     */
    private extractFromDOCX;
    /**
     * Extract questions using AI
     */
    private extractQuestions;
    /**
     * Upload images to S3
     */
    private uploadImages;
    /**
     * Save extracted questions to database
     */
    private saveExtractedQuestions;
    /**
     * Get document processing status
     */
    getDocumentStatus(documentId: string): Promise<any>;
    /**
     * Get all documents for admin
     */
    getAllDocuments(limit?: number): Promise<any[]>;
    /**
     * Approve and assign question to skill
     */
    approveQuestion(questionId: string, skillId: string): Promise<any>;
    /**
     * Reject extracted question
     */
    rejectQuestion(questionId: string): Promise<any>;
}
declare const _default: DocumentProcessor;
export default _default;
//# sourceMappingURL=document-processor.d.ts.map