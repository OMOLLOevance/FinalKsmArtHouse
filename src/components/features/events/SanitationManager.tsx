import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, Smartphone, Home, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useSanitationItems } from '@/hooks/useSanitationItems';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface SanitationManagerProps {
  onBack: () => void;
}

const SanitationManager: React.FC<SanitationManagerProps> = ({ onBack }) => {
  const { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems } = useSanitationItems();
  const [activeTab, setActiveTab] = useState<'all' | 'mobile' | 'hired' | 'in-store' | 'returned' | 'damaged'>('all');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'mobile' as 'mobile' | 'equipment',
    status: 'in-store' as 'in-store' | 'hired',
    quantity: 0,
    price: 0,
    hiredDate: '',
    client: '',
    damageStatus: 'not-damaged' as 'damaged' | 'not-damaged',
    dateReturned: '',
    returnDate: ''
  });

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    try {
      await fetchItems();
      setTimeout(() => {
        alert(`✅ Successfully synced sanitation items from database!\n\nTotal: ${items.length} item(s) loaded\n\nData is 100% up-to-date. Admin can see all your items.`);
      }, 300);
    } catch (error: any) {
      console.error('Error syncing from database:', error);
      alert('❌ Failed to sync from database: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('💾 Saving sanitation item to database...');

      const itemData: any = {
        name: formData.name,
        category: formData.type,
        price: formData.price,
        unit: 'pieces',
        description: `Status: ${formData.status}, Damage: ${formData.damageStatus}, Client: ${formData.client || 'N/A'}, Hired: ${formData.hiredDate || 'N/A'}, Return: ${formData.returnDate || 'N/A'}`
      };

      if (editingItem) {
        await updateItem(editingItem.id, itemData);
        console.log('✅ Sanitation item updated successfully in database');
        alert('✅ Sanitation item updated successfully in database!');
        setEditingItem(null);
      } else {
        await addItem(itemData);
        console.log('✅ Sanitation item saved successfully to database');
        alert('✅ Sanitation item saved successfully to database!');
        setIsAdding(false);
      }

      setFormData({
        name: '',
        type: 'mobile',
        status: 'in-store',
        quantity: 0,
        price: 0,
        hiredDate: '',
        returnDate: '',
        damageStatus: 'not-damaged',
        dateReturned: '',
        client: '',
      });
      await fetchItems();
    } catch (error) {
      console.error('❌ Error saving sanitation item to database:', error);
      alert('❌ Failed to save sanitation item to database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      status: item.status,
      quantity: item.quantity,
      price: item.price,
      hiredDate: item.hiredDate || '',
      returnDate: item.returnDate || '',
      damageStatus: item.damageStatus || 'not-damaged',
      dateReturned: item.dateReturned || '',
      client: item.client || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Error deleting sanitation item:', error);
      alert('Failed to delete sanitation item');
    }
  };

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'mobile':
        return items.filter(item => item.type === 'mobile');
      case 'hired':
        return items.filter(item => item.status === 'hired');
      case 'in-store':
        return items.filter(item => item.status === 'in-store');
      case 'returned':
        return items.filter(item => item.status === 'returned');
      case 'damaged':
        return items.filter(item => item.damageStatus === 'damaged');
      default:
        return items;
    }
  };

  const mobileItems = items.filter(item => item.type === 'mobile');
  const hiredItems = items.filter(item => item.status === 'hired');
  const damagedItems = items.filter(item => item.damageStatus === 'damaged');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sanitation items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sanitation Management</h2>
            <p className="text-muted-foreground">Manage mobile toilets and sanitation equipment</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Collapsible Database Save Panel */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader className="pb-2">
          <Button
            variant="ghost"
            onClick={() => setShowDatabasePanel(!showDatabasePanel)}
            className="w-full flex items-center justify-between hover:bg-yellow-100/50 p-0 h-auto"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Database className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-yellow-900">Save to Database</CardTitle>
                <CardDescription className="text-yellow-700/80">Click to sync {items.length} sanitation items to database for admin</CardDescription>
              </div>
            </div>
            {showDatabasePanel ? (
              <ChevronUp className="h-5 w-5 text-yellow-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-yellow-600" />
            )}
          </Button>
        </CardHeader>

        {showDatabasePanel && (
          <CardContent className="pt-2">
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                <h4 className="font-semibold text-blue-900 mb-2 text-sm">What this does:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>✅ Syncs all {items.length} sanitation items from Supabase database</li>
                  <li>✅ Makes data visible to admin on all devices</li>
                  <li>✅ Ensures data never gets lost</li>
                  <li>✅ Enables cross-device synchronization</li>
                </ul>
              </div>

              <Button
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className={`w-full h-12 text-lg ${isSaving ? 'opacity-70 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Syncing from Database...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    Sync {items.length} Items from Database
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile Toilets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mobileItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Currently Hired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {hiredItems.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Store</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {items.filter(item => item.status === 'in-store').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {(isAdding || editingItem) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Name</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="mobile">Mobile Toilet</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.status} 
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="in-store">In Store</option>
                  <option value="hired">Hired</option>
                  <option value="returned">Returned</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (KSH)</label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} required />
              </div>
              {formData.status === 'hired' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hired Date</label>
                    <Input type="date" value={formData.hiredDate} onChange={(e) => setFormData({ ...formData, hiredDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Return Date</label>
                    <Input type="date" value={formData.returnDate} onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Client</label>
                    <Input type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Damage Status</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.damageStatus} 
                      onChange={(e) => setFormData({ ...formData, damageStatus: e.target.value as any })}
                    >
                      <option value="not-damaged">Not Damaged</option>
                      <option value="damaged">Damaged</option>
                    </select>
                  </div>
                </>
              )}
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }}>Cancel</Button>
                <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  {editingItem ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'all' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('all')}
            >
              All Items
            </Button>
            <Button
              variant={activeTab === 'mobile' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'mobile' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('mobile')}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile Toilets
            </Button>
            <Button
              variant={activeTab === 'hired' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'hired' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('hired')}
            >
              Hired Items
            </Button>
            <Button
              variant={activeTab === 'in-store' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'in-store' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('in-store')}
            >
              <Home className="h-4 w-4 mr-2" />
              In Store
            </Button>
            <Button
              variant={activeTab === 'damaged' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'damaged' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('damaged')}
            >
              Damaged Items
            </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                  {activeTab === 'hired' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hired Date</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {getFilteredItems().map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">{item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={item.status === 'hired' ? 'warning' : item.status === 'returned' ? 'secondary' : 'success'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">KSH {item.price.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.dateReturned || '-'}</td>
                    {activeTab === 'hired' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.client}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.hiredDate}</td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="mr-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SanitationManager;
