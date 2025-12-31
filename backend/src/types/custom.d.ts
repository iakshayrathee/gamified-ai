// Custom type declarations for packages without @types

declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }

  function pdfParse(data: Buffer | ArrayBuffer): Promise<PDFData>;
  export = pdfParse;
}

// Extend Express Request to include file properties
declare namespace Express {
  interface Request {
    file?: any;
    files?: any;
  }
}