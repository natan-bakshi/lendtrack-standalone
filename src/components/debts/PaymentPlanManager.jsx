
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar, Edit2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function PaymentPlanManager({ paymentPlans = [], onUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    monthlyAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });

  useEffect(() => {
    const handleEditPlan = (event) => {
      // Ensure the event detail is a valid index
      if (typeof event.detail === 'number' && event.detail >= 0 && event.detail < paymentPlans.length) {
        handleEdit(event.detail);
      } else {
        console.warn("Received invalid index for 'edit-plan' event:", event.detail);
      }
    };

    window.addEventListener('edit-plan', handleEditPlan);
    return () => window.removeEventListener('edit-plan', handleEditPlan);
  }, [paymentPlans]); // Re-run effect if paymentPlans array changes to update handleEdit closure

  const handleAdd = () => {
    if (!formData.monthlyAmount || !formData.startDate) return;
    
    const newPlans = [...paymentPlans, {
      monthlyAmount: parseFloat(formData.monthlyAmount),
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      notes: formData.notes
    }];
    
    onUpdate(newPlans);
    setFormData({ monthlyAmount: '', startDate: new Date().toISOString().split('T')[0], endDate: '', notes: '' });
    setIsAdding(false);
  };

  const handleEdit = (index) => {
    const plan = paymentPlans[index];
    setFormData({
      monthlyAmount: plan.monthlyAmount,
      startDate: plan.startDate,
      endDate: plan.endDate || '',
      notes: plan.notes || ''
    });
    setEditingIndex(index);
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!formData.monthlyAmount || !formData.startDate) return;
    
    const newPlans = [...paymentPlans];
    newPlans[editingIndex] = {
      monthlyAmount: parseFloat(formData.monthlyAmount),
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      notes: formData.notes
    };
    
    onUpdate(newPlans);
    setFormData({ monthlyAmount: '', startDate: new Date().toISOString().split('T')[0], endDate: '', notes: '' });
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    if (confirm('האם למחוק תוכנית החזר זו?')) {
      const newPlans = paymentPlans.filter((_, i) => i !== index);
      onUpdate(newPlans);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setFormData({ monthlyAmount: '', startDate: new Date().toISOString().split('T')[0], endDate: '', notes: '' });
  };

  const getActivePlans = () => {
    const today = new Date();
    // Set time to 00:00:00 to compare dates only, ignoring time component
    today.setHours(0, 0, 0, 0); 
    return paymentPlans.map((plan, index) => ({
      ...plan,
      originalIndex: index,
      // A plan is active if it has no end date, or if its end date is today or in the future
      isActive: !plan.endDate || new Date(plan.endDate).setHours(0,0,0,0) >= today.getTime()
    })).filter(plan => plan.isActive);
  };

  const activePlans = getActivePlans();

  return (
    <Card className="border-none shadow-xl bg-white" data-payment-plan-manager>
      <CardHeader className="border-b bg-gradient-to-l from-indigo-50 to-purple-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-semibold">
            <Calendar className="w-5 h-5" />
            תוכניות החזר חודשיות
          </CardTitle>
          {!isAdding && editingIndex === null && (
            <Button 
              onClick={() => setIsAdding(true)}
              size="sm"
              className="bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף תוכנית
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4">
        <AnimatePresence>
          {(isAdding || editingIndex !== null) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border-2 border-purple-200"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm sm:text-base">סכום חודשי *</Label>
                    <Input
                      type="number"
                      value={formData.monthlyAmount}
                      onChange={(e) => setFormData({...formData, monthlyAmount: e.target.value})}
                      placeholder="סכום"
                      className="h-10 sm:h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base">תאריך התחלה *</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="h-10 sm:h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base">תאריך סיום (אופציונלי)</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      placeholder="ללא הגבלה"
                      className="h-10 sm:h-12"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm sm:text-base">הערות</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="פרטים על תוכנית ההחזר"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={editingIndex !== null ? handleUpdate : handleAdd}
                    className="flex-1 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Check className="w-4 h-4 ml-2" />
                    {editingIndex !== null ? 'עדכן' : 'הוסף'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 ml-2" />
                    ביטול
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activePlans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm sm:text-base">אין תוכניות החזר פעילות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activePlans.map((plan) => (
              <motion.div
                key={plan.originalIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-gray-800">
                        ₪{plan.monthlyAmount.toLocaleString('he-IL')}
                      </span>
                      <span className="text-sm text-gray-500">לחודש</span>
                      <Badge className="bg-green-100 text-green-700">פעילה</Badge>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span>התחלה: {new Date(plan.startDate).toLocaleDateString('he-IL')}</span>
                        {plan.endDate ? (
                          <span>סיום: {new Date(plan.endDate).toLocaleDateString('he-IL')}</span>
                        ) : (
                          <span className="text-purple-600 font-medium">ללא הגבלה</span>
                        )}
                      </div>
                      {plan.notes && (
                        <p className="text-gray-500 italic break-words">{plan.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(plan.originalIndex)}
                      className="h-8 w-8 hover:bg-blue-100"
                      disabled={isAdding || editingIndex !== null}
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(plan.originalIndex)}
                      className="h-8 w-8 hover:bg-red-100"
                      disabled={isAdding || editingIndex !== null}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
