'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, Search, CreditCard, Receipt, User, History } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
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
  const [isFullyPaid, setIsFullyPaid] = useState(false);

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
      toast.success('Payment recorded successfully!');
      setSelectedItem(null); // Clear selected item
      setAmountPaid(0); // Reset amount paid
      setNotes(''); // Reset notes
      // No need to explicitly refetch payments/quotations here if react-query invalidation is set up in usePayments hook.
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
      setIsFullyPaid(false);
    } else if (balance <= 0) {
      // Item becomes fully paid (or overpaid), reset amount to 0
      setAmountPaid(0); 
      setIsFullyPaid(true); 
    } else {
      setIsFullyPaid(false);
      // If an item is selected and not fully paid, and amountPaid was previously capped,
      // we might want to reset it here to allow user to input again. But for now, cap in onChange is sufficient.
    }
  }, [selectedItem, balance, setAmountPaid]);

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
      payment_date: new Date().toISOString().split('T')[0],
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
    <Card className="border-primary/10 shadow-xl overflow-hidden rounded-2xl">
      <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight">Payment Record</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Log financial details for services</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-2">
              <Label htmlFor="serviceType" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Type</Label>
              <Select onValueChange={(value: ServiceType) => setServiceType(value)} defaultValue={serviceType}>
                <SelectTrigger id="serviceType" className="h-11 rounded-xl bg-background/50 border-primary/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotation">QUOTATION</SelectItem>
                  <SelectItem value="gym">GYM</SelectItem>
                  <SelectItem value="sauna">SAUNA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="searchTerm" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center">
                <Search className="h-3 w-3 mr-2 opacity-50" />
                Search Database
              </Label>
              <Input
                id="searchTerm"
                name="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search by name or number...`}
                className="h-11 rounded-xl bg-background/50 border-primary/10"
              />
            </div>
          </div>
          
          {searchResults.length > 0 && (
            <ul className="border border-primary/5 rounded-2xl max-h-40 overflow-y-auto bg-muted/10 divide-y divide-primary/5">
              {searchResults.map((item: Quotation | GymMember | SaunaBooking) => (
                <li key={item.id} onClick={() => handleSelectItem(item)} className="p-3 hover:bg-primary/5 cursor-pointer transition-colors text-sm font-bold uppercase tracking-tight">
                  {serviceType === 'quotation' && `${(item as Quotation).quotationNumber} - ${(item as Quotation).customerName}`}
                  {serviceType === 'gym' && (item as GymMember).name}
                  {serviceType === 'sauna' && `${(item as SaunaBooking).client} - ${new Date((item as SaunaBooking).date).toLocaleDateString()}`}
                </li>
              ))}
            </ul>
          )}

          {(selectedItem || lastSelectedItem) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b border-primary/10 pb-2">Service Details</h3>
                  <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-primary/5 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Client</span>
                      <span className="text-sm font-black uppercase tracking-tight truncate max-w-[150px]" title={clientName}>{clientName}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-primary/5 pt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Due</span>
                      <span className="text-sm font-bold">{formatCurrency(totalBudget)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-primary/5 pt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Paid To Date</span>
                      <span className="text-sm font-black text-success">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-primary/10 pt-2">
                      <span className="text-[10px] font-black text-primary uppercase">Current Balance</span>
                      <span className="text-base font-black text-primary tracking-tighter">{formatCurrency(balance)}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-primary/70">Projected Balance</span>
                      <span className={`text-sm font-black ${remainingBalance <= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <fieldset disabled={isFullyPaid} className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b border-primary/10 pb-2">New Transaction</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amountToPay" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount</Label>
                        <Input
                          id="amountToPay"
                          name="amountToPay"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={amountPaid}
                          onChange={(e) => {
                            let value = Number(e.target.value);
                            if (isNaN(value)) value = 0;
                            value = Math.max(0, value);

                            if (serviceType === 'quotation' && value > balance) {
                              setAmountPaid(balance);
                              toast.warning(`Payment capped at remaining balance: ${formatCurrency(balance)}`);
                            } else {
                              setAmountPaid(value);
                            }
                          }}
                          className="h-11 font-black text-success rounded-xl bg-background/50 border-primary/10"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Method</Label>
                        <div className="flex gap-2" role="group" aria-label="Payment method selection">
                          {(['cash', 'mpesa', 'bank'] as const).map((method) => (
                            <Button
                              key={method}
                              type="button"
                              variant={paymentMethod === method ? 'default' : 'outline'}
                              className="flex-1 capitalize h-11 text-[10px] font-black rounded-xl"
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
                      <Label htmlFor="paymentNotes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transaction Notes</Label>
                      <Input
                        id="paymentNotes"
                        name="paymentNotes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Reference number or particulars..."
                        className="h-11 rounded-xl bg-background/50 border-primary/10"
                      />
                    </div>
                  </fieldset>
                </div>
              </div>

              {payments && payments.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary border-b border-primary/10 pb-2 flex items-center">
                    <History className="h-3 w-3 mr-2 opacity-50" />
                    Transaction History
                  </h3>
                  <div className="rounded-2xl border border-primary/5 overflow-hidden shadow-sm">
                    <ul className="max-h-48 overflow-y-auto bg-muted/10 divide-y divide-primary/5">
                      {payments.map(p => (
                        <li key={p.id} className="p-4 hover:bg-background/50 transition-colors">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">{new Date(p.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span className="text-sm font-black text-primary">{formatCurrency(p.amount_paid)}</span>
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">{p.payment_method} — {p.notes || 'No notes'}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="bg-muted/20 border-t p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          {(selectedItem || lastSelectedItem) && (
            <Badge variant={balance <= 0 && totalBudget > 0 ? 'success' : 'outline'} className="h-8 px-4 font-black uppercase tracking-widest text-[9px] border-primary/20">
              {balance <= 0 && totalBudget > 0 ? 'ACCOUNT SETTLED' : 'PAYMENT REQUIRED'}
            </Badge>
          )}
          <Button 
            type="submit" 
            disabled={
              createPaymentMutation.isPending || 
              !selectedItem || 
              amountPaid <= 0 || 
              (serviceType === 'quotation' && amountPaid > balance) ||
              isFullyPaid
            } 
            className="w-full sm:w-auto h-12 px-12 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20"
          >
            {createPaymentMutation.isPending ? 'Processing...' : 'Commit Transaction'}
            <CreditCard className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventPaymentForm;
