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
        expenseType: { type: Type.STRING, description: "AIM (Vendor), BIM (Employee), DIM (Outsource)" },
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
        requestFormAmountDetected: { type: Type.NUMBER, description: "Total amount detected specifically on the Request Form" },
        proofAmountDetected: { type: Type.NUMBER, description: "Total amount detected specifically on the Receipt/Invoice" }
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
          { text: `You are an expert accounting AI. Analyze the uploaded document pairs (Payment Request Form + Receipt/Invoice).
          Extract the following 19 fields for each transaction:
          1. 請款單編號 (Generate code based on type and date)
          2. 專案編號
          3. 專案名稱
          4. 客戶
          5. 收款行代碼
          6. 收款帳號
          7. 支出金額 (Total amount)
          8. 收款人姓名 (Must match bank account holder)
          9. 說明
          10. 經辦人
          11. 憑證日期
          12. 發票編號
          13. 賣方統編
          14. 未稅金額
          15. 稅金
          16. 含稅金額
          17. 會計科目
          18. 財務取得紙本日期
          19. 預計出帳日期

          RULES:
          - If data is missing or not found, strictly use "0" for strings and 0 for numbers.
          - For 'BIM' (Employee Expense), 'payee' and 'handledBy' are usually the same.
          - TAX RULE: If tax is missing or non-deductible per regulations, set 'tax' to 0 and 'amountExclTax' equal to 'totalAmount'.
          - AUDIT: Compare the total amount on the 'Request Form' vs 'Receipt'. Record both in 'requestFormAmountDetected' and 'proofAmountDetected'.` }
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
      const datePart = item.proofDate ? item.proofDate.replace(/-/g, '').substring(2) : '000000';
      
      const formAmt = item.requestFormAmountDetected || 0;
      const proofAmt = item.proofAmountDetected || 0;
      const isMatched = formAmt > 0 && proofAmt > 0 && Math.abs(formAmt - proofAmt) < 0.01;

      return {
        id,
        requestNo: item.requestNo || `${type}-${datePart}-${id.substring(0, 4).toUpperCase()}`,
        projectNo: item.projectNo || '0',
        projectName: item.projectName || '0',
        customer: item.customer || '0',
        bankCode: item.bankCode || '0',
        bankAccount: item.bankAccount || '0',
        totalAmount: item.totalAmount || 0,
        payee: item.payee || (type === 'BIM' ? item.handledBy : '0'),
        description: item.description || '0',
        handledBy: item.handledBy || (type === 'BIM' ? item.payee : '0'),
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
        isMatched: isMatched
      };
    });

  } catch (error) {
    console.error("Scan Error:", error);
    throw error;
  }
};