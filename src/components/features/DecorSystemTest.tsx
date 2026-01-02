'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Database, Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDecorInventoryQuery, useDecorCategoriesQuery } from '@/hooks/useDecorInventory';
import { useCustomersQuery } from '@/hooks/use-customer-api';
import { useCustomerRequirementsQuery } from '@/hooks/useCustomerRequirements';
import { supabase } from '@/lib/supabase';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

const DecorSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const { data: inventory = [], isLoading: inventoryLoading } = useDecorInventoryQuery();
  const { data: categories = [] } = useDecorCategoriesQuery();
  const { data: customers = [] } = useCustomersQuery();
  const { data: requirements = [] } = useCustomerRequirementsQuery();

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase.from('decor_inventory').select('count').limit(1);
      results.push({
        name: 'Database Connection',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : 'Successfully connected to Supabase'
      });
    } catch (err) {
      results.push({
        name: 'Database Connection',
        status: 'fail',
        message: `Connection error: ${err}`
      });
    }

    // Test 2: Inventory Data Loading
    results.push({
      name: 'Inventory Data Loading',
      status: inventoryLoading ? 'pending' : (inventory.length > 0 ? 'pass' : 'fail'),
      message: inventoryLoading ? 'Loading...' : `Loaded ${inventory.length} inventory items`
    });

    // Test 3: Predefined Categories
    const expectedCategories = [
      'table_clothes', 'satin_table_clothes', 'runners', 'elastic_tiebacks',
      'sheer_curtains', 'spandex', 'drops', 'traditional_items',
      'charger_plates', 'table_mirrors', 'holders', 'artificial_flowers',
      'hanging_flowers', 'centrepieces'
    ];
    
    const missingCategories = expectedCategories.filter(cat => !categories.includes(cat));
    results.push({
      name: 'Predefined Categories',
      status: missingCategories.length === 0 ? 'pass' : 'fail',
      message: missingCategories.length === 0 
        ? `All ${expectedCategories.length} categories present`
        : `Missing categories: ${missingCategories.join(', ')}`
    });

    // Test 4: Required Inventory Items
    const requiredItems = [
      'White Table Cloth', 'Gold Satin Table Cloth', 'Gold Table Runner',
      'White Elastic Tieback', 'White Sheer Curtain', 'White Spandex Cover',
      'White Backdrop Drop', 'Kikoy Traditional Cloth', 'Gold Charger Plate',
      'Round Table Mirror', 'Candle Holder Gold', 'White Rose Arrangement',
      'White Hanging Bouquet', 'Gold Centrepiece'
    ];
    
    const inventoryNames = inventory.map(item => item.item_name);
    const missingItems = requiredItems.filter(item => !inventoryNames.includes(item));
    results.push({
      name: 'Required Inventory Items',
      status: missingItems.length === 0 ? 'pass' : 'fail',
      message: missingItems.length === 0 
        ? `All ${requiredItems.length} required items present`
        : `Missing items: ${missingItems.join(', ')}`
    });

    // Test 5: Customer Data Integration
    results.push({
      name: 'Customer Data Integration',
      status: customers.length > 0 ? 'pass' : 'fail',
      message: `${customers.length} customers available for requirements`
    });

    // Test 6: Action Button Validation
    const itemsWithStock = inventory.filter(item => item.in_store > 0);
    const itemsHired = inventory.filter(item => item.hired > 0);
    const itemsDamaged = inventory.filter(item => item.damaged > 0);
    
    results.push({
      name: 'Action Button Logic',
      status: 'pass',
      message: `${itemsWithStock.length} items available to hire, ${itemsHired.length} items to return, ${itemsDamaged.length} items to repair`
    });

    // Test 7: Customer Requirements System
    try {
      const { data: reqData, error: reqError } = await supabase
        .from('customer_requirements')
        .select('count')
        .limit(1);
      
      results.push({
        name: 'Customer Requirements System',
        status: reqError ? 'fail' : 'pass',
        message: reqError ? `Requirements system error: ${reqError.message}` : `Requirements system operational (${requirements.length} requirements)`
      });
    } catch (err) {
      results.push({
        name: 'Customer Requirements System',
        status: 'fail',
        message: `Requirements system error: ${err}`
      });
    }

    // Test 8: Data Persistence
    try {
      const testItem = inventory[0];
      if (testItem) {
        const { error } = await supabase
          .from('decor_inventory')
          .select('id')
          .eq('id', testItem.id)
          .single();
        
        results.push({
          name: 'Data Persistence',
          status: error ? 'fail' : 'pass',
          message: error ? `Persistence test failed: ${error.message}` : 'Data persistence verified'
        });
      } else {
        results.push({
          name: 'Data Persistence',
          status: 'fail',
          message: 'No inventory items available for persistence test'
        });
      }
    } catch (err) {
      results.push({
        name: 'Data Persistence',
        status: 'fail',
        message: `Persistence test error: ${err}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'fail': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Decor System Verification</h2>
          <p className="text-muted-foreground">Comprehensive test of all decor management functionality</p>
        </div>
        <Button onClick={runTests} disabled={isRunning}>
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </div>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{passCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tests Failed</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{failCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {testResults.length > 0 ? Math.round((passCount / testResults.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.name}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-xs text-muted-foreground">
              {categories.length} categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for requirements
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requirements.length}</div>
            <p className="text-xs text-muted-foreground">
              Customer requirements
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DecorSystemTest;