import fs from 'fs';

interface PdfParseResult {
  numpages: number;
  numrender: number;
  info: any;
  metadata: any;
  text: string;
  version: string;
}

const pdfParse = require('pdf-parse');

export const extractTextFromFile = async (
  filePath: string,
  fileType: 'pdf' | 'text'
): Promise<string> => {
  if (fileType === 'pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data: PdfParseResult = await pdfParse(dataBuffer);
    return data.text;
  } else {
    return fs.readFileSync(filePath, 'utf-8');
  }
};

export const extractTextFromBase64 = async (
  base64Data: string,
  fileType: 'pdf' | 'text'
): Promise<string> => {
  const buffer = Buffer.from(base64Data, 'base64');

  if (fileType === 'pdf') {
    const data: PdfParseResult = await pdfParse(buffer);
    return data.text;
  } else {
    return buffer.toString('utf-8');
  }
};