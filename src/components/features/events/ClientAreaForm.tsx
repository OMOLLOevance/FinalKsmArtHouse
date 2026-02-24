'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { IClientForm } from '@/hooks/useClientArea';

interface ClientAreaFormProps {
  onSubmit: (data: IClientForm) => void;
}

const ClientAreaForm: React.FC<ClientAreaFormProps> = ({ onSubmit }) => {
  const { register, handleSubmit, control, formState: { errors } } = useForm<IClientForm>();

  return (
    <Card className="rounded-2xl overflow-hidden border-primary/10 shadow-lg">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Add New Client</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
            <Input id="date" type="date" {...register('date', { required: true })} className="h-11 rounded-xl bg-background/50 border-primary/10" />
            {errors.date && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">Date is required.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountManager" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Manager</Label>
            <Input id="accountManager" placeholder="Enter manager name" {...register('accountManager', { required: true })} className="h-11 rounded-xl bg-background/50 border-primary/10" />
            {errors.accountManager && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">Account Manager is required.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Client Name</Label>
            <Input id="clientName" placeholder="Enter client or organization" {...register('clientName', { required: true })} className="h-11 rounded-xl bg-background/50 border-primary/10" />
            {errors.clientName && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">Client Name is required.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</Label>
            <Input id="location" placeholder="Event venue or address" {...register('location', { required: true })} className="h-11 rounded-xl bg-background/50 border-primary/10" />
            {errors.location && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">Location is required.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfParks" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Number of Parks</Label>
            <Input id="numberOfParks" type="number" placeholder="0" {...register('numberOfParks', { required: true, valueAsNumber: true })} className="h-11 rounded-xl bg-background/50 border-primary/10" />
            {errors.numberOfParks && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">Number of Parks is required.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
            <Input id="phoneNumber" type="tel" placeholder="07XX XXX XXX" {...register('phoneNumber', { required: true })} className="h-11 rounded-xl bg-background/50 border-primary/10" />
            {errors.phoneNumber && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">Phone Number is required.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeOfEvents" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type of Events</Label>
            <Input id="typeOfEvents" placeholder="e.g. Wedding, Corporate" {...register('typeOfEvents', { required: true })} className="h-11 rounded-xl bg-background/50 border-primary/10" />
            {errors.typeOfEvents && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">Type of Events is required.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger id="status" className="h-11 rounded-xl bg-background/50 border-primary/10">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">CONFIRMED</SelectItem>
                    <SelectItem value="no-feedback">NO FEEDBACK</SelectItem>
                    <SelectItem value="under-discussion">UNDER DISCUSSION</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20">Save Client Profile</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientAreaForm;
