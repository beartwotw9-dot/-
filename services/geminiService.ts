import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceItem, ExpenseType } from "../types";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const scanInvoiceImage = async (base64Images: string[]): Promise<InvoiceItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        expenseType: { type: Type.STRING, description: "AIM, BIM (Employee), or DIM" },
        projectNo: { type: Type.STRING },
        projectName: { type: Type.STRING },
        customer: { type: Type.STRING },
        bankCode: { type: Type.STRING },
        bankAccount: { type: Type.STRING },
        totalAmount: { type: Type.NUMBER },
        payee: { type: Type.STRING },
        description: { type: Type.STRING },
        handledBy: { type: Type.STRING },
        proofDate: { type: Type.STRING, description: "YYYY-MM-DD" },
        invoiceNo: { type: Type.STRING },
        sellerTaxId: { type: Type.STRING },
        amountExclTax: { type: Type.NUMBER },
        tax: { type: Type.NUMBER },
        amountInclTax: { type: Type.NUMBER },
        subject: { type: Type.STRING },
        paperReceivedDate: { type: Type.STRING, description: "YYYY-MM-DD" },
        paymentDate: { type: Type.STRING, description: "YYYY-MM-DD" },
        auditRequestAmount: { type: Type.NUMBER },
        auditReceiptAmount: { type: Type.NUMBER }
      },
      required: ["totalAmount", "description"],
    },
  };

  try {
    const imageParts = base64Images.map(base64 => ({
      inlineData: { mimeType: 'image/jpeg', data: base64 }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...imageParts,
          { text: `You are an accounting specialist. Extract exactly 19 fields from the provided images (Payment Request Forms paired with Receipts/Invoices).
          
          RULES:
          1. FOR MISSING DATA: Return "0" for string fields and 0 for numeric fields. Never leave a field empty.
          2. BIM (EMPLOYEE) RULE: For employee expense reports (BIM), the 'payee' (收款人) must be the same as the 'handledBy' (經辦人).
          3. TAX LOGIC: If the document does not support tax deduction (or if tax is not listed), set 'tax' to 0 and 'amountExclTax' exactly equal to the 'totalAmount'.
          4. AUDIT: Compare the sum on the request form vs the receipt. Return these in auditRequestAmount and auditReceiptAmount.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const rawData = JSON.parse(response.text || "[]");
    
    return rawData.map((item: any) => {
      const id = Math.random().toString(36).substring(2, 9);
      const type = (['AIM', 'BIM', 'DIM'].includes(item.expenseType) ? item.expenseType : 'AIM') as ExpenseType;
      const datePart = item.proofDate && item.proofDate !== '0' ? item.proofDate.replace(/-/g, '').substring(2) : '000000';
      
      const reqAmt = item.auditRequestAmount || 0;
      const recAmt = item.auditReceiptAmount || 0;
      const matched = reqAmt > 0 && recAmt > 0 && Math.abs(reqAmt - recAmt) < 1;

      // Handle Employee logic: payee same as handledBy if one is missing or for BIM type
      let finalPayee = item.payee || '0';
      let finalHandledBy = item.handledBy || '0';
      if (type === 'BIM') {
        const name = (finalPayee !== '0' ? finalPayee : finalHandledBy);
        finalPayee = name;
        finalHandledBy = name;
      }

      return {
        id,
        requestNo: `${type}-${datePart}-${id.substring(0, 4).toUpperCase()}`,
        projectNo: item.projectNo || '0',
        projectName: item.projectName || '0',
        customer: item.customer || '0',
        bankCode: item.bankCode || '0',
        bankAccount: item.bankAccount || '0',
        totalAmount: item.totalAmount || 0,
        payee: finalPayee,
        description: item.description || '0',
        handledBy: finalHandledBy,
        proofDate: item.proofDate || '0',
        invoiceNo: item.invoiceNo || '0',
        sellerTaxId: item.sellerTaxId || '0',
        amountExclTax: item.amountExclTax || item.totalAmount || 0,
        tax: item.tax || 0,
        amountInclTax: item.amountInclTax || item.totalAmount || 0,
        subject: item.subject || '一般費用',
        paperReceivedDate: item.paperReceivedDate || '0',
        paymentDate: item.paymentDate || '0',
        expenseType: type,
        isMatched: matched
      };
    });

  } catch (error) {
    console.error("Extraction failed:", error);
    throw error;
  }
};