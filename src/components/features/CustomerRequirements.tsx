'use client';

import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { useCustomersQuery } from '@/hooks/use-customer-api';
import { 
  useCustomerRequirementsQuery, 
  useUpdateCustomerRequirementMutation,
  useRemoveCustomerRequirementMutation 
} from '@/hooks/useCustomerRequirements';

interface CustomerRequirementsProps {
  onBack: () => void;
}

const CustomerRequirements: React.FC<CustomerRequirementsProps> = ({ onBack }) => {
  const { data: customers = [] } = useCustomersQuery();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const { data: requirements = [], isLoading } = useCustomerRequirementsQuery(selectedCustomerId);
  const updateRequirementMutation = useUpdateCustomerRequirementMutation();
  const removeRequirementMutation = useRemoveCustomerRequirementMutation();

  const handleStatusUpdate = (id: string, status: 'pending' | 'confirmed' | 'delivered') => {
    updateRequirementMutation.mutate({ id, updates: { status } });
  };

  const handleRemoveRequirement = (id: string) => {
    if (window.confirm('Are you sure you want to remove this requirement?')) {
      removeRequirementMutation.mutate(id);
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const totalValue = requirements.reduce((sum, req) => sum + (req.item_price || 0) * req.quantity_required, 0);

  if (isLoading) return <LoadingSpinner text="Loading Customer Requirements..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Customer Requirements</h2>
        </div>
      </div>

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Customer</CardTitle>
          <CardDescription>Choose a customer to view their decor requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                {selectedCustomer ? 
                  `${selectedCustomer.name} - ${selectedCustomer.eventType}` : 
                  'Select Customer'
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {customers.map(customer => (
                <DropdownMenuItem 
                  key={customer.id} 
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.eventType} - {customer.eventDate} - {customer.location}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              {customers.length === 0 && (
                <DropdownMenuItem disabled>
                  No customers available
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Requirements Card Grid */}
      {selectedCustomerId && (
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-primary">
                  Decor Requirements for {selectedCustomer?.name}
                </CardTitle>
                <CardDescription className="text-xs font-medium uppercase tracking-wider">
                  Event: {selectedCustomer?.eventType} • {selectedCustomer?.eventDate}
                </CardDescription>
              </div>
              {requirements.length > 0 && (
                <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 text-center">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Value</p>
                  <p className="text-xl font-black text-primary">{formatCurrency(totalValue)}</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {requirements.map((requirement) => (
                <Card key={requirement.id} className="overflow-hidden border-muted hover:border-primary/30 transition-all duration-300 hover:shadow-md border-l-4 border-l-primary/40">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base truncate" title={requirement.item_name}>
                          {requirement.item_name}
                        </h4>
                        <span className="text-[9px] font-black bg-muted px-2 py-0.5 rounded uppercase text-muted-foreground tracking-tighter">
                          {requirement.item_category?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="xs" className="h-7 px-2">
                              <Badge variant={
                                requirement.status === 'delivered' ? 'success' :
                                requirement.status === 'confirmed' ? 'default' : 'secondary'
                              } className="text-[9px] h-4 font-black uppercase">
                                {requirement.status}
                              </Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusUpdate(requirement.id, 'pending')}>Pending</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(requirement.id, 'confirmed')}>Confirmed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(requirement.id, 'delivered')}>Delivered</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveRequirement(requirement.id)}
                          disabled={removeRequirementMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg border">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Qty</label>
                        <p className="text-xs font-bold">{requirement.quantity_required}</p>
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Unit Price</label>
                        <p className="text-xs font-bold">{formatCurrency(requirement.item_price || 0)}</p>
                      </div>
                      <div className="space-y-0.5 col-span-2 border-t pt-1.5 mt-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total Amount</label>
                        <p className="text-sm font-black text-primary">{formatCurrency((requirement.item_price || 0) * requirement.quantity_required)}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {requirements.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground bg-muted/5 border-2 border-dashed rounded-2xl">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No requirements found for this customer.</p>
                  <p className="text-xs italic">Configuration is handled via the Decor Management module.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerRequirements;