'use client';

import React, { useMemo, useState } from 'react';
import { useAllPaymentsQuery, Payment } from '@/hooks/usePayments';
import { useQuotationsQuery, Quotation } from '@/hooks/useQuotations';
import { useGymMembersQuery } from '@/hooks/use-gym-api';
import { useSaunaBookingsQuery } from '@/hooks/use-sauna-api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Badge } from '@/components/ui/Badge';
import { Loader, AlertCircle, CheckCircle, RefreshCw, XCircle, Calendar, Search } from 'lucide-react';
import { GymMember, SaunaBooking } from '@/types';
import { Input } from '@/components/ui/Input';

const PaymentRow: React.FC<{
  payment: Payment;
  quotations: Quotation[];
  gymMembers: GymMember[];
  saunaBookings: SaunaBooking[];
  cumulativePaid: number;
}> = ({ payment, quotations, gymMembers, saunaBookings, cumulativePaid }) => {
  const getServiceDetails = () => {
    switch (payment.service_type) {
      case 'quotation': {
        const quotation = quotations.find(q => q.id === payment.quotation_id);
        return {
          name: quotation?.quotationNumber || 'N/A',
          totalAmount: quotation?.grandTotal || 0,
          client: quotation?.customerName || 'N/A'
        };
      }
      case 'gym': {
        const member = gymMembers.find(m => m.id === payment.gym_member_id);
        return {
          name: member?.name || 'N/A',
          totalAmount: member?.amountPaid || 0,
          client: member?.name || 'N/A'
        };
      }
      case 'sauna': {
        const booking = saunaBookings.find(b => b.id === payment.sauna_booking_id);
        return {
          name: booking?.client || 'N/A',
          totalAmount: booking?.amount || 0,
          client: booking?.client || 'N/A'
        };
      }
      default:
        return { name: 'N/A', totalAmount: 0, client: 'N/A' };
    }
  };

  const { name, totalAmount, client } = getServiceDetails();

  const paymentStatus = useMemo(() => {
    if (cumulativePaid <= 0) return 'Unpaid';
    if (cumulativePaid >= totalAmount && totalAmount > 0) return 'Fully Paid';
    return 'Partially Paid';
  }, [cumulativePaid, totalAmount]);

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
    <TableRow>
      <TableCell className="whitespace-nowrap">{formatDate(payment.payment_date)}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getPaymentStatusIcon()}
          <span className="text-xs font-medium whitespace-nowrap">{paymentStatus}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="uppercase text-[9px] tracking-widest">{payment.service_type}</Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate" title={name}>{name}</TableCell>
      <TableCell className="max-w-[200px] truncate font-medium" title={client}>{client}</TableCell>
      <TableCell className="font-mono font-bold text-primary">{formatCurrency(payment.amount_paid)}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Paid</span>
          <span className="text-xs font-black">{formatCurrency(cumulativePaid)}</span>
        </div>
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">{payment.payment_method}</TableCell>
    </TableRow>
  );
};


