import React, { useState } from "react";
import { Debt } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2, Wallet, Users, Menu, Download, LogOut } from "lucide-react";
import DebtCard from "../components/debts/DebtCard";
import AccountShareModal from "../components/debts/AccountShareModal";
import ExportModal from "../components/export/ExportModal";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => Debt.list(),
    enabled: !!user
  });

  // Flatten all payments and increases from debts
  const payments = debts.flatMap(d => d.payments || []);
  const increases = debts.flatMap(d => d.increases || []);

  const calculateRemainingDebt = (debt) => {
    const debtPayments = (debt.payments || []);
    let totalPaid = debtPayments.reduce((sum, p) => sum + p.amount, 0);
    const debtIncreases = (debt.increases || []);
    const totalIncreases = debtIncreases.reduce((sum, i) => sum + i.amount, 0);

    if (debt.paymentPlans && debt.paymentPlans.length > 0) {
      const today = new Date();
      debt.paymentPlans.forEach(plan => {
        const startDate = new Date(plan.startDate);
        const endDate = plan.endDate ? new Date(plan.endDate) : null;
        if (startDate > today) return;
        const effectiveEndDate = endDate && endDate < today ? endDate : today;
        const paymentDay = startDate.getDate();
        const yearDiff = effectiveEndDate.getFullYear() - startDate.getFullYear();
        const monthDiff = effectiveEndDate.getMonth() - startDate.getMonth();
        let monthsElapsed = yearDiff * 12 + monthDiff;
        if (effectiveEndDate.getDate() >= paymentDay) monthsElapsed++;
        monthsElapsed = Math.max(0, monthsElapsed);
        totalPaid += monthsElapsed * plan.monthlyAmount;
      });
    }

    const currentDebt = debt.amount + totalIncreases;
    return Math.max(0, currentDebt - totalPaid);
  };

  const totalRemaining = debts.reduce((sum, debt) => sum + calculateRemainingDebt(debt), 0);

  const handleLogout = async () => {
    if (confirm('האם אתה בטוח שברצונך לצאת מהחשבון?')) {
      await logout();
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <button
        onClick={handleLogout}
        className="absolute top-4 left-4 z-50 flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
      >
        <LogOut className="w-4 h-4" />
        יציאה
      </button>

      <div className="max-w-7xl mx-auto p-3 sm:p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12 pt-4 sm:pt-8"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-2 sm:mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.02em' }}>
            <span className="bg-gradient-to-l from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              LendTrack
            </span>
          </h1>
          <p className="text-gray-600 text-base sm:text-xl font-medium px-4">Financial Management System</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <Card className="border-none shadow-xl sm:shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 relative">
            <CardContent className="p-6 sm:p-10 relative z-10">
              <div className="flex flex-col gap-6">
                <div className="text-center sm:text-right">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                    <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-purple-300" />
                    <p className="text-purple-200 text-base sm:text-lg font-medium">יתרה כוללת</p>
                  </div>
                  <div className="flex items-baseline justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tight"
                    >
                      {totalRemaining.toLocaleString('he-IL')}
                    </motion.span>
                    <span className="text-3xl sm:text-4xl font-bold text-purple-300">₪</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center border border-white/20">
                    <p className="text-purple-200 text-sm mb-1">הלוואות פעילות</p>
                    <p className="text-4xl sm:text-5xl font-black text-white">{debts.length}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-1">
                    <Button
                      onClick={() => navigate(createPageUrl('ManageDebts'))}
                      size="lg"
                      className="bg-white text-purple-900 hover:bg-purple-50 font-bold text-base sm:text-lg shadow-xl h-12 sm:h-auto"
                    >
                      <Plus className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                      הלוואה חדשה
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShareModalOpen(true)}
                        variant="outline"
                        size="lg"
                        className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold text-sm sm:text-base h-10 sm:h-auto"
                      >
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        שיתוף
                      </Button>
                      <Button
                        onClick={() => setExportModalOpen(true)}
                        variant="outline"
                        size="lg"
                        className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold text-sm sm:text-base h-10 sm:h-auto"
                      >
                        <Download className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                        ייצוא
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6 px-2">
            <Menu className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">ההלוואות שלי</h2>
          </div>

          {debts.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-8 sm:p-16 text-center border-2 border-dashed border-purple-200 bg-white/50 backdrop-blur-sm">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2 sm:mb-3">אין הלוואות רשומות</h3>
                <p className="text-gray-500 mb-6 sm:mb-8 text-base sm:text-lg px-4">התחל לעקוב אחר הלוואות</p>
                <Button
                  onClick={() => navigate(createPageUrl('ManageDebts'))}
                  size="lg"
                  className="bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-12 sm:h-auto text-base sm:text-lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  הלוואה ראשונה
                </Button>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {debts.map((debt, index) => {
                const remaining = calculateRemainingDebt(debt);
                const debtIncreases = debt.increases || [];
                const totalIncreases = debtIncreases.reduce((sum, i) => sum + i.amount, 0);
                const currentDebt = debt.amount + totalIncreases;
                const percentPaid = currentDebt > 0
                  ? Math.round(((currentDebt - remaining) / currentDebt) * 100)
                  : 0;

                return (
                  <motion.div
                    key={debt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <DebtCard
                      debt={debt}
                      remainingAmount={remaining}
                      percentPaid={percentPaid}
                      onClick={() => navigate(`/debt/${debt.id}`)}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AccountShareModal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} />
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        debts={debts}
        payments={payments}
        calculateRemainingDebt={calculateRemainingDebt}
        increases={increases}
      />
    </div>
  );
}
