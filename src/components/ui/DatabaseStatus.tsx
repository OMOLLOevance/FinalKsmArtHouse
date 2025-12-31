'use client';

import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { checkDatabaseHealth } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DatabaseStatusProps {
  onClose?: () => void;
}

const DatabaseStatus: React.FC<DatabaseStatusProps> = ({ onClose }) => {
  const [status, setStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const healthCheck = await checkDatabaseHealth();
      setStatus(healthCheck);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const healthyTables = status.filter(t => t.status === 'ok').length;
  const totalTables = status.length;
  const isHealthy = healthyTables === totalTables;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <CardTitle>Database Status</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              {isHealthy ? 'All Systems Operational' : 'Issues Detected'}
            </span>
          </div>
          <Badge variant={isHealthy ? 'success' : 'destructive'}>
            {healthyTables}/{totalTables} Tables
          </Badge>
        </div>

        {lastCheck && (
          <p className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {status.map((table) => (
            <div
              key={table.table}
              className="flex items-center space-x-2 p-2 rounded-lg border"
            >
              {table.status === 'ok' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-mono">{table.table}</span>
            </div>
          ))}
        </div>

        {!isHealthy && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Setup Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Some database tables are missing. Please run the database setup script in your Supabase SQL Editor.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  Check the DATABASE_SETUP.md file for instructions.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseStatus;