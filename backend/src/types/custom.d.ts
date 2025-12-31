// Custom type declarations for packages without @types

declare module 'cookie-parser' {
  import { RequestHandler } from 'express';
  const cookieParser: RequestHandler;
  export = cookieParser;
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
  }
  
  export function sign(payload: string | object | Buffer, secretOrPrivateKey: string, options?: any): string;
  export function verify(token: string, secretOrPublicKey: string, options?: any): JwtPayload | string;
  export function decode(token: string, options?: any): null | JwtPayload | string;
}

declare module 'multer' {
  import { RequestHandler } from 'express';
  
  interface Multer {
    (options?: any): RequestHandler;
    single(fieldname: string): RequestHandler;
    array(fieldname: string, maxCount?: number): RequestHandler;
    fields(fields: Array<{ name: string; maxCount?: number }>): RequestHandler;
    none(): RequestHandler;
    any(): RequestHandler;
  }
  
  const multer: Multer;
  export = multer;
}

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
  
  // Add Multer namespace for multer types
  namespace Multer {
    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    }
  }
}