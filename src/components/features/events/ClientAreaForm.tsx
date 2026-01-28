'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

interface ICustomerForm {
  date: string;
  accountManager: string;
  clientName: string;
  location: string;
  numberOfParks: number;
  phoneNumber: string;
  typeOfEvents: string;
  status: 'confirmed' | 'no-feedback' | 'under-discussion';
}

const CustomerAreaForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ICustomerForm>();

  const onSubmit = (data: ICustomerForm) => {
    console.log(data);
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" {...register('date', { required: true })} />
        {errors.date && <p className="text-red-500 text-xs mt-1">Date is required.</p>}
      </div>

      <div>
        <Label htmlFor="accountManager">Account Manager</Label>
        <Input id="accountManager" {...register('accountManager', { required: true })} />
        {errors.accountManager && <p className="text-red-500 text-xs mt-1">Account Manager is required.</p>}
      </div>

      <div>
        <Label htmlFor="clientName">Client Name</Label>
        <Input id="clientName" {...register('clientName', { required: true })} />
        {errors.clientName && <p className="text-red-500 text-xs mt-1">Client Name is required.</p>}
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input id="location" {...register('location', { required: true })} />
        {errors.location && <p className="text-red-500 text-xs mt-1">Location is required.</p>}
      </div>

      <div>
        <Label htmlFor="numberOfParks">Number of Parks</Label>
        <Input id="numberOfParks" type="number" {...register('numberOfParks', { required: true, valueAsNumber: true })} />
        {errors.numberOfParks && <p className="text-red-500 text-xs mt-1">Number of Parks is required.</p>}
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" type="tel" {...register('phoneNumber', { required: true })} />
        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">Phone Number is required.</p>}
      </div>

      <div>
        <Label htmlFor="typeOfEvents">Type of Events</Label>
        <Input id="typeOfEvents" {...register('typeOfEvents', { required: true })} />
        {errors.typeOfEvents && <p className="text-red-500 text-xs mt-1">Type of Events is required.</p>}
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="no-feedback">No Feedback</SelectItem>
            <SelectItem value="under-discussion">Under Discussion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit">Save</Button>
    </form>
  );
};

export default CustomerAreaForm;
