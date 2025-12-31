'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const ItemServingsManager: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Item Servings Manager</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Manage item servings and portions.</p>
      </CardContent>
    </Card>
  );
};

export default ItemServingsManager;