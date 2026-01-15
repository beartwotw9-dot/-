
import React, { useState } from 'react';
import { InvoiceItem } from '../types';
import { Trash2, Plus, Check, Download, AlertCircle, CheckCircle, User, Tag, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ResultTableProps {
  data: InvoiceItem[];
  onDataUpdate: (newData: InvoiceItem[]) => void;
  onClearAll: () => void;
  onScanNext: () => void;
}

// ResultTable component manages the display and export of extracted invoice data.
const ResultTable: React.FC<ResultTableProps> = ({ data, onDataUpdate, onClearAll, onScanNext }) => {
  const [copied, setCopied] = useState(false);

  // handleCellChange allows manual editing of fields in the table if needed.
  // Currently defined but not wired to inputs in the simplified view.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCellChange = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedData = data.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        
        // Logical calculations for amounts and taxes based on accounting rules
        if (field === 'totalAmount') {
          newItem.amountInclTax = Number(value);
          if (newItem.tax === 0) newItem.amountExclTax = Number(value);
        }
        if (field === 'tax') {
          newItem.amountExclTax = newItem.totalAmount - Number(value);
        }
        if (field === 'amountExclTax') {
          newItem.tax = newItem.totalAmount - Number(value);
        }

        return newItem;
      }
      return item;
    });
    onDataUpdate(updatedData);
  };

  // handleAddRow allows manual addition of entries if the AI scan missed something.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddRow = () => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const today = new Date().toISOString().split('T')[0];
    const newItem: InvoiceItem = {
      id,
      requestNo: `AIM-${today.replace(/-/g, '').substring(2)}-${id.substring(0, 4).toUpperCase()}`,
      projectNo: '0',
      projectName: '0',
      customer: '0',
      bankCode: '0',
      bankAccount: '0',
      totalAmount: 0,
      payee: '0',
      description: '0',
      handledBy: '0',
      proofDate: today,
      invoiceNo: '0',
      sellerTaxId: '0',
      amountExclTax: 0,
      tax: 0,
      amountInclTax: 0,
      subject: '一般費用',
      paperReceivedDate: '0',
      paymentDate: '0',
      expenseType: 'AIM',
      isMatched: false
    };
    onDataUpdate([...data, newItem]);
  };

  // Define columns for Excel export
  const exportColumns = [
    { label: '請款單編號', key: 'requestNo' },
    { label: '專案編號', key: 'projectNo' },
    { label: '專案名稱', key: 'projectName' },
    { label: '客戶', key: 'customer' },
    { label: '收款行代碼', key: 'bankCode' },
    { label: '收款帳號', key: 'bankAccount' },
    { label: '支出金額', key: 'totalAmount' },
    { label: '收款人姓名', key: 'payee' },
    { label: '說明', key: 'description' },
    { label: '經辦人', key: 'handledBy' },
    { label: '憑證日期', key: 'proofDate' },
    { label: '發票編號', key: 'invoiceNo' },
    { label: '賣方統編', key: 'sellerTaxId' },
    { label: '未稅金額', key: 'amountExclTax' },
    { label: '稅金', key: 'tax' },
    { label: '含稅金額', key: 'amountInclTax' },
    { label: '會計科目', key: 'subject' },
    { label: '財務取得紙本日期', key: 'paperReceivedDate' },
    { label: '預計出帳日期', key: 'paymentDate' },
  ];

  // handleExport uses XLSX to generate a spreadsheet file.
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => {
      const row: any = {};
      exportColumns.forEach(col => {
        row[col.label] = item[col.key as keyof InvoiceItem];
      });
      return row;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `invoice_audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDeleteRow = (id: string) => {
    onDataUpdate(data.filter(item => item.id !== id));
  };

  // handleCopyTable copies the table data to the clipboard in tab-separated format (compatible with Excel).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCopyTable = () => {
    const text = data.map(item => 
      exportColumns.map(col => item[col.key as keyof InvoiceItem]).join('\t')
    ).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">核對清單</h2>
          <p className="text-sm text-slate-500">已自動比對 {data.length} 筆單據資料</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button onClick={onScanNext} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95">
             <Plus className="w-4 h-4" /> 繼續掃描
           </button>
           <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95">
             <Download className="w-4 h-4" /> 匯出 Excel
           </button>
           <button onClick={onClearAll} className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-50 transition-all active:scale-95">
             <Trash2 className="w-4 h-4" /> 全部清除
           </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 border-b">狀態</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 border-b">請款編號 / 類型</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 border-b">專案資訊</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 border-b">金額明細 (含稅)</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 border-b">收款人 / 經辦人</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 border-b">說明 / 科目</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 border-b text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-4">
                  {item.isMatched ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">金額一致</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-full w-fit">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">待確認</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                   <div className="text-xs font-bold text-slate-700">{item.requestNo}</div>
                   <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {item.expenseType}
                   </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs font-semibold text-slate-600 truncate max-w-[150px]">{item.projectName}</div>
                  <div className="text-[10px] text-slate-400">{item.projectNo}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-bold text-slate-800">
                    $ {item.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    未稅: {item.amountExclTax.toLocaleString()} / 稅: {item.tax.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <User className="w-3 h-3 text-slate-400" /> {item.payee}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 pl-4">經辦: {item.handledBy}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-slate-600 truncate max-w-[200px]">{item.description}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{item.subject}</div>
                </td>
                <td className="px-4 py-4 text-right">
                   <button 
                     onClick={() => handleDeleteRow(item.id)}
                     className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                     title="刪除"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Search className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm font-medium">尚無單據資料，請先上傳圖片</p>
        </div>
      )}
      
      {copied && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-2xl animate-fade-in-up">
          <Check className="w-4 h-4 inline mr-2" /> 已複製到剪貼簿
        </div>
      )}
    </div>
  );
};

// Fixed: Added the missing default export to satisfy App.tsx imports.
export default ResultTable;
