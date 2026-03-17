import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ExportModal({ isOpen, onClose, debts, payments, calculateRemainingDebt }) {
  const [selectedDebts, setSelectedDebts] = useState(debts.map(d => d.id));
  const [includeFields, setIncludeFields] = useState({
    borrowerName: true,
    originalAmount: true,
    remainingAmount: true,
    totalPaid: true,
    percentPaid: true,
    paymentPlans: true,
    payments: true,
    paymentDates: true,
    paymentNotes: true,
    createdDate: true
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleDebt = (debtId) => {
    if (selectedDebts.includes(debtId)) {
      setSelectedDebts(selectedDebts.filter(id => id !== debtId));
    } else {
      setSelectedDebts([...selectedDebts, debtId]);
    }
  };

  const toggleAllDebts = () => {
    if (selectedDebts.length === debts.length) {
      setSelectedDebts([]);
    } else {
      setSelectedDebts(debts.map(d => d.id));
    }
  };

  const toggleField = (field) => {
    setIncludeFields({ ...includeFields, [field]: !includeFields[field] });
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    const selectedDebtsData = debts.filter(d => selectedDebts.includes(d.id));
    
    const rows = [];
    const headers = [];
    
    if (includeFields.borrowerName) headers.push('שם הלווה');
    if (includeFields.originalAmount) headers.push('סכום מקורי');
    if (includeFields.remainingAmount) headers.push('יתרה נותרת');
    if (includeFields.totalPaid) headers.push('סה"כ שולם');
    if (includeFields.percentPaid) headers.push('אחוז ששולם');
    if (includeFields.paymentPlans) headers.push('תוכניות החזר');
    if (includeFields.payments) headers.push('מספר תשלומים');
    if (includeFields.createdDate) headers.push('תאריך יצירה');
    
    rows.push(headers.join(','));
    
    selectedDebtsData.forEach(debt => {
      const row = [];
      const remaining = calculateRemainingDebt(debt);
      const totalPaid = debt.amount - remaining;
      const percentPaid = debt.amount > 0 ? Math.round((totalPaid / debt.amount) * 100) : 0;
      const debtPayments = payments.filter(p => p.debtId === debt.id);
      
      if (includeFields.borrowerName) row.push(`"${debt.borrowerName}"`);
      if (includeFields.originalAmount) row.push(debt.amount);
      if (includeFields.remainingAmount) row.push(remaining);
      if (includeFields.totalPaid) row.push(totalPaid);
      if (includeFields.percentPaid) row.push(`${percentPaid}%`);
      if (includeFields.paymentPlans) {
        const plans = debt.paymentPlans?.map(p => 
          `${p.monthlyAmount}₪/חודש (${p.startDate}${p.endDate ? ` - ${p.endDate}` : ' - ללא הגבלה'})`
        ).join('; ') || 'אין';
        row.push(`"${plans}"`);
      }
      if (includeFields.payments) row.push(debtPayments.length);
      if (includeFields.createdDate) row.push(new Date(debt.created_date).toLocaleDateString('he-IL'));
      
      rows.push(row.join(','));
      
      if (includeFields.paymentDates || includeFields.paymentNotes) {
        debtPayments.forEach(payment => {
          const paymentRow = Array(headers.length).fill('');
          let col = 0;
          
          if (includeFields.borrowerName) {
            paymentRow[col] = `"  → תשלום"`;
            col++;
          }
          if (includeFields.originalAmount) col++;
          if (includeFields.remainingAmount) {
            if (includeFields.paymentDates) {
              paymentRow[col] = new Date(payment.date).toLocaleDateString('he-IL');
            }
            col++;
          }
          if (includeFields.totalPaid) {
            paymentRow[col] = payment.amount;
            col++;
          }
          if (includeFields.percentPaid) col++;
          if (includeFields.paymentPlans) col++;
          if (includeFields.payments) col++;
          if (includeFields.createdDate) {
            if (includeFields.paymentNotes && payment.notes) {
              paymentRow[col] = `"${payment.notes}"`;
            }
          }
          
          rows.push(paymentRow.join(','));
        });
      }
    });
    
    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `loan_management_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      setIsExporting(false);
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            ייצוא נתונים ל-CSV
          </DialogTitle>
          <DialogDescription>
            בחר את החובות והשדות שברצונך לייצא
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">בחר חובות לייצוא</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllDebts}
                >
                  {selectedDebts.length === debts.length ? 'בטל הכל' : 'בחר הכל'}
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {debts.map(debt => (
                  <div key={debt.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedDebts.includes(debt.id)}
                      onCheckedChange={() => toggleDebt(debt.id)}
                    />
                    <Label className="cursor-pointer flex-1">
                      {debt.borrowerName} - ₪{debt.amount.toLocaleString('he-IL')}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Label className="text-base font-semibold mb-3 block">בחר שדות לייצוא</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.borrowerName}
                    onCheckedChange={() => toggleField('borrowerName')}
                  />
                  <Label className="cursor-pointer">שם הלווה</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.originalAmount}
                    onCheckedChange={() => toggleField('originalAmount')}
                  />
                  <Label className="cursor-pointer">סכום מקורי</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.remainingAmount}
                    onCheckedChange={() => toggleField('remainingAmount')}
                  />
                  <Label className="cursor-pointer">יתרה נותרת</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.totalPaid}
                    onCheckedChange={() => toggleField('totalPaid')}
                  />
                  <Label className="cursor-pointer">סה"כ שולם</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.percentPaid}
                    onCheckedChange={() => toggleField('percentPaid')}
                  />
                  <Label className="cursor-pointer">אחוז ששולם</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.paymentPlans}
                    onCheckedChange={() => toggleField('paymentPlans')}
                  />
                  <Label className="cursor-pointer">תוכניות החזר</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.payments}
                    onCheckedChange={() => toggleField('payments')}
                  />
                  <Label className="cursor-pointer">מספר תשלומים</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.paymentDates}
                    onCheckedChange={() => toggleField('paymentDates')}
                  />
                  <Label className="cursor-pointer">תאריכי תשלומים</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.paymentNotes}
                    onCheckedChange={() => toggleField('paymentNotes')}
                  />
                  <Label className="cursor-pointer">הערות תשלומים</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={includeFields.createdDate}
                    onCheckedChange={() => toggleField('createdDate')}
                  />
                  <Label className="cursor-pointer">תאריך יצירה</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={exportToCSV}
              disabled={selectedDebts.length === 0 || isExporting}
              className="flex-1 bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מייצא...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 ml-2" />
                  ייצא ({selectedDebts.length} חובות)
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12"
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}