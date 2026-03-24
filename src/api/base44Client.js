// Stub — base44 SDK removed. Replace with your own backend/auth.

export const base44 = {
  auth: {
    getUser: async () => null,
    onAuthStateChanged: (_cb) => () => {},
    signInWithGoogle: async () => {},
    signOut: async () => {},
  },
};

const makeEntity = (name) => ({
  list: async () => [],
  create: async (data) => ({ ...data, id: crypto.randomUUID(), created_date: new Date().toISOString() }),
  update: async (id, data) => ({ ...data, id }),
  delete: async (_id) => {},
  filter: async () => [],
  get: async (_id) => null,
});

export const Debt = makeEntity('Debt');
export const Payment = makeEntity('Payment');
