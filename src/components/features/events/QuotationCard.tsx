
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@radix-ui/react-progress';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { usePaymentsQuery } from '@/hooks/usePayments';
import { Quotation } from '@/hooks/useQuotations';
import { DollarSign, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface QuotationCardProps {
  quotation: Quotation;
  onView: (quotation: Quotation) => void;
  onApprove: (quotation: Quotation) => void;
  onMarkAsSent: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  filterUserId?: string | null;
}

const QuotationCard: React.FC<QuotationCardProps> = ({ quotation, onView, onApprove, onMarkAsSent, onEdit, onDelete, filterUserId }) => {
  const { data: payments, isLoading: paymentsLoading } = usePaymentsQuery(quotation.id, 'quotation', filterUserId);

  const totalPaid = React.useMemo(() => {
    if (!payments) return 0;
    return payments.reduce((acc, p) => acc + p.amount_paid, 0);
  }, [payments]);

  const paymentStatus = React.useMemo(() => {
    if (totalPaid <= 0) return 'Unpaid';
    if (totalPaid >= quotation.grandTotal) return 'Fully Paid';
    return 'Partially Paid';
  }, [totalPaid, quotation.grandTotal]);
  
  const paymentPercentage = React.useMemo(() => {
    if (!quotation.grandTotal) return 0;
    return (totalPaid / quotation.grandTotal) * 100;
  }, [totalPaid, quotation.grandTotal]);

  const getPaymentStatusIcon = () => {
    switch (paymentStatus) {
      case 'Fully Paid':
        return <CheckCircle className="text-green-500 h-4 w-4" />;
      case 'Partially Paid':
        return <RefreshCw className="text-yellow-500 h-4 w-4" />;
      default:
        return <XCircle className="text-red-500 h-4 w-4" />;
    }
  };

  return (
    <Card className="rounded-2xl overflow-hidden hover-lift transition-all duration-300">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1 mr-4">
            <CardTitle className="text-lg font-bold uppercase tracking-tight truncate" title={quotation.quotationNumber}>{quotation.quotationNumber}</CardTitle>
            <CardDescription className="truncate font-medium" title={quotation.customerName}>{quotation.customerName}</CardDescription>
          </div>
          <Badge variant={quotation.status === 'approved' ? 'success' : 'default'} className="uppercase font-black text-[9px] tracking-widest px-2">
            {quotation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
                {getPaymentStatusIcon()}
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">{paymentStatus}</p>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{formatDate(quotation.eventDate)}</p>
        </div>
        <div className="space-y-3">
            <div className="bg-muted/20 p-3 rounded-xl border border-primary/5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">
                    <span>Job Status</span>
                    <span className="text-primary">{paymentPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={paymentPercentage} className="h-1.5" />
            </div>
            <div className="flex justify-between items-center text-xl font-black tracking-tighter text-primary">
                <DollarSign className="h-5 w-5 opacity-50" />
                <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2 p-6 pt-0">
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(quotation)} className="h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest">Edit</Button>
        <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(quotation)} className="h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest">Delete</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onView(quotation)} className="h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest">View Proposal</Button>
        {quotation.status === 'sent' && <Button type="button" size="sm" onClick={() => onApprove(quotation)} className="h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/20">Approve Proposal</Button>}
        {quotation.status === 'draft' && <Button type="button" size="sm" onClick={() => onMarkAsSent(quotation)} className="h-9 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-primary/20">Mark as Sent</Button>}
      </CardFooter>
    </Card>
  );
};

export default QuotationCard;
