'use client';

import React, { useState } from 'react';
import { ArrowLeft, Trash2, Edit, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

      {/* Requirements Table */}
      {selectedCustomerId && (
        <Card>
          <CardHeader>
            <CardTitle>Decor Requirements for {selectedCustomer?.name}</CardTitle>
            <CardDescription>
              Event: {selectedCustomer?.eventType} on {selectedCustomer?.eventDate}
              {requirements.length > 0 && (
                <span className="ml-4 font-medium text-primary">
                  Total Value: {formatCurrency(totalValue)}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requirements.map((requirement) => (
                    <tr key={requirement.id}>
                      <td className="px-6 py-4 text-sm font-medium">{requirement.item_name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {requirement.item_category?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{requirement.quantity_required}</td>
                      <td className="px-6 py-4 text-sm">{formatCurrency(requirement.item_price || 0)}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {formatCurrency((requirement.item_price || 0) * requirement.quantity_required)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                requirement.status === 'delivered' ? 'bg-primary/10 text-primary' :
                                requirement.status === 'confirmed' ? 'bg-secondary/10 text-secondary' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {requirement.status}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(requirement.id, 'pending')}>
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(requirement.id, 'confirmed')}>
                              Confirmed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(requirement.id, 'delivered')}>
                              Delivered
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveRequirement(requirement.id)}
                          disabled={removeRequirementMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {requirements.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No requirements found for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerRequirements;