'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Trash2, Edit, Package, Search, X, ChevronRight, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/utils/formatters';
import { useCustomersQuery } from '@/hooks/use-customer-api';
import { Customer } from '@/types';
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

  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c: Customer) => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.eventType?.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c: Customer) => c.id === selectedCustomerId);
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

      {/* Customer Selection Card */}
      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-blue-600" />
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-black uppercase tracking-tight">Requirement Tracking</CardTitle>
          <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
            Monitor and manage physical asset allocations per client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedCustomerId ? (
            <Button 
              variant="outline" 
              className="w-full h-14 justify-between px-6 border-dashed border-2 hover:border-primary hover:bg-primary/5 group transition-all rounded-2xl"
              onClick={() => setIsSearchDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted group-hover:bg-primary/10 rounded-full transition-colors">
                  <User className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="font-bold text-muted-foreground group-hover:text-foreground">Select Customer to View Requirements</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border-2 rounded-2xl bg-primary/[0.03] border-primary/20 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-black text-xl text-primary leading-tight">{selectedCustomer?.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-background">{selectedCustomer?.eventType}</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Source: {(selectedCustomer as any)?.source || 'Core'}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">• {selectedCustomer?.eventDate}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedCustomerId('')}
                className="hover:bg-destructive/10 hover:text-destructive font-black uppercase tracking-widest text-[10px] h-10 px-4 rounded-xl"
              >
                <X className="h-4 w-4 mr-2" /> Switch Client
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-primary">Find Customer</DialogTitle>
            <DialogDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">
              Search by name or event classification
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 pb-4">
            <div className="relative group">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Type to search..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold text-lg focus-visible:ring-2 focus-visible:ring-primary/20"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p className="font-bold">No customers match your search</p>
              </div>
            ) : (
              filteredCustomers.map((customer: Customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 mx-2 rounded-2xl hover:bg-primary/5 cursor-pointer transition-all group border border-transparent hover:border-primary/10"
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setIsSearchDialogOpen(false);
                    setCustomerSearch('');
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                      customer.source === 'gym' ? 'bg-orange-500/10 text-orange-600' :
                      customer.source === 'sauna' ? 'bg-blue-500/10 text-blue-600' :
                      customer.source === 'allocation' ? 'bg-purple-500/10 text-purple-600' :
                      'bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary'
                    }`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight block leading-none mb-1">{customer.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{customer.eventType}</span>
                        <span className="text-[9px] font-bold text-muted-foreground/40">•</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          customer.source === 'gym' ? 'bg-orange-500/10 text-orange-600' :
                          customer.source === 'sauna' ? 'bg-blue-500/10 text-blue-600' :
                          customer.source === 'allocation' ? 'bg-purple-500/10 text-purple-600' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {customer.source}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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