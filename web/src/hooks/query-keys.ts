export const queryKeys = {
  bills: {
    all: ['bills'] as const,
    lists: () => [...queryKeys.bills.all, 'list'] as const,
    list: () => [...queryKeys.bills.lists()] as const,
    details: () => [...queryKeys.bills.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bills.details(), id] as const,
  },
  summaries: {
    all: ['summaries'] as const,
    detail: (billId: string) => [...queryKeys.summaries.all, billId] as const,
  },
  bankAccounts: {
    all: ['bank-accounts'] as const,
    list: () => [...queryKeys.bankAccounts.all, 'list'] as const,
  },
};
