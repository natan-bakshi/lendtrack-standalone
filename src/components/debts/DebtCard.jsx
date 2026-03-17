import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar, User, Banknote, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function DebtCard({ debt, remainingAmount, percentPaid, onClick }) {
  const getGradientColor = (percent) => {
    if (percent < 30) return "from-rose-500 to-pink-500";
    if (percent < 60) return "from-amber-500 to-orange-500";
    return "from-emerald-500 to-teal-500";
  };

  const activePaymentPlans = debt.paymentPlans?.filter(plan => {
    const today = new Date();
    const startDate = new Date(plan.startDate);
    const endDate = plan.endDate ? new Date(plan.endDate) : null;
    return startDate <= today && (!endDate || endDate >= today);
  }) || [];

  const totalMonthly = activePaymentPlans.reduce((sum, plan) => sum + plan.monthlyAmount, 0);

  const calculateTimeToFinish = () => {
    if (totalMonthly === 0 || remainingAmount === 0) return null;
    
    const monthsLeft = Math.ceil(remainingAmount / totalMonthly);
    
    if (monthsLeft === 1) return "חודש אחד";
    if (monthsLeft < 12) return `${monthsLeft} חודשים`;
    
    const years = Math.floor(monthsLeft / 12);
    const months = monthsLeft % 12;
    
    if (months === 0) {
      return years === 1 ? "שנה אחת" : `${years} שנים`;
    }
    
    const yearsText = years === 1 ? "שנה" : `${years} שנים`;
    const monthsText = months === 1 ? "חודש" : `${months} חודשים`;
    
    return `${yearsText} ו-${monthsText}`;
  };

  const timeToFinish = calculateTimeToFinish();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        className="cursor-pointer overflow-hidden bg-white border-none shadow-lg hover:shadow-2xl transition-all duration-500 relative group"
        onClick={onClick}
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-blue-200/30 to-cyan-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        
        <div className="relative p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                  {debt.borrowerName}
                </h3>
              </div>
              {debt.paymentPlans?.[0]?.startDate && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{new Date(debt.paymentPlans[0].startDate).toLocaleDateString('he-IL')}</span>
                </div>
              )}
            </div>
            
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="30"
                  stroke="#E5E7EB"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="30"
                  stroke="url(#gradient)"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - percentPaid / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-gray-700">{percentPaid}%</span>
              </div>
            </div>
          </div>

          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">נותר להחזיר</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-4xl font-black bg-gradient-to-l from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {remainingAmount.toLocaleString('he-IL')}
              </span>
              <span className="text-lg sm:text-xl font-semibold text-gray-400">₪</span>
            </div>
          </div>

          {totalMonthly > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-l from-indigo-50 to-purple-50 rounded-full border border-purple-200 mb-3">
              <Banknote className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-purple-700 whitespace-nowrap">
                ₪{totalMonthly.toLocaleString('he-IL')} לחודש
              </span>
            </div>
          )}

          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>הוחזר {percentPaid}%</span>
              <span className="truncate mr-2">מתוך ₪{debt.amount.toLocaleString('he-IL')}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${percentPaid}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full bg-gradient-to-l ${getGradientColor(percentPaid)} rounded-full`}
              />
            </div>
          </div>

          {timeToFinish && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-600 bg-blue-50 rounded-lg py-2 px-3">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium">סיום משוער: {timeToFinish}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}