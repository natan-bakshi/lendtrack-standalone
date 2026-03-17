
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Save, Trash2, Edit, Wallet } from "lucide-react";
import { motion } from "framer-motion";

export default function ManageDebts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    borrowerName: '',
    amount: '',
    loanDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        await base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: debts = [] } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      if (!user) return [];
      const allDebts = await base44.entities.Debt.list('-created_date');
      return allDebts.filter(debt => debt.created_by === user.email);
    },
    enabled: !!user
  });

  useEffect(() => {
    if (editId && debts.length > 0) {
      const debt = debts.find(d => d.id === editId);
      if (debt) {
        setFormData({
          borrowerName: debt.borrowerName,
          amount: debt.amount,
          loanDate: debt.loanDate || new Date().toISOString().split('T')[0]
        });
      }
    }
  }, [editId, debts]);

  const createDebtMutation = useMutation({
    mutationFn: async (data) => {
      const allUsers = await base44.entities.User.list();
      const usersWithMyAccess = allUsers.filter(u => 
        u.sharedAccountsWith?.includes(user.email)
      );
      const sharedWith = usersWithMyAccess.map(u => u.email);
      
      return base44.entities.Debt.create({
        borrowerName: data.borrowerName,
        amount: data.amount,
        loanDate: data.loanDate,
        paymentPlans: [],
        sharedWith
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      navigate(createPageUrl('Dashboard'));
    }
  });

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }) => {
      return base44.entities.Debt.update(id, {
        borrowerName: data.borrowerName,
        amount: data.amount,
        loanDate: data.loanDate,
        paymentPlans: data.paymentPlans || [],
        sharedWith: data.sharedWith || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      navigate(createPageUrl('Dashboard'));
    }
  });

  const deleteDebtMutation = useMutation({
    mutationFn: async (id) => {
      const allPayments = await base44.entities.Payment.list();
      const debtPayments = allPayments.filter(p => p.debtId === id);
      for (const payment of debtPayments) {
        await base44.entities.Payment.delete(payment.id);
      }
      
      const allIncreases = await base44.entities.DebtIncrease.list();
      const debtIncreases = allIncreases.filter(i => i.debtId === id);
      for (const increase of debtIncreases) {
        await base44.entities.DebtIncrease.delete(increase.id);
      }
      
      return base44.entities.Debt.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      navigate(createPageUrl('Dashboard'));
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const debt = editId ? debts.find(d => d.id === editId) : null;
    
    const data = {
      borrowerName: formData.borrowerName,
      amount: parseFloat(formData.amount),
      loanDate: formData.loanDate,
      paymentPlans: debt?.paymentPlans || [],
      sharedWith: debt?.sharedWith || [] 
    };

    if (editId) {
      updateDebtMutation.mutate({ id: editId, data });
    } else {
      createDebtMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (confirm('⚠️ אזהרה: פעולה זו תמחק את החוב וגם את כל התשלומים וההגדלות המשויכים אליו. האם אתה בטוח שברצונך להמשיך?')) {
      deleteDebtMutation.mutate(id);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto p-3 sm:p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="mb-4 sm:mb-6 hover:bg-white/50"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            חזרה
          </Button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-l from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {editId ? 'עריכת פרטים' : 'ניהול הלוואות'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base px-1">
            {editId ? 'עדכן את פרטי ההלוואה' : 'הוסף וערוך הלוואות'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 sm:mb-10 border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-l from-purple-50 to-pink-50 border-b p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold">
                {editId ? 'עדכון פרטים' : 'הלוואה חדשה'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label htmlFor="borrowerName" className="text-sm sm:text-base font-semibold">שם הלווה *</Label>
                    <Input
                      id="borrowerName"
                      value={formData.borrowerName}
                      onChange={(e) => setFormData({...formData, borrowerName: e.target.value})}
                      placeholder="שם מלא"
                      className="h-10 sm:h-12 text-base sm:text-lg border-2 border-purple-200 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-sm sm:text-base font-semibold">סכום ההלוואה *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="סכום"
                      className="h-10 sm:h-12 text-base sm:text-lg border-2 border-purple-200 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="loanDate" className="text-sm sm:text-base font-semibold">תאריך ההלוואה</Label>
                    <Input
                      id="loanDate"
                      type="date"
                      value={formData.loanDate}
                      onChange={(e) => setFormData({...formData, loanDate: e.target.value})}
                      className="h-10 sm:h-12 text-base sm:text-lg border-2 border-purple-200 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit"
                    className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    disabled={createDebtMutation.isPending || updateDebtMutation.isPending}
                  >
                    <Save className="w-5 h-5 ml-2" />
                    {editId ? 'עדכן' : 'הוסף'}
                  </Button>
                  
                  {editId && (
                    <Button 
                      type="button"
                      variant="ghost"
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold h-12 sm:h-14 px-6"
                      onClick={() => handleDelete(editId)}
                      disabled={deleteDebtMutation.isPending}
                    >
                      <Trash2 className="w-5 h-5" />
                      מחק חוב
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {!editId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-l from-purple-50 to-pink-50 border-b p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-semibold">ההלוואות שלי ({debts.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {debts.length === 0 ? (
                  <div className="text-center py-12 sm:py-16">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500" />
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg">טרם נוספו הלוואות</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {debts.map((debt, index) => (
                      <motion.div
                        key={debt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 border-2 border-purple-100 rounded-xl hover:bg-gradient-to-l hover:from-purple-50 hover:to-pink-50 hover:border-purple-300 transition-all gap-3"
                      >
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <h3 className="font-bold text-base sm:text-lg text-gray-800 truncate">{debt.borrowerName}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            סכום: <span className="font-semibold">₪{debt.amount.toLocaleString('he-IL')}</span>
                            {debt.loanDate && (
                              <> • תאריך: {new Date(debt.loanDate).toLocaleDateString('he-IL')}</>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(createPageUrl('ManageDebts', `?edit=${debt.id}`))}
                            className="hover:bg-blue-100 hover:border-blue-300 flex-1 sm:flex-none h-10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
