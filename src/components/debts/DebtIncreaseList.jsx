import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DebtIncreaseList({ increases, onEdit, onDelete }) {
  const sortedIncreases = [...increases].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return (
    <Card className="border-none shadow-xl overflow-hidden bg-white">
      <CardHeader className="border-b bg-gradient-to-l from-orange-50 to-red-50">
        <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-semibold">
          <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          היסטוריית הגדלות חוב
          <span className="text-sm font-normal text-gray-500">({increases.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sortedIncreases.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg">לא בוצעו הגדלות חוב</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-l from-orange-50 to-red-50 hover:bg-gradient-to-l">
                  <TableHead className="text-right font-bold text-gray-700">תאריך</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">סכום הגדלה</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">הערות</TableHead>
                  <TableHead className="text-center font-bold text-gray-700">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {sortedIncreases.map((increase, index) => (
                    <motion.tr
                      key={increase.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gradient-to-l hover:from-orange-50 hover:to-red-50 transition-colors border-b"
                    >
                      <TableCell className="font-medium">
                        {new Date(increase.date).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-base sm:text-lg bg-gradient-to-l from-red-600 to-orange-600 bg-clip-text text-transparent">
                          +₪{increase.amount.toLocaleString('he-IL')}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {increase.notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(increase)}
                            className="hover:bg-blue-100 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(increase.id)}
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