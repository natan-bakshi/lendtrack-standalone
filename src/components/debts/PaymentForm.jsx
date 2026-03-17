import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentForm({ onSubmit, isSubmitting }) {
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
      <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-300/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-pink-300/30 to-transparent rounded-full blur-3xl" />
        
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Plus className="w-6 h-6 text-white" />
            </div>
            הוספת תשלום חדש
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="amount" className="text-base font-semibold text-gray-700">סכום התשלום</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="הזן סכום"
                  className="text-lg h-12 border-2 border-purple-200 focus:border-purple-500 bg-white/80"
                  required
                />
              </div>
              <div>
                <Label htmlFor="date" className="text-base font-semibold text-gray-700">תאריך</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="text-lg h-12 border-2 border-purple-200 focus:border-purple-500 bg-white/80"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="text-base font-semibold text-gray-700">הערות (אופציונלי)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="פרטים נוספים על התשלום"
                rows={3}
                className="border-2 border-purple-200 focus:border-purple-500 resize-none bg-white/80"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "מוסיף..." : "הוסף תשלום"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}