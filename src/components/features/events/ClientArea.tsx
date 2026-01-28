'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ClientAreaForm, { IClientForm } from './ClientAreaForm';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';


interface ClientAreaProps {
  onBack: () => void;
}

const ClientArea: React.FC<ClientAreaProps> = ({ onBack }) => {
  const [clients, setClients] = useState<IClientForm[]>([]);
  const { reset } = useForm<IClientForm>();

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      setClients(data as IClientForm[]);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (data: IClientForm) => {
    const existingClient = clients.find(client => client.clientName === data.clientName);
    if (existingClient) {
      alert('Client with this name already exists.');
      return;
    }

    const { error } = await supabase.from('clients').insert([
      {
        date: data.date,
        account_manager: data.accountManager,
        client_name: data.clientName,
        location: data.location,
        number_of_parks: data.numberOfParks,
        phone_number: data.phoneNumber,
        type_of_events: data.typeOfEvents,
        status: data.status,
      },
    ]);

    if (error) {
      console.error('Error inserting client:', error);
    } else {
      await fetchClients();
      reset();
    }
  };

  const getStatusColorClass = (status: IClientForm['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-500 font-medium';
      case 'no-feedback':
        return 'text-red-500 font-medium';
      case 'under-discussion':
        return 'text-yellow-500 font-medium';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Client Area</h2>
          <p className="text-muted-foreground">Manage client information and event details.</p>
        </div>
      </div>

      <ClientAreaForm onSubmit={handleSubmit} />

      <Card>
        <CardHeader>
          <CardTitle>Client History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Account Manager</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client, index) => (
                <TableRow key={index}>
                  <TableCell>{client.clientName}</TableCell>
                  <TableCell>{client.date}</TableCell>
                  <TableCell>{client.accountManager}</TableCell>
                  <TableCell className={getStatusColorClass(client.status)}>{client.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientArea;
