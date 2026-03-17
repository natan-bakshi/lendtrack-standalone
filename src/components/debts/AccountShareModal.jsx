import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2, Users, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function AccountShareModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [sharedWithUsers, setSharedWithUsers] = useState([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const allUsers = await base44.entities.User.list();
      const usersWithMyAccess = allUsers.filter(u => 
        u.sharedAccountsWith?.includes(currentUser.email)
      );
      setSharedWithUsers(usersWithMyAccess.map(u => u.email));
    };
    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  const handleShare = async () => {
    if (!email || !email.includes('@')) return;
    
    setIsSubmitting(true);
    
    try {
      const allUsers = await base44.entities.User.list();
      const targetUser = allUsers.find(u => u.email === email);
      
      if (!targetUser) {
        alert('משתמש לא נמצא במערכת');
        setIsSubmitting(false);
        return;
      }
      
      const targetSharedAccountsWith = targetUser.sharedAccountsWith || [];
      if (!targetSharedAccountsWith.includes(user.email)) {
        await base44.entities.User.update(targetUser.id, {
          sharedAccountsWith: [...targetSharedAccountsWith, user.email]
        });
      }
      
      const allDebts = await base44.entities.Debt.list();
      const myDebts = allDebts.filter(debt => debt.created_by === user.email);
      
      for (const debt of myDebts) {
        const currentSharedWith = debt.sharedWith || [];
        if (!currentSharedWith.includes(email)) {
          await base44.entities.Debt.update(debt.id, {
            sharedWith: [...currentSharedWith, email]
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      
      setSharedWithUsers([...sharedWithUsers, email]);
      setEmail("");
    } catch (error) {
      console.error('Error sharing account:', error);
      alert('שגיאה בשיתוף החשבון');
    }
    
    setIsSubmitting(false);
  };

  const handleRemove = async (emailToRemove) => {
    setIsSubmitting(true);
    
    try {
      const allUsers = await base44.entities.User.list();
      const targetUser = allUsers.find(u => u.email === emailToRemove);
      
      if (targetUser) {
        const targetSharedAccountsWith = (targetUser.sharedAccountsWith || []).filter(e => e !== user.email);
        await base44.entities.User.update(targetUser.id, {
          sharedAccountsWith: targetSharedAccountsWith
        });
      }
      
      const allDebts = await base44.entities.Debt.list();
      const myDebts = allDebts.filter(debt => debt.created_by === user.email);
      
      for (const debt of myDebts) {
        const currentSharedWith = (debt.sharedWith || []).filter(e => e !== emailToRemove);
        await base44.entities.Debt.update(debt.id, {
          sharedWith: currentSharedWith
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      
      setSharedWithUsers(sharedWithUsers.filter(e => e !== emailToRemove));
    } catch (error) {
      console.error('Error removing share:', error);
      alert('שגיאה בהסרת השיתוף');
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="w-5 h-5" />
            שיתוף חשבון מלא
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            תן למשתמשים אחרים גישה לכל ההלוואות שלך. הם יוכלו לראות ולערוך את כל החובות
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">אימייל משתמש</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="flex-1 h-10 sm:h-12"
                disabled={isSubmitting}
              />
              <Button 
                onClick={handleShare}
                disabled={isSubmitting || !email}
                className="bg-blue-600 hover:bg-blue-700 px-3 sm:px-4"
                size="icon"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {sharedWithUsers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">משתמשים עם גישה לחשבון שלך</Label>
              <div className="space-y-2">
                {sharedWithUsers.map((userEmail) => (
                  <div 
                    key={userEmail}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm truncate flex-1 mr-2">{userEmail}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(userEmail)}
                      disabled={isSubmitting}
                      className="flex-shrink-0"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}