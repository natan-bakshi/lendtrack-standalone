import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// AUTH
// =============================================
export const auth = {
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  signInWithGoogle: async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  },
  signInWithEmail: async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  },
  signUpWithEmail: async (email, password) => {
    return supabase.auth.signUp({ email, password });
  },
  signOut: async () => {
    return supabase.auth.signOut();
  },
  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }
};

// =============================================
// DEBTS
// =============================================
export const Debt = {
  list: async () => {
    const { data, error } = await supabase
      .from('debts')
      .select(`
        *,
        payment_plans(*),
        payments(*),
        debt_increases(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(normalizeDebt);
  },

  get: async (id) => {
    const { data, error } = await supabase
      .from('debts')
      .select(`
        *,
        payment_plans(*),
        payments(*),
        debt_increases(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return normalizeDebt(data);
  },

  create: async (debtData) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { paymentPlans, ...rest } = debtData;

    const { data: debt, error } = await supabase
      .from('debts')
      .insert({
        user_id: user.id,
        borrower_name: rest.borrowerName,
        amount: rest.amount,
        loan_date: rest.loanDate || null,
        shared_with: rest.sharedWith || []
      })
      .select()
      .single();
    if (error) throw error;

    if (paymentPlans?.length) {
      await supabase.from('payment_plans').insert(
        paymentPlans.map(p => ({
          debt_id: debt.id,
          monthly_amount: p.monthlyAmount,
          start_date: p.startDate,
          end_date: p.endDate || null,
          notes: p.notes || null
        }))
      );
    }
    return Debt.get(debt.id);
  },

  update: async (id, debtData) => {
    const { paymentPlans, ...rest } = debtData;

    const { error } = await supabase
      .from('debts')
      .update({
        borrower_name: rest.borrowerName,
        amount: rest.amount,
        loan_date: rest.loanDate || null,
        shared_with: rest.sharedWith || []
      })
      .eq('id', id);
    if (error) throw error;

    if (paymentPlans !== undefined) {
      await supabase.from('payment_plans').delete().eq('debt_id', id);
      if (paymentPlans.length) {
        await supabase.from('payment_plans').insert(
          paymentPlans.map(p => ({
            debt_id: id,
            monthly_amount: p.monthlyAmount,
            start_date: p.startDate,
            end_date: p.endDate || null,
            notes: p.notes || null
          }))
        );
      }
    }
    return Debt.get(id);
  },

  delete: async (id) => {
    // Cascade מטפל ב-payments, payment_plans, debt_increases
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
  }
};

// =============================================
// PAYMENTS
// =============================================
export const Payment = {
  create: async (paymentData) => {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        debt_id: paymentData.debtId,
        amount: paymentData.amount,
        date: paymentData.date,
        notes: paymentData.notes || null
      })
      .select()
      .single();
    if (error) throw error;
    return normalizePayment(data);
  },

  update: async (id, paymentData) => {
    const { data, error } = await supabase
      .from('payments')
      .update({
        amount: paymentData.amount,
        date: paymentData.date,
        notes: paymentData.notes || null
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return normalizePayment(data);
  },

  delete: async (id) => {
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) throw error;
  }
};

// =============================================
// DEBT INCREASES
// =============================================
export const DebtIncrease = {
  create: async (data) => {
    const { data: result, error } = await supabase
      .from('debt_increases')
      .insert({
        debt_id: data.debtId,
        amount: data.amount,
        date: data.date,
        notes: data.notes || null
      })
      .select()
      .single();
    if (error) throw error;
    return normalizeIncrease(result);
  },

  update: async (id, data) => {
    const { data: result, error } = await supabase
      .from('debt_increases')
      .update({
        amount: data.amount,
        date: data.date,
        notes: data.notes || null
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return normalizeIncrease(result);
  },

  delete: async (id) => {
    const { error } = await supabase.from('debt_increases').delete().eq('id', id);
    if (error) throw error;
  }
};

// =============================================
// NORMALIZERS — snake_case → camelCase
// =============================================
function normalizeDebt(d) {
  return {
    id: d.id,
    borrowerName: d.borrower_name,
    amount: Number(d.amount),
    loanDate: d.loan_date,
    sharedWith: d.shared_with || [],
    created_by: d.user_id,
    created_date: d.created_at,
    paymentPlans: (d.payment_plans || []).map(p => ({
      id: p.id,
      monthlyAmount: Number(p.monthly_amount),
      startDate: p.start_date,
      endDate: p.end_date,
      notes: p.notes
    })),
    payments: (d.payments || []).map(normalizePayment),
    increases: (d.debt_increases || []).map(normalizeIncrease)
  };
}

function normalizePayment(p) {
  return {
    id: p.id,
    debtId: p.debt_id,
    amount: Number(p.amount),
    date: p.date,
    notes: p.notes,
    created_date: p.created_at
  };
}

function normalizeIncrease(i) {
  return {
    id: i.id,
    debtId: i.debt_id,
    amount: Number(i.amount),
    date: i.date,
    notes: i.notes,
    created_date: i.created_at
  };
}
