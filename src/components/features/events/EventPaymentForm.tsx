'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, Search, CreditCard, Receipt, User, History } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';
import { useQuotationsQuery, Quotation } from '@/hooks/useQuotations';
import { useGymMembersQuery } from '@/hooks/use-gym-api';
import { useSaunaBookingsQuery } from '@/hooks/use-sauna-api';
import { usePaymentsQuery, useCreatePaymentMutation, Payment } from '@/hooks/usePayments';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { GymMember, SaunaBooking } from '@/types';

type ServiceType = 'quotation' | 'gym' | 'sauna';

export const EventPaymentForm: React.FC = () => {
  const { user } = useAuth();
  const [serviceType, setServiceType] = useState<ServiceType>('quotation');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<Quotation | GymMember | SaunaBooking | null>(null);
  const [lastSelectedItem, setLastSelectedItem] = useState<Quotation | GymMember | SaunaBooking | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'bank'>('cash');
  const [notes, setNotes] = useState('');

  const { data: quotations } = useQuotationsQuery();
  const { data: gymMembers } = useGymMembersQuery(searchTerm);
  const { data: saunaBookings } = useSaunaBookingsQuery();

  const getPaymentQueryId = () => {
    if (!selectedItem) return undefined;
    if (serviceType === 'quotation') return (selectedItem as Quotation).id;
    if (serviceType === 'gym') return (selectedItem as GymMember).id;
    if (serviceType === 'sauna') return (selectedItem as SaunaBooking).id;
    return undefined;
  };

  const { data: payments } = usePaymentsQuery(
    getPaymentQueryId(),
    serviceType
  );
  
  const createPaymentMutation = useCreatePaymentMutation({
    onSuccess: () => {
      setSelectedItem(null);
    }
  });

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    if (serviceType === 'quotation') {
      return (quotations || []).filter(q => q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (serviceType === 'gym') {
      return gymMembers || [];
    }
    if (serviceType === 'sauna') {
      return (saunaBookings || []).filter(b => b.client.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return [];
  }, [searchTerm, serviceType, quotations, gymMembers, saunaBookings]);

  const handleSelectItem = (item: Quotation | GymMember | SaunaBooking) => {
    setSelectedItem(item);
    setLastSelectedItem(item);
    setSearchTerm('');
  };

  const totalPaid = useMemo(() => {
    return (payments || []).reduce((acc, p) => acc + p.amount_paid, 0);
  }, [payments]);

  const { totalBudget, balance, clientName } = useMemo(() => {
    const itemForDetails = selectedItem || lastSelectedItem;
    if (!itemForDetails) return { totalBudget: 0, balance: 0, clientName: '' };
    if (serviceType === 'quotation') {
      const q = itemForDetails as Quotation;
      return { totalBudget: q.grandTotal, balance: q.grandTotal - totalPaid, clientName: q.customerName };
    }
    if (serviceType === 'gym') {
      const m = itemForDetails as GymMember;
      return { totalBudget: m.amountPaid, balance: m.amountPaid - totalPaid, clientName: m.name };
    }
    if (serviceType === 'sauna') {
      const b = itemForDetails as SaunaBooking;
      return { totalBudget: b.amount, balance: b.amount - totalPaid, clientName: b.client };
    }
    return { totalBudget: 0, balance: 0, clientName: '' };
  }, [selectedItem, lastSelectedItem, serviceType, totalPaid]);

  const remainingBalance = useMemo(() => {
    return balance - amountPaid;
  }, [balance, amountPaid]);

  useEffect(() => {
    if (!selectedItem) {
      setAmountPaid(0);
    }
  }, [selectedItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !user) return;

    let paymentData: {
      amount_paid: number;
      payment_method: 'cash' | 'mpesa' | 'bank';
      payment_date: string;
      notes: string;
      service_type: ServiceType;
      quotation_id?: string;
      customer_id?: string;
      gym_member_id?: string;
      sauna_booking_id?: string;
    } = {
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      payment_date: new Date().toISOString(),
      notes: notes,
      service_type: serviceType,
    };

    if (serviceType === 'quotation') {
      const q = selectedItem as Quotation;
      paymentData = { ...paymentData, quotation_id: q.id, customer_id: q.customerId };
    } else if (serviceType === 'gym') {
      const m = selectedItem as GymMember;
      paymentData = { ...paymentData, gym_member_id: m.id };
    } else if (serviceType === 'sauna') {
      const b = selectedItem as SaunaBooking;
      paymentData = { ...paymentData, sauna_booking_id: b.id };
    }

    createPaymentMutation.mutate(paymentData);
  };

  return (
    <Card className="border-primary/10 shadow-xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center space-x-3">
          <Receipt className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Payment Record</CardTitle>
            <CardDescription>Log financial details for services</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-6">
          <div className="flex gap-4">
            <div className="w-1/3">
              <label htmlFor="serviceType" className="text-sm font-medium">Service Type</label>
              <Select onValueChange={(value: ServiceType) => setServiceType(value)} defaultValue={serviceType}>
                <SelectTrigger id="serviceType">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotation">Quotation</SelectItem>
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="sauna">Sauna</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-2/3">
              <label htmlFor="searchTerm" className="text-sm font-medium flex items-center">
                <Search className="h-3 w-3 mr-2 opacity-50" />
                Search
              </label>
              <Input
                id="searchTerm"
                name="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${serviceType}...`}
              />
            </div>
          </div>
          
          {searchResults.length > 0 && (
            <ul className="border rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((item: Quotation | GymMember | SaunaBooking) => (
                <li key={item.id} onClick={() => handleSelectItem(item)} className="p-2 hover:bg-muted cursor-pointer">
                  {serviceType === 'quotation' && `${(item as Quotation).quotationNumber} - ${(item as Quotation).customerName}`}
                  {serviceType === 'gym' && (item as GymMember).name}
                  {serviceType === 'sauna' && `${(item as SaunaBooking).client} - ${new Date((item as SaunaBooking).date).toLocaleDateString()}`}
                </li>
              ))}
            </ul>
          )}

          {(selectedItem || lastSelectedItem) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Details</h3>
                  <div className="space-y-2">
                    <p><strong>Client:</strong> {clientName}</p>
                    <p><strong>Total Due:</strong> {formatCurrency(totalBudget)}</p>
                    <p><strong>Amount Paid:</strong> {formatCurrency(totalPaid)}</p>
                    <p><strong>Balance:</strong> {formatCurrency(balance)}</p>
                    <p><strong>Remaining After This Payment:</strong> {formatCurrency(remainingBalance)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="amountToPay" className="text-sm font-medium">Amount to Pay</label>
                      <Input
                        id="amountToPay"
                        name="amountToPay"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Math.max(0, Number(e.target.value)))}
                        className="font-bold text-success"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Payment Method</label>
                      <div className="flex gap-2" role="group" aria-label="Payment method selection">
                        {(['cash', 'mpesa', 'bank'] as const).map((method) => (
                          <Button
                            key={method}
                            type="button"
                            variant={paymentMethod === method ? 'default' : 'outline'}
                            className="flex-1 capitalize h-9 text-xs"
                            onClick={() => setPaymentMethod(method)}
                            aria-pressed={paymentMethod === method}
                          >
                            {method}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="paymentNotes" className="text-sm font-medium">Notes</label>
                    <Input
                      id="paymentNotes"
                      name="paymentNotes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Payment notes..."
                    />
                  </div>
                </div>
              </div>

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
            </>
          )}
        </CardContent>

        <CardFooter className="bg-muted/20 border-t p-6 flex justify-between items-center">
          {(selectedItem || lastSelectedItem) && (
            <Badge variant={balance <= 0 && totalBudget > 0 ? 'success' : 'outline'} className="h-6">
              {balance <= 0 && totalBudget > 0 ? 'FULLY PAID' : 'PAYMENT PENDING'}
            </Badge>
          )}
          <Button type="submit" disabled={createPaymentMutation.isPending || !selectedItem || balance <= 0} className="min-w-[200px]">
            {createPaymentMutation.isPending ? 'Processing...' : 'Save Record'}
            <CreditCard className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventPaymentForm;
