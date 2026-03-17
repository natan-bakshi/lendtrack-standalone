import React, { useState } from "react";
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
import { UserPlus, Trash2, Users } from "lucide-react";

export default function ShareModal({ isOpen, onClose, debt, onShare, onRemoveShare }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleShare = async () => {
    if (!email || !email.includes('@')) return;
    
    setIsSubmitting(true);
    await onShare(email);
    setEmail("");
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            שיתוף חוב
          </DialogTitle>
          <DialogDescription>
            הוסף משתמשים שיוכלו לצפות ולערוך את החוב הזה
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל משתמש</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="flex-1"
              />
              <Button 
                onClick={handleShare}
                disabled={isSubmitting || !email}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {debt?.sharedWith && debt.sharedWith.length > 0 && (
            <div className="space-y-2">
              <Label>משתמשים משותפים</Label>
              <div className="space-y-2">
                {debt.sharedWith.map((userEmail) => (
                  <div 
                    key={userEmail}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm">{userEmail}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveShare(userEmail)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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