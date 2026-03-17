import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentsList({ payments, onEdit, onDelete }) {
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return (
    <Card className="border-none shadow-xl overflow-hidden bg-white">
      <CardHeader className="border-b bg-gradient-to-l from-gray-50 to-purple-50">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          היסטוריית תשלומים
          <span className="text-sm font-normal text-gray-500">({payments.length} תשלומים)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sortedPayments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <Receipt className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">טרם נוספו תשלומים</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-l from-gray-50 to-blue-50 hover:bg-gradient-to-l">
                  <TableHead className="text-right font-bold text-gray-700">תאריך</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">סכום</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">הערות</TableHead>
                  <TableHead className="text-center font-bold text-gray-700">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {sortedPayments.map((payment, index) => (
                    <motion.tr
                      key={payment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gradient-to-l hover:from-purple-50 hover:to-pink-50 transition-colors border-b"
                    >
                      <TableCell className="font-medium">
                        {new Date(payment.date).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-lg bg-gradient-to-l from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          ₪{payment.amount.toLocaleString('he-IL')}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {payment.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(payment)}
                            className="hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(payment.id)}
                            className="hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}