export const AllPaymentsList: React.FC = () => {
  const { isManager } = useRoleGuard();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(5, 7)); // MM
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString()); // YYYY
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserId, setFilterUserId] = useState<string | null>(null);

  const { data: payments, isLoading: paymentsLoading, isError: paymentsError } = useAllPaymentsQuery(selectedMonth, selectedYear, filterUserId);
  const { data: quotations, isLoading: quotationsLoading, isError: quotationsError } = useQuotationsQuery();
  const { data: gymMembers, isLoading: gymMembersLoading, isError: gymMembersError } = useGymMembersQuery('');
  const { data: saunaBookings, isLoading: saunaBookingsLoading, isError: saunaBookingsError } = useSaunaBookingsQuery();
  
  const isLoading = paymentsLoading || quotationsLoading || gymMembersLoading || saunaBookingsLoading;
  const isError = paymentsError || quotationsError || gymMembersError || saunaBookingsError;

  // Calculate cumulative totals per reference
  const cumulativeTotals = useMemo(() => {
    if (!payments) return {};
    const totals: Record<string, number> = {};
    
    // We need ALL payments for these references to calculate cumulative paid correctly
    // However, the current hook only fetches for the selected month/year.
    // To be truly accurate, the status should ideally come from the parent entity (quotation/member/booking)
    // or we fetch all payments for the active references.
    // For now, we'll use what we have, but we'll group them.
    payments.forEach(p => {
      const refId = p.quotation_id || p.gym_member_id || p.sauna_booking_id;
      if (refId) {
        totals[refId] = (totals[refId] || 0) + p.amount_paid;
      }
    });
    return totals;
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    if (!searchTerm) return payments;
    
    const term = searchTerm.toLowerCase();
    return payments.filter(p => {
      const q = quotations?.find(q => q.id === p.quotation_id);
      const m = gymMembers?.find(m => m.id === p.gym_member_id);
      const s = saunaBookings?.find(s => s.id === p.sauna_booking_id);
      
      const refName = (q?.quotationNumber || m?.name || s?.client || '').toLowerCase();
      const clientName = (q?.customerName || m?.name || s?.client || '').toLowerCase();
      
      return refName.includes(term) || clientName.includes(term) || p.payment_method.toLowerCase().includes(term);
    });
  }, [payments, searchTerm, quotations, gymMembers, saunaBookings]);

  return (
    <Card className="mt-6 rounded-2xl overflow-hidden border-primary/10 shadow-sm">
      <CardHeader className="bg-primary/5 border-b border-primary/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">Financial Records</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Complete history of all remittances received</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isManager() && (
              <div className="w-64">
                <StaffSelector 
                  value={filterUserId} 
                  onChange={setFilterUserId} 
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>
            )}
            <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-xl border border-primary/10 h-10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold uppercase focus:outline-none pr-4 pl-2 cursor-pointer hover:text-primary transition-colors"
              >
                <option value="01" className="bg-background text-foreground uppercase font-bold text-[10px]">January</option>
                <option value="02" className="bg-background text-foreground uppercase font-bold text-[10px]">February</option>
                <option value="03" className="bg-background text-foreground uppercase font-bold text-[10px]">March</option>
                <option value="04" className="bg-background text-foreground uppercase font-bold text-[10px]">April</option>
                <option value="05" className="bg-background text-foreground uppercase font-bold text-[10px]">May</option>
                <option value="06" className="bg-background text-foreground uppercase font-bold text-[10px]">June</option>
                <option value="07" className="bg-background text-foreground uppercase font-bold text-[10px]">July</option>
                <option value="08" className="bg-background text-foreground uppercase font-bold text-[10px]">August</option>
                <option value="09" className="bg-background text-foreground uppercase font-bold text-[10px]">September</option>
                <option value="10" className="bg-background text-foreground uppercase font-bold text-[10px]">October</option>
                <option value="11" className="bg-background text-foreground uppercase font-bold text-[10px]">November</option>
                <option value="12" className="bg-background text-foreground uppercase font-bold text-[10px]">December</option>
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold uppercase focus:outline-none pr-4 cursor-pointer hover:text-primary transition-colors"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y.toString()} className="bg-background text-foreground uppercase font-bold text-[10px]">{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b border-primary/5 bg-muted/5">
          <div className="relative group">
            <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by reference, client or method..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-10 bg-background border-primary/10 rounded-xl text-xs font-semibold"
            />
          </div>
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader className="animate-spin text-primary h-8 w-8" />
            <span className="ml-3 font-semibold uppercase text-xs tracking-widest opacity-60">Synchronizing...</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center p-12 text-destructive">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span className="font-semibold uppercase text-xs tracking-widest">Failed to retrieve records</span>
          </div>
        )}
        {!isLoading && payments && quotations && gymMembers && saunaBookings && (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12">Reference</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12">Client</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12">Row Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12 text-right">Cumulative</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider px-6 h-12 text-right">Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <PaymentRow 
                    key={payment.id} 
                    payment={payment} 
                    quotations={quotations}
                    gymMembers={gymMembers}
                    saunaBookings={saunaBookings}
                    cumulativePaid={cumulativeTotals[payment.quotation_id || payment.gym_member_id || payment.sauna_booking_id || ''] || 0}
                  />
                ))}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                        <AlertCircle className="h-12 w-12" />
                        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">No payments found for this period</p>
                        <p className="text-xs">Adjust your filters or record a new transaction in the module.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllPaymentsList;
