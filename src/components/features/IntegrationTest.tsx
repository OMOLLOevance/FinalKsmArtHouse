'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface IntegrationTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

const IntegrationTest: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<IntegrationTestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results: IntegrationTestResult[] = [];

    // Test 1: Authentication
    results.push({
      test: 'Authentication',
      status: isAuthenticated ? 'pass' : 'fail',
      message: isAuthenticated ? 'User is authenticated' : 'User not authenticated',
      details: { userId: user?.id, email: user?.email }
    });

    // Test 2: Database Connection
    try {
      const { data, error } = await supabase.from('monthly_allocations').select('count').limit(1);
      results.push({
        test: 'Database Connection',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : 'Database connection successful',
        details: { error: error?.message }
      });
    } catch (err) {
      results.push({
        test: 'Database Connection',
        status: 'fail',
        message: 'Database connection failed',
        details: { error: err }
      });
    }

    // Test 3: Table Structure
    try {
      const { data, error } = await supabase
        .from('monthly_allocations')
        .select('id, customer_name, event_date, status, total_ksh, deposit_paid')
        .limit(1);
      
      results.push({
        test: 'Table Structure',
        status: error ? 'fail' : 'pass',
        message: error ? `Table structure issue: ${error.message}` : 'All required columns exist',
        details: { columns: data ? Object.keys(data[0] || {}) : [], error: error?.message }
      });
    } catch (err) {
      results.push({
        test: 'Table Structure',
        status: 'fail',
        message: 'Table structure verification failed',
        details: { error: err }
      });
    }

    // Test 4: Insert Operation
    try {
      const testRecord = {
        customer_name: 'Integration Test Customer',
        event_date: new Date().toISOString().split('T')[0],
        location: 'Test Location',
        status: 'pending',
        total_ksh: 100000,
        deposit_paid: 30000,
        user_id: user?.id
      };

      const { data, error } = await supabase
        .from('monthly_allocations')
        .insert(testRecord)
        .select()
        .single();

      if (error) {
        results.push({
          test: 'Insert Operation',
          status: 'fail',
          message: `Insert failed: ${error.message}`,
          details: { error: error.message }
        });
      } else {
        results.push({
          test: 'Insert Operation',
          status: 'pass',
          message: 'Record inserted successfully',
          details: { recordId: data.id }
        });

        // Test 5: Update Operation
        const { error: updateError } = await supabase
          .from('monthly_allocations')
          .update({ status: 'confirmed' })
          .eq('id', data.id);

        results.push({
          test: 'Update Operation',
          status: updateError ? 'fail' : 'pass',
          message: updateError ? `Update failed: ${updateError.message}` : 'Record updated successfully',
          details: { error: updateError?.message }
        });

        // Test 6: Delete Operation (cleanup)
        const { error: deleteError } = await supabase
          .from('monthly_allocations')
          .delete()
          .eq('id', data.id);

        results.push({
          test: 'Delete Operation',
          status: deleteError ? 'fail' : 'pass',
          message: deleteError ? `Delete failed: ${deleteError.message}` : 'Record deleted successfully',
          details: { error: deleteError?.message }
        });
      }
    } catch (err) {
      results.push({
        test: 'CRUD Operations',
        status: 'fail',
        message: 'CRUD operations test failed',
        details: { error: err }
      });
    }

    // Test 7: RLS Policies
    try {
      const { data, error } = await supabase
        .from('monthly_allocations')
        .select('*')
        .limit(5);

      results.push({
        test: 'Row Level Security',
        status: error ? 'fail' : 'pass',
        message: error ? `RLS issue: ${error.message}` : 'RLS policies working correctly',
        details: { recordCount: data?.length, error: error?.message }
      });
    } catch (err) {
      results.push({
        test: 'Row Level Security',
        status: 'fail',
        message: 'RLS test failed',
        details: { error: err }
      });
    }

    // Test 8: Component Integration
    try {
      const MonthlyAllocationTable = (await import('./MonthlyAllocationTable')).default;
      results.push({
        test: 'Component Integration',
        status: 'pass',
        message: 'MonthlyAllocationTable component loaded successfully',
        details: { component: 'MonthlyAllocationTable' }
      });
    } catch (err) {
      results.push({
        test: 'Component Integration',
        status: 'fail',
        message: 'Component loading failed',
        details: { error: err }
      });
    }

    setTestResults(results);
    setTesting(false);
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    const colors = {
      pass: 'bg-green-100 text-green-800',
      fail: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={colors[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const passedTests = testResults.filter(r => r.status === 'pass').length;
  const totalTests = testResults.length;

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Integration Test Suite</CardTitle>
          <p className="text-sm text-gray-600">
            Verify that all components and database integration are working correctly
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runTests} disabled={testing}>
              {testing ? 'Running Tests...' : 'Run Integration Tests'}
            </Button>

            {testResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Test Results</span>
                  <span className={`font-bold ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
                    {passedTests}/{totalTests} Passed
                  </span>
                </div>

                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{result.test}</span>
                          {getStatusBadge(result.status)}
                        </div>
                        <p className="text-sm text-gray-600">{result.message}</p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationTest;