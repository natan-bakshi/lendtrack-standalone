// createPageUrl replaced with React Router paths
export const createPageUrl = (page: string, params: string = ''): string => {
  const routes: Record<string, string> = {
    Dashboard: '/',
    ManageDebts: '/manage',
    DebtDetails: '/debt'
  };
  const base = routes[page] ?? '/';
  return params ? `${base}${params}` : base;
};
