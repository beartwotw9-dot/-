import React, { useState } from 'react';
import { InvoiceItem, ExpenseType } from '../types';
import { Copy, Trash2, Plus, Check, Camera, Download, AlertCircle, CheckCircle2, User, Landmark, ReceiptText, Calendar, Briefcase, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ResultTableProps {
  data: InvoiceItem[];
  onDataUpdate: (newData: InvoiceItem[]) => void;
  onClearAll: () => void;
  onScanNext: () => void;
}

const ResultTable: React.FC<ResultTableProps> = ({ data, onDataUpdate, onClearAll, onScanNext }) => {
  const [copied, setCopied] = useState(false);

  const handleCellChange = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedData = data.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        if (field === 'totalAmount') {
          newItem.amountInclTax = value;
          // If tax is 0, auto set Excl Tax to Total
          if (newItem.tax === 0) newItem.amountExclTax = value;
        }
        if (field === 'tax') {
          newItem.amountExclTax = newItem.totalAmount - value;
        }
        return newItem;
      }
      return item;
    });
    onDataUpdate(updatedData);
  };

  const handleAddRow = () => {
    const id = Math.random().toString(36).substring(2, 9);
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
    { label: '預計出帳日期', key: 'paymentDate' }
  ];

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => {
      const obj: any = {};
      exportColumns.forEach(col => {
        obj[col.label] = item[col.key as keyof InvoiceItem] ?? '0';
      });
      return obj;
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "請款明細");
    XLSX.writeFile(workbook, `請款單匯出_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const copyToClipboard = () => {
    const headers = exportColumns.map(c => c.label).join('\t');
    const rows = data.map(item => exportColumns.map(c => item[c.key as keyof InvoiceItem] ?? '0').join('\t'));
    const text = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (data.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in w-full">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-blue-600" />
              請款稽核明細
            </h2>
            <p className="text-xs text-slate-500 mt-1">已依照 19 個必要欄位自動擷取並核對金額</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={onScanNext} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm">
              <Camera className="w-4 h-4" /> 繼續上傳
            </button>
            <button onClick={downloadExcel} className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm">
              <Download className="w-4 h-4" /> 下載 Excel
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button onClick={onClearAll} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> 清空全部
          </button>
          <div className="flex-grow"></div>
          <button onClick={copyToClipboard} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-1 border border-slate-200">
            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "已複製" : "複製 TSV"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
            <tr>
              <th className="px-3 py-3 w-10 text-center">核</th>
              <th className="px-3 py-3 min-w-[150px]">請款單編號 / 專案</th>
              <th className="px-3 py-3 min-w-[120px]">客戶</th>
              <th className="px-3 py-3 min-w-[160px]">銀行資訊 (代碼/帳號)</th>
              <th className="px-3 py-3 min-w-[100px]">支出金額</th>
              <th className="px-3 py-3 min-w-[150px]">收款人 / 經辦人</th>
              <th className="px-3 py-3 min-w-[150px]">說明</th>
              <th className="px-3 py-3 min-w-[150px]">稅務明細 (未稅/稅)</th>
              <th className="px-3 py-3 min-w-[120px]">發票 / 統編</th>
              <th className="px-3 py-3 min-w-[120px]">科目 / 日期</th>
              <th className="px-3 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${!item.isMatched ? 'bg-orange-50/30' : ''}`}>
                <td className="p-2 text-center">
                  {item.isMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" title="請款單與發票金額相符" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-orange-400 mx-auto" title="金額不符或缺少憑證" />
                  )}
                </td>
                <td className="p-2 space-y-1">
                  <div className="font-bold text-blue-700 tracking-tight">{item.requestNo}</div>
                  <div className="flex gap-1">
                    <input 
                      id={`projectNo-${item.id}`}
                      name={`projectNo-${item.id}`}
                      type="text" 
                      value={item.projectNo} 
                      onChange={(e) => handleCellChange(item.id, 'projectNo', e.target.value)} 
                      placeholder="專案編號" 
                      className="w-16 border-b border-transparent hover:border-slate-200 outline-none p-0 bg-transparent" 
                    />
                    <input 
                      id={`projectName-${item.id}`}
                      name={`projectName-${item.id}`}
                      type="text" 
                      value={item.projectName} 
                      onChange={(e) => handleCellChange(item.id, 'projectName', e.target.value)} 
                      placeholder="專案名稱" 
                      className="flex-1 border-b border-transparent hover:border-slate-200 outline-none p-0 bg-transparent" 
                    />
                  </div>
                </td>
                <td className="p-2">
                  <input 
                    id={`customer-${item.id}`}
                    name={`customer-${item.id}`}
                    type="text" 
                    value={item.customer} 
                    onChange={(e) => handleCellChange(item.id, 'customer', e.target.value)} 
                    className="w-full bg-transparent outline-none" 
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-slate-400" />
                    <input 
                      id={`bankCode-${item.id}`}
                      name={`bankCode-${item.id}`}
                      type="text" 
                      value={item.bankCode} 
                      onChange={(e) => handleCellChange(item.id, 'bankCode', e.target.value)} 
                      className="w-8 text-center bg-transparent border-b border-transparent hover:border-slate-200 outline-none" 
                    />
                    <input 
                      id={`bankAccount-${item.id}`}
                      name={`bankAccount-${item.id}`}
                      type="text" 
                      value={item.bankAccount} 
                      onChange={(e) => handleCellChange(item.id, 'bankAccount', e.target.value)} 
                      className="flex-1 font-mono bg-transparent border-b border-transparent hover:border-slate-200 outline-none" 
                    />
                  </div>
                </td>
                <td className="p-2 font-bold text-slate-900">
                  <input 
                    id={`totalAmount-${item.id}`}
                    name={`totalAmount-${item.id}`}
                    type="number" 
                    value={item.totalAmount} 
                    onChange={(e) => handleCellChange(item.id, 'totalAmount', parseFloat(e.target.value) || 0)} 
                    className="w-full text-right bg-transparent outline-none font-bold" 
                  />
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <input 
                      id={`payee-${item.id}`}
                      name={`payee-${item.id}`}
                      type="text" 
                      value={item.payee} 
                      onChange={(e) => handleCellChange(item.id, 'payee', e.target.value)} 
                      className="flex-1 bg-transparent outline-none border-b border-transparent hover:border-slate-200" 
                    />
                  </div>
                  <div className="flex items-center gap-1 pl-4 opacity-60">
                    <Briefcase className="w-2.5 h-2.5" />
                    <input 
                      id={`handledBy-${item.id}`}
                      name={`handledBy-${item.id}`}
                      type="text" 
                      value={item.handledBy} 
                      onChange={(e) => handleCellChange(item.id, 'handledBy', e.target.value)} 
                      className="text-[9px] bg-transparent outline-none border-b border-transparent hover:border-slate-200 w-full" 
                    />
                  </div>
                </td>
                <td className="p-2">
                  <input 
                    id={`description-${item.id}`}
                    name={`description-${item.id}`}
                    type="text" 
                    value={item.description} 
                    onChange={(e) => handleCellChange(item.id, 'description', e.target.value)} 
                    className="w-full bg-transparent outline-none italic text-slate-600 border-b border-transparent hover:border-slate-200" 
                  />
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex justify-between items-center gap-2">
                    <label htmlFor={`exclTax-${item.id}`} className="text-slate-400 text-[9px] uppercase">未稅</label>
                    <input 
                      id={`exclTax-${item.id}`}
                      name={`exclTax-${item.id}`}
                      type="number" 
                      value={item.amountExclTax} 
                      onChange={(e) => handleCellChange(item.id, 'amountExclTax', parseFloat(e.target.value) || 0)} 
                      className="w-16 text-right bg-transparent outline-none" 
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <label htmlFor={`tax-${item.id}`} className="text-slate-400 text-[9px] uppercase">稅金</label>
                    <input 
                      id={`tax-${item.id}`}
                      name={`tax-${item.id}`}
                      type="number" 
                      value={item.tax} 
                      onChange={(e) => handleCellChange(item.id, 'tax', parseFloat(e.target.value) || 0)} 
                      className="w-16 text-right bg-transparent outline-none" 
                    />
                  </div>
                </td>
                <td className="p-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <input 
                      id={`invoiceNo-${item.id}`}
                      name={`invoiceNo-${item.id}`}
                      type="text" 
                      value={item.invoiceNo} 
                      onChange={(e) => handleCellChange(item.id, 'invoiceNo', e.target.value)} 
                      className="font-mono text-slate-700 bg-transparent outline-none border-b border-transparent hover:border-slate-200 w-full" 
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="opacity-50">#</span>
                    <input 
                      id={`sellerTaxId-${item.id}`}
                      name={`sellerTaxId-${item.id}`}
                      type="text" 
                      value={item.sellerTaxId} 
                      onChange={(e) => handleCellChange(item.id, 'sellerTaxId', e.target.value)} 
                      className="bg-transparent outline-none border-b border-transparent hover:border-slate-200 w-full" 
                    />
                  </div>
                </td>
                <td className="p-2 space-y-1">
                  <input 
                    id={`subject-${item.id}`}
                    name={`subject-${item.id}`}
                    type="text" 
                    value={item.subject} 
                    onChange={(e) => handleCellChange(item.id, 'subject', e.target.value)} 
                    className="text-blue-600 font-medium bg-transparent outline-none border-b border-transparent hover:border-slate-200 w-full" 
                  />
                  <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                    <Calendar className="w-2.5 h-2.5" />
                    <input 
                      id={`proofDate-${item.id}`}
                      name={`proofDate-${item.id}`}
                      type="date" 
                      value={item.proofDate} 
                      onChange={(e) => handleCellChange(item.id, 'proofDate', e.target.value)} 
                      className="bg-transparent outline-none p-0" 
                    />
                  </div>
                </td>
                <td className="p-2">
                  <button onClick={() => onDataUpdate(data.filter(d => d.id !== item.id))} className="text-slate-300 hover:text-red-500 transition-colors p-1" title="刪除本列">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={handleAddRow} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center gap-2 font-semibold text-xs shadow-sm">
        <Plus className="w-4 h-4" /> 手動新增一筆資料
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg border border-slate-700">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">支出總額 (含稅)</span>
          <span className="text-xl font-bold font-mono">TWD {data.reduce((sum, i) => sum + i.totalAmount, 0).toLocaleString()}</span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">金額核對狀況</span>
          <span className="text-xl font-bold text-green-600 font-mono">{data.filter(d => d.isMatched).length} / {data.length} <span className="text-xs font-sans text-slate-400 ml-1">項相符</span></span>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">未稅總額</span>
          <span className="text-xl font-bold text-blue-600 font-mono">TWD {data.reduce((sum, i) => sum + i.amountExclTax, 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;