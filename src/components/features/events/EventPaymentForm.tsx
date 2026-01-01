'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DollarSign, MapPin, Calendar, CreditCard, Receipt, Wallet, User } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { logger } from '@/lib/logger';

interface EventPayment {
  clientName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  eventBudget: number;
  amountPaid: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank';
  eventLocation: string;
  paymentStatus: 'paid' | 'pending' | 'partial';
}

/**
 * EventPaymentForm
 * A professional form for recording event-specific payments and financial logs.
 */
export const EventPaymentForm: React.FC = () => {
  const [payment, setPayment] = useState<EventPayment>({
    clientName: '',
    category: '',
    quantity: 1,
    unitPrice: 0,
    eventBudget: 0,
    amountPaid: 0,
    paymentMethod: 'cash',
    eventLocation: '',
    paymentStatus: 'pending'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      logger.info('Saving event payment record...', payment);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      alert('Payment details recorded successfully!');
    } catch (error) {
      logger.error('Failed to save payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const balance = payment.eventBudget - payment.amountPaid;

  return (
    <Card className="border-primary/10 shadow-xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Event Payment Record</CardTitle>
            <CardDescription>Log financial details for specific event services</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Client & Service */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client & Service Info</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <User className="h-3 w-3 mr-2 opacity-50" />
                  Client Name
                </label>
                <Input
                  value={payment.clientName}
                  onChange={(e) => setPayment({...payment, clientName: e.target.value})}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <Wallet className="h-3 w-3 mr-2 opacity-50" />
                  Service Category
                </label>
                <Input
                  value={payment.category}
                  onChange={(e) => setPayment({...payment, category: e.target.value})}
                  placeholder="e.g. Catering, Sound, Decor"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center">
                  <MapPin className="h-3 w-3 mr-2 opacity-50" />
                  Event Location
                </label>
                <Input
                  value={payment.eventLocation}
                  onChange={(e) => setPayment({...payment, eventLocation: e.target.value})}
                  placeholder="Enter venue location"
                  required
                />
              </div>
            </div>

            {/* Section 2: Financial Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Financial Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Budget</label>
                  <Input
                    type="number"
                    value={payment.eventBudget || ''}
                    onChange={(e) => setPayment({...payment, eventBudget: Number(e.target.value)})}
                    className="font-bold text-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount Paid</label>
                  <Input
                    type="number"
                    value={payment.amountPaid || ''}
                    onChange={(e) => setPayment({...payment, amountPaid: Number(e.target.value)})}
                    className="font-bold text-success"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <div className="flex gap-2">
                  {(['cash', 'mpesa', 'bank'] as const).map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={payment.paymentMethod === method ? 'default' : 'outline'}
                      className="flex-1 capitalize h-9 text-xs"
                      onClick={() => setPayment({...payment, paymentMethod: method})}
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-xl space-y-2 border">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Remaining Balance:</span>
                  <span className={`text-sm font-black ${balance > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${Math.min(100, (payment.amountPaid / (payment.eventBudget || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 border-t p-6 flex justify-between items-center">
          <Badge variant={balance <= 0 ? 'success' : 'outline'} className="h-6">
            {balance <= 0 ? 'FULLY PAID' : 'PAYMENT PENDING'}
          </Badge>
          <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
            {isSubmitting ? 'Processing...' : 'Save Record'}
            <CreditCard className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventPaymentForm;
