import React, { useState } from 'react';
import { InvoiceItem } from '../types';
import { Trash2, Plus, Check, Download, AlertCircle, CheckCircle, User, Tag, Landmark, ReceiptText, Calendar, Briefcase, FileText, Banknote } from 'lucide-react';
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
          newItem.amountInclTax = Number(value) || 0;
          if (newItem.tax === 0) newItem.amountExclTax = Number(value) || 0;
        }
        return newItem;
      }
      return item;
    });
    onDataUpdate(updatedData);
  };

  const handleAddRow = () => {
    const id = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const today = new Date().toISOString().split('T')[0];
    const newItem: InvoiceItem = {
      id,
      requestNo: `AIM-${today.replace(/-/g, '').substring(2)}-NEW`,
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

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => {
      const obj: any = {};
      exportColumns.forEach(col => {
        obj[col.label] = item[col.key as keyof InvoiceItem] ?? '0';
      });
      return obj;
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "請款資料");
    XLSX.writeFile(workbook, `Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleCopyTable = () => {
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
    <div className="space-y-6 animate-fade-in w-full">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <ReceiptText className="w-6 h-6 text-blue-600" translate="no" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">核對明細報表</h2>
            <p className="text-sm text-slate-500 font-medium tracking-tight">自動擷取 {data.length} 筆單據資料</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button type="button" onClick={onScanNext} className="flex-1 md:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100">
            <Plus className="w-4 h-4" translate="no" /> 繼續上傳
          </button>
          <button type="button" onClick={handleExport} className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100">
            <Download className="w-4 h-4" translate="no" /> 匯出 Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xl bg-white">
        <table className="w-full text-[11px] text-left border-collapse whitespace-nowrap table-fixed">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-widest">
            <tr>
              <th className="px-4 py-4 w-12 text-center">核</th>
              <th className="px-4 py-4 w-[180px]">編號與專案</th>
              <th className="px-4 py-4 w-[160px]">客戶與銀行</th>
              <th className="px-4 py-4 w-[120px]">支出金額</th>
              <th className="px-4 py-4 w-[160px]">收款與經辦</th>
              <th className="px-4 py-4 w-[140px]">稅務明細</th>
              <th className="px-4 py-4 w-[140px]">發票編號</th>
              <th className="px-4 py-4 w-[150px]">科目與日期</th>
              <th className="px-4 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${!item.isMatched ? 'bg-amber-50/20' : ''}`}>
                <td className="p-4 text-center">
                  <div translate="no" aria-hidden="true">
                    {item.isMatched ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" strokeWidth={2.5} />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" strokeWidth={2.5} />
                    )}
                  </div>
                </td>
                <td className="p-4 space-y-2">
                  <div className="font-bold text-blue-700 tracking-tight">{item.requestNo}</div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor={`pj-no-${item.id}`} className="sr-only">專案編號</label>
                    <input id={`pj-no-${item.id}`} name={`pj-no-${item.id}`} type="text" value={item.projectNo} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'projectNo', e.target.value)} className="w-full bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-500" />
                    <label htmlFor={`pj-name-${item.id}`} className="sr-only">專案名稱</label>
                    <input id={`pj-name-${item.id}`} name={`pj-name-${item.id}`} type="text" value={item.projectName} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'projectName', e.target.value)} className="w-full bg-transparent outline-none text-slate-400 truncate" />
                  </div>
                </td>
                <td className="p-4 space-y-2">
                  <label htmlFor={`cust-${item.id}`} className="sr-only">客戶</label>
                  <input id={`cust-${item.id}`} name={`cust-${item.id}`} type="text" value={item.customer} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'customer', e.target.value)} className="w-full bg-transparent font-medium border-b border-transparent hover:border-slate-300 focus:border-blue-500" />
                  <div className="flex items-center gap-1">
                    <Landmark className="w-3 h-3 text-slate-300" translate="no" aria-hidden="true" />
                    <label htmlFor={`bank-code-${item.id}`} className="sr-only">行號</label>
                    <input id={`bank-code-${item.id}`} name={`bank-code-${item.id}`} type="text" value={item.bankCode} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'bankCode', e.target.value)} className="w-8 text-center bg-slate-100 rounded px-1" />
                    <label htmlFor={`bank-acc-${item.id}`} className="sr-only">帳號</label>
                    <input id={`bank-acc-${item.id}`} name={`bank-acc-${item.id}`} type="text" value={item.bankAccount} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'bankAccount', e.target.value)} className="flex-1 font-mono tracking-tighter outline-none" />
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Banknote className="w-3 h-3 text-emerald-500" translate="no" aria-hidden="true" />
                    <label htmlFor={`amt-${item.id}`} className="sr-only">總額</label>
                    <input id={`amt-${item.id}`} name={`amt-${item.id}`} type="number" value={item.totalAmount} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'totalAmount', Number(e.target.value))} className="w-full text-right font-black text-slate-900 text-sm outline-none bg-transparent" />
                  </div>
                </td>
                <td className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-300" translate="no" aria-hidden="true" />
                    <label htmlFor={`payee-${item.id}`} className="sr-only">收款人</label>
                    <input id={`payee-${item.id}`} name={`payee-${item.id}`} type="text" value={item.payee} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'payee', e.target.value)} className="flex-1 font-bold outline-none border-b border-transparent hover:border-slate-300" />
                  </div>
                  <div className="flex items-center gap-1.5 opacity-60">
                    <Briefcase className="w-3 h-3 text-slate-300" translate="no" aria-hidden="true" />
                    <label htmlFor={`handled-${item.id}`} className="sr-only">經辦人</label>
                    <input id={`handled-${item.id}`} name={`handled-${item.id}`} type="text" value={item.handledBy} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'handledBy', e.target.value)} className="text-[9px] w-full" />
                  </div>
                </td>
                <td className="p-4 space-y-1">
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <label htmlFor={`excl-${item.id}`} className="uppercase">未稅</label>
                    <input id={`excl-${item.id}`} name={`excl-${item.id}`} type="number" value={item.amountExclTax} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'amountExclTax', Number(e.target.value))} className="w-16 text-right bg-transparent outline-none border-b border-transparent hover:border-slate-300" />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-400">
                    <label htmlFor={`tax-${item.id}`} className="uppercase">稅金</label>
                    <input id={`tax-${item.id}`} name={`tax-${item.id}`} type="number" value={item.tax} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'tax', Number(e.target.value))} className="w-16 text-right bg-transparent outline-none border-b border-transparent hover:border-slate-300" />
                  </div>
                </td>
                <td className="p-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-slate-300" translate="no" aria-hidden="true" />
                    <label htmlFor={`inv-${item.id}`} className="sr-only">發票號碼</label>
                    <input id={`inv-${item.id}`} name={`inv-${item.id}`} type="text" value={item.invoiceNo} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'invoiceNo', e.target.value)} className="font-mono text-slate-700 outline-none w-full border-b border-transparent hover:border-slate-300" />
                  </div>
                  <div className="text-[10px] text-slate-300 flex items-center gap-1">
                    <span className="font-black" translate="no">#</span>
                    <label htmlFor={`taxid-${item.id}`} className="sr-only">統編</label>
                    <input id={`taxid-${item.id}`} name={`taxid-${item.id}`} type="text" value={item.sellerTaxId} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'sellerTaxId', e.target.value)} className="outline-none w-full" />
                  </div>
                </td>
                <td className="p-4 space-y-2">
                  <label htmlFor={`sub-${item.id}`} className="sr-only">會計科目</label>
                  <input id={`sub-${item.id}`} name={`sub-${item.id}`} type="text" value={item.subject} autoComplete="off" onChange={(e) => handleCellChange(item.id, 'subject', e.target.value)} className="text-blue-600 font-bold w-full bg-transparent outline-none border-b border-transparent hover:border-slate-300" />
                  <div className="flex items-center gap-1 text-slate-400 text-[9px]">
                    <Calendar className="w-2.5 h-2.5" translate="no" aria-hidden="true" />
                    <label htmlFor={`date-${item.id}`} className="sr-only">日期</label>
                    <input id={`date-${item.id}`} name={`date-${item.id}`} type="date" value={item.proofDate} onChange={(e) => handleCellChange(item.id, 'proofDate', e.target.value)} className="bg-transparent outline-none" />
                  </div>
                </td>
                <td className="p-4">
                  <button type="button" onClick={() => onDataUpdate(data.filter(d => d.id !== item.id))} className="text-slate-200 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50" title="刪除">
                    <Trash2 className="w-4 h-4" translate="no" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <button type="button" onClick={handleAddRow} className="px-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center gap-2 text-sm font-bold">
          <Plus className="w-5 h-5" translate="no" /> 手動新增一筆
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={handleCopyTable} className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-500" translate="no" /> : <Tag className="w-4 h-4" translate="no" />}
            {copied ? "已複製" : "複製 TSV"}
          </button>
          <button type="button" onClick={onClearAll} className="px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all flex items-center gap-2">
            <Trash2 className="w-4 h-4" translate="no" /> 全部清除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase tracking-widest font-black mb-1">Total (Incl. Tax)</span>
          <span className="text-3xl font-black font-mono">TWD {data.reduce((sum, i) => sum + i.totalAmount, 0).toLocaleString()}</span>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-black mb-1">Audit Pass Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              {Math.round((data.filter(d => d.isMatched).length / data.length) * 100 || 0)}%
            </span>
            <span className="text-xs font-bold text-slate-400">({data.filter(d => d.isMatched).length} / {data.length} matched)</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <span className="text-[10px] text-slate-500 block uppercase tracking-widest font-black mb-1">Untaxed Total</span>
          <span className="text-3xl font-black text-blue-600 font-mono">TWD {data.reduce((sum, i) => sum + i.amountExclTax, 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;