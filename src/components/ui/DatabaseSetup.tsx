'use client';

import React, { useState } from 'react';
import { Database, Play, CheckCircle, XCircle, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DatabaseSetup: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sqlScript = `-- KSM.ART HOUSE Database Setup
-- Copy and paste this into your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  location TEXT,
  event_type TEXT,
  event_date DATE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cash',
  service_status TEXT DEFAULT 'pending',
  notes TEXT,
  requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gym tables
CREATE TABLE IF NOT EXISTS public.gym_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  membership_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'paid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gym_finances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurant table
CREATE TABLE IF NOT EXISTS public.restaurant_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  expenses DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sauna tables
CREATE TABLE IF NOT EXISTS public.sauna_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  duration INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'booked',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sauna_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own gym members" ON public.gym_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own gym finances" ON public.gym_finances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own restaurant sales" ON public.restaurant_sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sauna bookings" ON public.sauna_bookings FOR ALL USING (auth.uid() = user_id);`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      alert('SQL script copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6" />
          <CardTitle>Database Setup Required</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Copy the SQL script below</li>
            <li>Go to your Supabase project dashboard</li>
            <li>Navigate to SQL Editor</li>
            <li>Paste and run the script</li>
            <li>Refresh this page</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">SQL Setup Script</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Script
            </Button>
          </div>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            <pre className="text-sm whitespace-pre-wrap">{sqlScript}</pre>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg flex items-center space-x-2 ${
            result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span>{result.message}</span>
          </div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="flex items-center"
          >
            <Play className="h-4 w-4 mr-2" />
            Refresh Page After Setup
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetup;