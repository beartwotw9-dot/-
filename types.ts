export type ExpenseType = 'AIM' | 'BIM' | 'DIM';

export interface InvoiceItem {
  id: string;
  requestNo: string;           // 1. 請款單編號
  projectNo: string;           // 2. 專案編號
  projectName: string;         // 3. 專案名稱
  customer: string;            // 4. 客戶
  bankCode: string;            // 5. 收款行代碼
  bankAccount: string;         // 6. 收款帳號
  totalAmount: number;         // 7. 支出金額 (總額)
  payee: string;               // 8. 收款人姓名(與帳戶相同)
  description: string;         // 9. 說明
  handledBy: string;           // 10. 經辦人
  proofDate: string;           // 11. 憑證日期
  invoiceNo: string;           // 12. 發票編號
  sellerTaxId: string;         // 13. 賣方統編
  amountExclTax: number;       // 14. 未稅金額
  tax: number;                 // 15. 稅金
  amountInclTax: number;       // 16. 含稅金額
  subject: string;             // 17. 會計科目
  paperReceivedDate: string;   // 18. 財務取得紙本日期
  paymentDate: string;         // 19. 預計出帳日期
  
  expenseType: ExpenseType;    // Internal classification
  isMatched: boolean;          // Internal audit status (Request vs Proof amount match)
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}