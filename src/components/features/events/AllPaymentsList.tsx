
'use client';

import React from 'react';
import { useAllPaymentsQuery } from '@/hooks/usePayments';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Loader, AlertCircle } from 'lucide-react';

export const AllPaymentsList: React.FC = () => {
  const { data: payments, isLoading, isError } = useAllPaymentsQuery();

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
        {payments && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.payment_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.service_type}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount_paid)}</TableCell>
                  <TableCell>{payment.payment_method}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AllPaymentsList;
