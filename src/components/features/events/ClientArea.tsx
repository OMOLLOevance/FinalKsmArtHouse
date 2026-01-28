'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ClientAreaForm, { IClientForm } from './ClientAreaForm';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Trash } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';


interface ClientAreaProps {
  onBack: () => void;
}

const ClientArea: React.FC<ClientAreaProps> = ({ onBack }) => {
  const [clients, setClients] = useState<IClientForm[]>([]);
  const { reset } = useForm<IClientForm>();
  const [editingClient, setEditingClient] = useState<IClientForm | null>(null);
  const [deletingClient, setDeletingClient] = useState<IClientForm | null>(null);

  const fetchClients = async () => {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      const formattedData = data.map(client => ({
        ...client,
        clientName: client.client_name,
        accountManager: client.account_manager,
        numberOfParks: client.number_of_parks,
        phoneNumber: client.phone_number,
        typeOfEvents: client.type_of_events,
      }));
      setClients(formattedData as IClientForm[]);
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

  const handleEdit = (client: IClientForm) => {
    setEditingClient(client);
  };

  const handleDelete = (client: IClientForm) => {
    setDeletingClient(client);
  };

  const confirmDelete = async () => {
    if (deletingClient) {
      const { error } = await supabase.from('clients').delete().match({ id: deletingClient.id });
      if (error) {
        console.error('Error deleting client:', error);
      } else {
        await fetchClients();
        setDeletingClient(null);
      }
    }
  };
  
  const confirmEdit = async () => {
    if (editingClient) {
      const { error } = await supabase.from('clients').update({ status: editingClient.status }).match({ id: editingClient.id });
      if (error) {
        console.error('Error updating client:', error);
      } else {
        await fetchClients();
        setEditingClient(null);
      }
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>{client.clientName}</TableCell>
                  <TableCell>{client.date}</TableCell>
                  <TableCell>{client.accountManager}</TableCell>
                  <TableCell className={getStatusColorClass(client.status)}>{client.status}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(client)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {editingClient && (
        <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Client Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Client: {editingClient.clientName}</p>
              <Select
                onValueChange={(value) =>
                  setEditingClient({ ...editingClient, status: value as IClientForm['status'] })
                }
                defaultValue={editingClient.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="no-feedback">No Feedback</SelectItem>
                  <SelectItem value="under-discussion">Under Discussion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingClient(null)}>Cancel</Button>
              <Button onClick={confirmEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingClient && (
         <Dialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
              <CardDescription>Are you sure you want to delete this client? This action cannot be undone.</CardDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientArea;
