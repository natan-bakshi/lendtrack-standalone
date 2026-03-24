import React, { useState, useEffect } from "react";
import { Debt, Payment, DebtIncrease } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Share2, Edit, Loader2, TrendingUp, TrendingDown, User, Calendar, Trash2 } from "lucide-react";
import PaymentForm from "../components/debts/PaymentForm";
import PaymentsList from "../components/debts/PaymentsList";
import PaymentPlanManager from "../components/debts/PaymentPlanManager";
import DebtIncreaseForm from "../components/debts/DebtIncreaseForm";
import DebtIncreaseList from "../components/debts/DebtIncreaseList";
import ShareModal from "../components/debts/ShareModal";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function DebtDetails() {
  const navigate = useNavigate();
  const { id: debtId } = useParams();
  const queryClient = useQueryClient();

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editPaymentModal, setEditPaymentModal] = useState(null);
  const [editIncreaseModal, setEditIncreaseModal] = useState(null);
  const [showIncreaseForm, setShowIncreaseForm] = useState(false);
  const [planToEditIndex, setPlanToEditIndex] = useState(null);

  useEffect(() => {
    const handleEditPlan = (event) => setPlanToEditIndex(event.detail);
    window.addEventListener('edit-plan', handleEditPlan);
    return () => window.removeEventListener('edit-plan', handleEditPlan);
  }, []);

  const { data: debt, isLoading, isError: isDebtError } = useQuery({
    queryKey: ['debt', debtId],
    queryFn: () => Debt.get(debtId),
    enabled: !!debtId
  });

  const payments = debt?.payments || [];
  const increases = debt?.increases || [];

  const addPaymentMutation = useMutation({
    mutationFn: (data) => Payment.create({ ...data, debtId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debt', debtId] })
  });

  const addIncreaseMutation = useMutation({
    mutationFn: (data) => DebtIncrease.create({ ...data, debtId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', debtId] });
      setShowIncreaseForm(false);
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }) => Payment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', debtId] });
      setEditPaymentModal(null);
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id) => Payment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debt', debtId] })
  });

  const updateIncreaseMutation = useMutation({
    mutationFn: ({ id, data }) => DebtIncrease.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', debtId] });
      setEditIncreaseModal(null);
    }
  });

  const deleteIncreaseMutation = useMutation({
    mutationFn: (id) => DebtIncrease.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debt', debtId] })
  });

  const updateDebtMutation = useMutation({
    mutationFn: (data) => Debt.update(debtId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debt', debtId] })
  });

  const deleteDebtMutation = useMutation({
    mutationFn: () => Debt.delete(debtId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      navigate('/');
    }
  });

  const shareDebtMutation = useMutation({
    mutationFn: (email) => {
      const sharedWith = debt.sharedWith || [];
      if (!sharedWith.includes(email)) {
        return Debt.update(debtId, { ...debt, sharedWith: [...sharedWith, email] });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debt', debtId] })
  });

  const removeShareMutation = useMutation({
    mutationFn: (email) => Debt.update(debtId, { ...debt, sharedWith: (debt.sharedWith || []).filter(e => e !== email) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debt', debtId] })
  });

  const calculateStats = () => {
    let manualPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    let automaticPayments = 0;
    const totalIncreases = increases.reduce((sum, i) => sum + i.amount, 0);

    if (debt?.paymentPlans?.length > 0) {
      const today = new Date();
      debt.paymentPlans.forEach(plan => {
        const startDate = new Date(plan.startDate);
        const endDate = plan.endDate ? new Date(plan.endDate) : null;
        if (startDate > today) return;
        const effectiveEndDate = endDate && endDate < today ? endDate : today;
        const paymentDay = startDate.getDate();
        let monthsElapsed = (effectiveEndDate.getFullYear() - startDate.getFullYear()) * 12 + (effectiveEndDate.getMonth() - startDate.getMonth());
        if (effectiveEndDate.getDate() >= paymentDay) monthsElapsed++;
        automaticPayments += Math.max(0, monthsElapsed) * plan.monthlyAmount;
      });
    }

    const totalPaid = manualPayments + automaticPayments;
    const currentDebt = (debt?.amount || 0) + totalIncreases;
    const remaining = Math.max(0, currentDebt - totalPaid);
    return { manualPayments, automaticPayments, totalPaid, remaining, currentDebt, totalIncreases };
  };

  const handleUpdatePaymentPlans = (plans) => {
    updateDebtMutation.mutate({ ...debt, paymentPlans: plans });
  };

  const getActivePlans = () => {
    if (!debt?.paymentPlans) return [];
    const today = new Date();
    return debt.paymentPlans.filter(p => !p.endDate || new Date(p.endDate) >= today);
  };

  const getHistoricalPlans = () => {
    if (!debt?.paymentPlans) return [];
    const today = new Date();
    return debt.paymentPlans.map((p, i) => ({ ...p, originalIndex: i })).filter(p => p.endDate && new Date(p.endDate) < today);
  };

  if (isDebtError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center p-8">
          <p className="text-red-600 text-lg font-semibold mb-4">שגיאה בטעינת הנתונים</p>
          <Button onClick={() => navigate('/')} variant="outline">חזרה לדף הבית</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !debt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  const stats = calculateStats();
  const historicalPlans = getHistoricalPlans();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />

      <div className="max-w-6xl mx-auto p-3 sm:p-6 relative z-10">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4 sm:mb-6 hover:bg-white/50">
          <ArrowRight className="w-5 h-5 ml-2" />
          חזרה
        </Button>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                  {debt.borrowerName}
                </h1>
              </div>
              <p className="text-gray-600 text-sm sm:text-base px-1">מעקב ועדכון</p>
              {debt.loanDate && (
                <p className="text-gray-500 text-xs sm:text-sm px-1 mt-1">
                  תאריך הלוואה: {new Date(debt.loanDate).toLocaleDateString('he-IL')}
                </p>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setShareModalOpen(true)} className="flex-1 sm:flex-none bg-white/80 hover:bg-white border-2 border-purple-200 hover:border-purple-400 h-10 sm:h-auto text-sm sm:text-base">
                <Share2 className="w-4 h-4 ml-2" />
                שיתוף
              </Button>
              <Button onClick={() => navigate(`/manage?edit=${debtId}`)} className="flex-1 sm:flex-none bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-10 sm:h-auto text-sm sm:text-base">
                <Edit className="w-4 h-4 ml-2" />
                ערוך
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-10">
          {[{ icon: TrendingUp, label: 'סכום מקורי', value: `₪${debt.amount.toLocaleString('he-IL')}`, bg: 'bg-white', text: 'text-gray-900', sub: 'text-gray-500', iconColor: 'text-blue-500' },
            { icon: TrendingDown, label: 'נותר', value: `₪${stats.remaining.toLocaleString('he-IL')}`, bg: 'bg-gradient-to-br from-red-500 to-pink-500', text: 'text-white', sub: 'text-white/80', iconColor: 'text-white/80' },
            { icon: TrendingUp, label: 'הוחזר', value: `₪${stats.totalPaid.toLocaleString('he-IL')}`, bg: 'bg-gradient-to-br from-green-500 to-emerald-500', text: 'text-white', sub: 'text-white/80', iconColor: 'text-white/80' },
            { icon: null, label: 'תשלומים', value: payments.length, bg: 'bg-gradient-to-br from-indigo-500 to-purple-500', text: 'text-white', sub: 'text-white/80', iconColor: '' }
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }}>
              <Card className={`border-none shadow-lg overflow-hidden ${stat.bg}`}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {stat.icon && <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />}
                    <p className={`text-xs sm:text-sm font-medium ${stat.sub}`}>{stat.label}</p>
                  </div>
                  <p className={`text-xl sm:text-2xl font-bold truncate ${stat.text}`}>{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mb-6 sm:mb-10" data-payment-plan-manager>
          <PaymentPlanManager
            paymentPlans={debt.paymentPlans || []}
            onUpdate={handleUpdatePaymentPlans}
            editIndex={planToEditIndex}
            onEditComplete={() => setPlanToEditIndex(null)}
          />
        </div>

        <div className="mb-6 sm:mb-10">
          {!showIncreaseForm ? (
            <Button onClick={() => setShowIncreaseForm(true)} className="w-full h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-l from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg">
              <TrendingUp className="w-5 h-5 ml-2" />
              הגדל חוב
            </Button>
          ) : (
            <DebtIncreaseForm
              onSubmit={(data) => addIncreaseMutation.mutate(data)}
              onCancel={() => setShowIncreaseForm(false)}
              isSubmitting={addIncreaseMutation.isPending}
            />
          )}
        </div>

        {increases.length > 0 && (
          <div className="mb-6 sm:mb-10">
            <DebtIncreaseList increases={increases} onEdit={(i) => setEditIncreaseModal(i)} onDelete={(id) => { if (confirm('האם אתה בטוח?')) deleteIncreaseMutation.mutate(id); }} />
          </div>
        )}

        <div className="mb-6 sm:mb-10">
          <PaymentForm onSubmit={(data) => addPaymentMutation.mutate(data)} isSubmitting={addPaymentMutation.isPending} />
        </div>

        <PaymentsList
          payments={payments}
          onEdit={(p) => setEditPaymentModal(p)}
          onDelete={(id) => { if (confirm('האם אתה בטוח שברצונך למחוק את התשלום?')) deletePaymentMutation.mutate(id); }}
        />

        {historicalPlans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 sm:mb-10">
            <Card className="border-none shadow-lg bg-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">היסטוריית תוכניות החזר</h3>
                </div>
                <div className="space-y-3">
                  {historicalPlans.map((plan) => (
                    <div key={plan.originalIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xl font-bold text-gray-600">₪{plan.monthlyAmount.toLocaleString('he-IL')}</span>
                            <span className="text-sm text-gray-500">לחודש</span>
                            <Badge className="bg-gray-200 text-gray-700">הסתיימה</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span>מתאריך: {new Date(plan.startDate).toLocaleDateString('he-IL')}</span>
                            {' • '}
                            <span>עד: {new Date(plan.endDate).toLocaleDateString('he-IL')}</span>
                            {plan.notes && <p className="text-gray-500 italic mt-1">{plan.notes}</p>}
                          </div>
                        </div>
                        <div className="flex sm:flex-col gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100"
                            onClick={() => {
                              document.querySelector('[data-payment-plan-manager]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              window.dispatchEvent(new CustomEvent('edit-plan', { detail: plan.originalIndex }));
                            }}>
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100"
                            onClick={() => {
                              if (confirm('האם למחוק תוכנית החזר זו?')) {
                                handleUpdatePaymentPlans((debt.paymentPlans || []).filter((_, i) => i !== plan.originalIndex));
                              }
                            }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          debt={debt}
          onShare={(email) => shareDebtMutation.mutate(email)}
          onRemoveShare={(email) => removeShareMutation.mutate(email)}
        />

        {editPaymentModal && (
          <Dialog open={!!editPaymentModal} onOpenChange={() => setEditPaymentModal(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>עריכת תשלום</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div><Label>סכום</Label><Input type="number" defaultValue={editPaymentModal.amount} id="edit-payment-amount" className="h-12" /></div>
                <div><Label>תאריך</Label><Input type="date" defaultValue={editPaymentModal.date} id="edit-payment-date" className="h-12" /></div>
                <div><Label>הערות</Label><Input defaultValue={editPaymentModal.notes} id="edit-payment-notes" className="h-12" /></div>
                <Button className="w-full h-12" onClick={() => updatePaymentMutation.mutate({
                  id: editPaymentModal.id,
                  data: {
                    amount: parseFloat(document.getElementById('edit-payment-amount').value),
                    date: document.getElementById('edit-payment-date').value,
                    notes: document.getElementById('edit-payment-notes').value,
                    debtId
                  }
                })}>עדכן</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {editIncreaseModal && (
          <Dialog open={!!editIncreaseModal} onOpenChange={() => setEditIncreaseModal(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>עריכת הגדלת חוב</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div><Label>סכום</Label><Input type="number" defaultValue={editIncreaseModal.amount} id="edit-increase-amount" className="h-12" /></div>
                <div><Label>תאריך</Label><Input type="date" defaultValue={editIncreaseModal.date} id="edit-increase-date" className="h-12" /></div>
                <div><Label>הערות</Label><Input defaultValue={editIncreaseModal.notes} id="edit-increase-notes" className="h-12" /></div>
                <Button className="w-full h-12" onClick={() => updateIncreaseMutation.mutate({
                  id: editIncreaseModal.id,
                  data: {
                    amount: parseFloat(document.getElementById('edit-increase-amount').value),
                    date: document.getElementById('edit-increase-date').value,
                    notes: document.getElementById('edit-increase-notes').value,
                    debtId
                  }
                })}>עדכן</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
