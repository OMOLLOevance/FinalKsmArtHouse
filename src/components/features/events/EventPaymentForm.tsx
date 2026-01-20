'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, Search, CreditCard, Receipt, User, History } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';
import { useQuotationsQuery, Quotation } from '@/hooks/useQuotations';
import { usePaymentsQuery, useCreatePaymentMutation, Payment } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';

/**
 * EventPaymentForm
 * A professional form for recording event-specific payments and financial logs.
 */
export const EventPaymentForm: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank'>('cash');
  const [notes, setNotes] = useState('');

  const { data: quotations } = useQuotationsQuery();
  const { data: payments } = usePaymentsQuery(selectedQuotation?.id);
  const createPaymentMutation = useCreatePaymentMutation();

  const filteredQuotations = useMemo(() => {
    if (!searchTerm) return [];
    return (quotations || []).filter(q => q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, quotations]);

  const handleSelectQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setSearchTerm('');
  };

  const totalPaid = useMemo(() => {
    return (payments || []).reduce((acc, p) => acc + p.amount_paid, 0);
  }, [payments]);

  const balance = selectedQuotation ? selectedQuotation.grandTotal - totalPaid : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation || !user) return;

    createPaymentMutation.mutate({
      quotation_id: selectedQuotation.id,
      customer_id: selectedQuotation.customerId,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      payment_date: new Date().toISOString(),
      notes: notes,
    });
  };

  return (
    <Card className="border-primary/10 shadow-xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center space-x-3">
          <Receipt className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Event Payment Record</CardTitle>
            <CardDescription>Log financial details for specific event services</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Search className="h-3 w-3 mr-2 opacity-50" />
              Search Quotation
            </label>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter quotation number to search..."
            />
            {filteredQuotations.length > 0 && (
              <ul className="border rounded-md max-h-40 overflow-y-auto">
                {filteredQuotations.map(q => (
                  <li key={q.id} onClick={() => handleSelectQuotation(q)} className="p-2 hover:bg-muted cursor-pointer">
                    {q.quotationNumber} - {q.customerName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedQuotation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quotation Details</h3>
                <div className="space-y-2">
                  <p><strong>Quotation:</strong> {selectedQuotation.quotationNumber}</p>
                  <p><strong>Client:</strong> {selectedQuotation.customerName}</p>
                  <p><strong>Total Budget:</strong> {formatCurrency(selectedQuotation.grandTotal)}</p>
                  <p><strong>Amount Paid:</strong> {formatCurrency(totalPaid)}</p>
                  <p><strong>Balance:</strong> {formatCurrency(balance)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Pay</label>
                    <Input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="font-bold text-success"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <div className="flex gap-2">
                      {(['cash', 'mpesa', 'bank'] as const).map((method) => (
                        <Button
                          key={method}
                          type="button"
                          variant={paymentMethod === method ? 'default' : 'outline'}
                          className="flex-1 capitalize h-9 text-xs"
                          onClick={() => setPaymentMethod(method)}
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment notes..."
                  />
                </div>
              </div>
            </div>
          )}

          {payments && payments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <History className="h-3 w-3 mr-2 opacity-50 inline-block" />
                Payment History
              </h3>
              <ul className="border rounded-md max-h-40 overflow-y-auto">
                {payments.map(p => (
                  <li key={p.id} className="p-2 border-b">
                    <div className="flex justify-between">
                      <span>{new Date(p.payment_date).toLocaleDateString()}</span>
                      <span className="font-bold">{formatCurrency(p.amount_paid)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{p.payment_method} - {p.notes}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </CardContent>

        <CardFooter className="bg-muted/20 border-t p-6 flex justify-between items-center">
          {selectedQuotation && (
            <Badge variant={balance <= 0 && selectedQuotation.grandTotal > 0 ? 'success' : 'outline'} className="h-6">
              {balance <= 0 && selectedQuotation.grandTotal > 0 ? 'FULLY PAID' : 'PAYMENT PENDING'}
            </Badge>
          )}
          <Button type="submit" disabled={createPaymentMutation.isPending || !selectedQuotation} className="min-w-[200px]">
            {createPaymentMutation.isPending ? 'Processing...' : 'Save Record'}
            <CreditCard className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventPaymentForm;