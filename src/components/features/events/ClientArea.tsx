'use client';

import React, { useState } from 'react';
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


interface ClientAreaProps {
  onBack: () => void;
}

const ClientArea: React.FC<ClientAreaProps> = ({ onBack }) => {
  const [clients, setClients] = useState<IClientForm[]>([]);

  const handleSubmit = (data: IClientForm) => {
    setClients([...clients, data]);
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
                  <TableCell>{client.status}</TableCell>
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
