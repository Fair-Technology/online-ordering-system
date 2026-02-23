export const centsToDollars = (value?: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value / 100;
};

export const formatDollars = (value?: number): string => {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return `$${amount.toFixed(2)}`;
};
