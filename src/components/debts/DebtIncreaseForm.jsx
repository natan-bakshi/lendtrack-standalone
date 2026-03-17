import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, X } from "lucide-react";
import { motion } from "framer-motion";

export default function DebtIncreaseForm({ onSubmit, onCancel, isSubmitting }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !date) return;
    
    onSubmit({
      amount: parseFloat(amount),
      date,
      notes
    });

    setAmount("");
    setDate(new Date().toISOString().split('T')[0]);
    setNotes("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-none shadow-xl bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-red-300/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-orange-300/30 to-transparent rounded-full blur-3xl" />
        
        <CardHeader className="relative z-10">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-semibold">
              <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              הגדלת חוב
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="hover:bg-red-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Label htmlFor="increase-amount" className="text-sm sm:text-base font-semibold text-gray-700">סכום ההגדלה</Label>
                <Input
                  id="increase-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="הזן סכום"
                  className="text-base sm:text-lg h-10 sm:h-12 border-2 border-red-200 focus:border-red-500 bg-white/80"
                  required
                />
              </div>
              <div>
                <Label htmlFor="increase-date" className="text-sm sm:text-base font-semibold text-gray-700">תאריך</Label>
                <Input
                  id="increase-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-base sm:text-lg h-10 sm:h-12 border-2 border-red-200 focus:border-red-500 bg-white/80"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="increase-notes" className="text-sm sm:text-base font-semibold text-gray-700">הערות (אופציונלי)</Label>
              <Textarea
                id="increase-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="פרטים על ההגדלה"
                rows={3}
                className="border-2 border-red-200 focus:border-red-500 resize-none bg-white/80"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold bg-gradient-to-l from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "מוסיף..." : "הגדל חוב"}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-bold"
              >
                ביטול
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}