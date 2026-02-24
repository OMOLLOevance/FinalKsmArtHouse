'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ClientAreaForm from './ClientAreaForm';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
import { 
  useClientsQuery, 
  useCreateClientMutation, 
  useUpdateClientMutation, 
  useDeleteClientMutation,
  IClientForm
} from '@/hooks/useClientArea';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';


interface ClientAreaProps {
  onBack: () => void;
}

const ClientArea: React.FC<ClientAreaProps> = ({ onBack }) => {
  const { data: clients = [], isLoading } = useClientsQuery();
  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const deleteMutation = useDeleteClientMutation();
  
  const { reset } = useForm<IClientForm>();
  const [editingClient, setEditingClient] = useState<IClientForm | null>(null);
  const [deletingClient, setDeletingClient] = useState<IClientForm | null>(null);

  const handleSubmit = async (data: IClientForm) => {
    const existingClient = clients.find(client => client.clientName === data.clientName);
    if (existingClient) {
      toast.error('Client with this name already exists.');
      return;
    }

    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
      }
    });
  };

  const handleEdit = (client: IClientForm) => {
    setEditingClient(client);
  };

  const handleDelete = (client: IClientForm) => {
    setDeletingClient(client);
  };

  const confirmDelete = async () => {
    if (deletingClient?.id) {
      deleteMutation.mutate(deletingClient.id, {
        onSuccess: () => setDeletingClient(null)
      });
    }
  };
  
  const confirmEdit = async () => {
    if (editingClient?.id) {
      updateMutation.mutate({ id: editingClient.id, status: editingClient.status }, {
        onSuccess: () => setEditingClient(null)
      });
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

  if (isLoading) return <LoadingSpinner text="Synchronizing client data..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button type="button" variant="outline" size="icon" onClick={onBack} className="rounded-full h-10 w-10" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary uppercase">Client Area</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Manage client information and event details.</p>
        </div>
      </div>

      <ClientAreaForm onSubmit={handleSubmit} />

      <Card className="rounded-2xl overflow-hidden border-primary/10 shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-xl font-black uppercase tracking-tight text-primary">Client History</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 h-12">Client Name</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 h-12">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 h-12">Account Manager</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 h-12">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest px-4 h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-primary/[0.02] transition-colors group">
                  <TableCell className="font-black text-sm uppercase px-4 py-4 truncate max-w-[200px]" title={client.clientName}>{client.clientName}</TableCell>
                  <TableCell className="font-bold text-xs px-4 py-4">{client.date}</TableCell>
                  <TableCell className="font-bold text-xs px-4 py-4">{client.accountManager}</TableCell>
                  <TableCell className={cn("px-4 py-4", getStatusColorClass(client.status))}>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-none bg-muted/50">
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(client)} className="h-8 w-8 hover:text-primary" aria-label="Edit status">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="destructive" size="icon" onClick={() => handleDelete(client)} className="h-8 w-8" aria-label="Delete client">
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
              <Button type="button" variant="outline" onClick={() => setEditingClient(null)} className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
              <Button type="button" onClick={confirmEdit} className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingClient && (
         <Dialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
          <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
            <div className="h-1.5 w-full bg-destructive" />
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-destructive">Delete Client</DialogTitle>
              <CardDescription className="font-bold text-sm opacity-70 border-none shadow-none">Are you sure you want to delete this client? This action cannot be undone.</CardDescription>
            </DialogHeader>
            <DialogFooter className="p-6 pt-4 gap-2 bg-muted/20">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
              </DialogClose>
              <Button type="button" variant="destructive" onClick={confirmDelete} className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientArea;
