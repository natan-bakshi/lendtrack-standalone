import React, { useState } from 'react';
import { auth } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const { error } = await auth.signInWithEmail(email, password);
        if (error) throw error;
      } else {
        const { error } = await auth.signUpWithEmail(email, password);
        if (error) throw error;
        setMessage('נשלח אימייל אימות — בדוק את תיבת הדואר שלך');
      }
    } catch (err) {
      setError(err.message || 'שגיאה בכניסה');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await auth.signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'שגיאה בכניסה עם Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-l from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
            LendTrack
          </h1>
          <p className="text-gray-500">מערכת ניהול הלוואות</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Google */}
            <Button
              onClick={handleGoogle}
              disabled={loading}
              variant="outline"
              className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50"
            >
              <Chrome className="w-5 h-5 ml-2" />
              המשך עם Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">או</span>
              </div>
            </div>

            {/* Email/Password */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <Label htmlFor="email">אימייל</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pr-9"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">סיסמא</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
                    className="pr-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              {message && (
                <p className="text-green-600 text-sm text-center">{message}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-bold bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'כניסה' : 'הרשמה')}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500">
              {mode === 'login' ? 'אין לך חשבון?' : 'כבר יש לך חשבון?'}{' '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}
                className="text-purple-600 font-semibold hover:underline"
              >
                {mode === 'login' ? 'הרשמה' : 'כניסה'}
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
