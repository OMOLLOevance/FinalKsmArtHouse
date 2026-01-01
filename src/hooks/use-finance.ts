import { useMemo } from 'react';
import { calculateTotalCost, calculateProfitMargin } from '@/utils/calculations';
import { formatCurrency } from '@/utils/formatters';

interface FinanceData {
  amount: number;
  type: 'income' | 'expense' | string;
}

export const useFinanceSummary = (data: FinanceData[] = []) => {
  const summary = useMemo(() => {
    const income = data
      .filter(item => item.type === 'income' || item.type?.includes('profit'))
      .reduce((sum, item) => sum + Number(item.amount), 0);
    
    const expenses = data
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    
    const profit = income - expenses;
    const margin = calculateProfitMargin(income, expenses);

    return {
      income,
      expenses,
      profit,
      margin,
      formattedIncome: formatCurrency(income),
      formattedExpenses: formatCurrency(expenses),
      formattedProfit: formatCurrency(profit),
      formattedMargin: `${margin.toFixed(1)}%`
    };
  }, [data]);

  return summary;
};
