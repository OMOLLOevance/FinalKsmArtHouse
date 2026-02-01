
'use client';

import React from 'react';
import { useAllPaymentsQuery, Payment } from '@/hooks/usePayments';
import { useQuotationsQuery, Quotation } from '@/hooks/useQuotations';
import { useGymMembersQuery } from '@/hooks/use-gym-api';
import { useSaunaBookingsQuery } from '@/hooks/use-sauna-api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Loader, AlertCircle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { GymMember, SaunaBooking } from '@/types';

const PaymentRow: React.FC<{
  payment: Payment;
  quotations: Quotation[];
  gymMembers: GymMember[];
  saunaBookings: SaunaBooking[];
}> = ({ payment, quotations, gymMembers, saunaBookings }) => {
  const getServiceDetails = () => {
    switch (payment.service_type) {
      case 'quotation': {
        const quotation = quotations.find(q => q.id === payment.quotation_id);
        return {
          name: quotation?.quotationNumber || 'N/A',
          totalAmount: quotation?.grandTotal || 0,
        };
      }
      case 'gym': {
        const member = gymMembers.find(m => m.id === payment.gym_member_id);
        return {
          name: member?.name || 'N/A',
          totalAmount: member?.amountPaid || 0,
        };
      }
      case 'sauna': {
        const booking = saunaBookings.find(b => b.id === payment.sauna_booking_id);
        return {
          name: booking?.client || 'N/A',
          totalAmount: booking?.amount || 0,
        };
      }
      default:
        return { name: 'N/A', totalAmount: 0 };
    }
  };

  const { name, totalAmount } = getServiceDetails();

  const paymentStatus = React.useMemo(() => {
    if (payment.amount_paid <= 0) return 'Unpaid';
    if (payment.amount_paid >= totalAmount) return 'Fully Paid';
    return 'Partially Paid';
  }, [payment.amount_paid, totalAmount]);

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
    <TableRow>
      <TableCell>{formatDate(payment.payment_date)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getPaymentStatusIcon()}
          <Badge variant="outline">{payment.service_type}</Badge>
        </div>
      </TableCell>
      <TableCell>{name}</TableCell>
      <TableCell>{formatCurrency(payment.amount_paid)}</TableCell>
      <TableCell>{payment.payment_method}</TableCell>
    </TableRow>
  );
};


export const AllPaymentsList: React.FC = () => {
  const { data: payments, isLoading: paymentsLoading, isError: paymentsError } = useAllPaymentsQuery();
  const { data: quotations, isLoading: quotationsLoading, isError: quotationsError } = useQuotationsQuery();
  const { data: gymMembers, isLoading: gymMembersLoading, isError: gymMembersError } = useGymMembersQuery('');
  const { data: saunaBookings, isLoading: saunaBookingsLoading, isError: saunaBookingsError } = useSaunaBookingsQuery();
  
  const isLoading = paymentsLoading || quotationsLoading || gymMembersLoading || saunaBookingsLoading;
  const isError = paymentsError || quotationsError || gymMembersError || saunaBookingsError;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>All Payment Records</CardTitle>
        <CardDescription>A complete history of all payments received.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-6">
            <Loader className="animate-spin" />
            <span className="ml-2">Loading payments...</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center p-6 text-red-500">
            <AlertCircle />
            <span className="ml-2">Failed to load payments.</span>
          </div>
        )}
        {payments && quotations && gymMembers && saunaBookings && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <PaymentRow 
                  key={payment.id} 
                  payment={payment} 
                  quotations={quotations}
                  gymMembers={gymMembers}
                  saunaBookings={saunaBookings}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AllPaymentsList;
