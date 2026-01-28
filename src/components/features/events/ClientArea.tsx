'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import ClientAreaForm from './ClientAreaForm';

interface ClientAreaProps {
  onBack: () => void;
}

const ClientArea: React.FC<ClientAreaProps> = ({ onBack }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Area</CardTitle>
        <CardDescription>Manage client information and event details.</CardDescription>
      </CardHeader>
      <CardContent>
        <ClientAreaForm />
      </CardContent>
    </Card>
  );
};

export default ClientArea;
