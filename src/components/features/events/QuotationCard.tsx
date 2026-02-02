
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
}

const QuotationCard: React.FC<QuotationCardProps> = ({ quotation, onView, onApprove, onMarkAsSent, onEdit, onDelete }) => {
  const { data: payments, isLoading: paymentsLoading } = usePaymentsQuery(quotation.id, 'quotation');

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
        return <CheckCircle className="text-green-500" />;
      case 'Partially Paid':
        return <RefreshCw className="text-yellow-500" />;
      default:
        return <XCircle className="text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{quotation.quotationNumber}</CardTitle>
            <CardDescription>{quotation.customerName}</CardDescription>
          </div>
          <Badge variant={quotation.status === 'approved' ? 'success' : 'default'}>
            {quotation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
                {getPaymentStatusIcon()}
                <p className="text-sm font-semibold">{paymentStatus}</p>
            </div>
            <p className="text-sm text-gray-500">{formatDate(quotation.eventDate)}</p>
        </div>
        <div className="space-y-2">
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span>Job Status</span>
                    <span>{paymentPercentage.toFixed(2)}%</span>
                </div>
                <Progress value={paymentPercentage} />
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
                <DollarSign className="h-5 w-5" />
                <span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onEdit(quotation)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete(quotation)}>Delete</Button>
        <Button variant="outline" onClick={() => onView(quotation)}>View Proposal</Button>
        {quotation.status === 'sent' && <Button onClick={() => onApprove(quotation)}>Approve Proposal</Button>}
        {quotation.status === 'draft' && <Button onClick={() => onMarkAsSent(quotation)}>Mark as Sent</Button>}
      </CardFooter>
    </Card>
  );
};

export default QuotationCard;
