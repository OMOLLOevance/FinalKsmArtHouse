import React, { useState } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, Music, Mic, MapPin, Database, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { useEntertainmentEquipment } from '@/hooks/useEventItems';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface EntertainmentManagerProps {
  onBack: () => void;
}

const EntertainmentManager: React.FC<EntertainmentManagerProps> = ({ onBack }) => {
  const { items, loading, addItem, updateItem, deleteItem, refetch: fetchItems } = useEntertainmentEquipment();
  const [activeTab, setActiveTab] = useState<'equipment' | 'djmc'>('equipment');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingDJMC, setEditingDJMC] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showDatabasePanel, setShowDatabasePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    type: 'sound' as 'sound' | 'lighting' | 'other',
    status: 'in-store' as 'in-store' | 'hired',
    quantity: 0,
    price: 0,
  });

  const [djmcForm, setDJMCForm] = useState({
    name: '',
    type: 'dj' as 'dj' | 'mc',
    currentEvent: '',
    nextEvent: '',
    contact: '',
    rate: 0,
    eventName: '',
  });

  // Derived state from items
  const equipment = items
    .filter(item => ['sound', 'lighting', 'other'].includes(item.category || item.type || ''))
    .map(item => ({
      id: item.id,
      name: item.name,
      type: (item.category || item.type || 'other') as 'sound' | 'lighting' | 'other',
      status: (item.description || item.notes || '').includes('hired') ? 'hired' : 'in-store',
      quantity: item.quantity_available || item.quantity || 0,
      price: item.price || 0,
    }));

  const djmcBookings = items
    .filter(item => ['dj', 'mc'].includes(item.category || item.type || ''))
    .map(item => ({
      id: item.id,
      name: item.name,
      type: (item.category || item.type || 'dj') as 'dj' | 'mc',
      // Parse description for extra fields if needed, or defaults
      currentEvent: (item.description || item.notes || '').split('Current: ')[1]?.split(',')[0] || '',
      nextEvent: (item.description || item.notes || '').split('Next: ')[1]?.split(',')[0] || '',
      contact: (item.description || item.notes || '').split('Contact: ')[1]?.split(',')[0] || '',
      rate: item.price || 0,
      eventName: (item.description || item.notes || '').split('Event: ')[1]?.split(',')[0] || '',
    }));

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('💾 Saving equipment to database...');

      const itemData: any = {
        name: equipmentForm.name,
        category: equipmentForm.type,
        quantity_available: equipmentForm.quantity,
        price: equipmentForm.price,
        unit: 'pieces',
        description: `Status: ${equipmentForm.status}`
      };

      if (editingItem) {
        await updateItem(editingItem.id, itemData);
        console.log('✅ Equipment updated successfully in database');
        alert('✅ Equipment updated successfully in database!');
        setEditingItem(null);
      } else {
        await addItem(itemData);
        console.log('✅ Equipment saved successfully to database');
        alert('✅ Equipment saved successfully to database!');
        setIsAdding(false);
      }

      setEquipmentForm({
        name: '',
        type: 'sound',
        status: 'in-store',
        quantity: 0,
        price: 0,
      });
      await fetchItems();
    } catch (error) {
      console.error('❌ Error saving equipment to database:', error);
      alert('❌ Failed to save equipment to database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDJMCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('💾 Saving DJ/MC booking to database...');

      const bookingData: any = {
        name: djmcForm.name,
        category: djmcForm.type,
        quantity_available: 1,
        price: djmcForm.rate,
        unit: 'service',
        description: `Event: ${djmcForm.eventName || ''}, Current: ${djmcForm.currentEvent || ''}, Next: ${djmcForm.nextEvent || ''}, Contact: ${djmcForm.contact || ''}`
      };

      if (editingDJMC) {
        await updateItem(editingDJMC.id, bookingData);
        console.log('✅ DJ/MC booking updated successfully in database');
        alert('✅ DJ/MC booking updated successfully in database!');
        setEditingDJMC(null);
      } else {
        await addItem(bookingData);
        console.log('✅ DJ/MC booking saved successfully to database');
        alert('✅ DJ/MC booking saved successfully to database!');
        setIsAdding(false);
      }

      setDJMCForm({
        name: '',
        type: 'dj',
        currentEvent: '',
        nextEvent: '',
        contact: '',
        rate: 0,
        eventName: '',
      });
      await fetchItems();
    } catch (error) {
      console.error('Error saving DJ/MC booking:', error);
      alert('Failed to save DJ/MC booking');
    }
  };

  const handleEditEquipment = (item: any) => {
    setEditingItem(item);
    setEquipmentForm({
      name: item.name,
      type: item.type,
      status: item.status,
      quantity: item.quantity,
      price: item.price,
    });
  };

  const handleEditDJMC = (booking: any) => {
    setEditingDJMC(booking);
    setDJMCForm({
      name: booking.name,
      type: booking.type,
      currentEvent: booking.currentEvent,
      nextEvent: booking.nextEvent,
      contact: booking.contact,
      rate: booking.rate,
      eventName: booking.eventName || '',
    });
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Failed to delete equipment');
    }
  };

  const handleDeleteDJMC = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Error deleting DJ/MC booking:', error);
      alert('Failed to delete booking');
    }
  };

  const soundEquipment = equipment.filter(item => item.type === 'sound');
  const hiredEquipment = equipment.filter(item => item.status === 'hired');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading entertainment data...</p>
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
            <h2 className="text-3xl font-bold tracking-tight">Entertainment Management</h2>
            <p className="text-muted-foreground">Manage sound equipment and DJ/MC bookings</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-pink-600 hover:bg-pink-700 text-white flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add {activeTab === 'equipment' ? 'Equipment' : 'DJ/MC'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Music className="h-4 w-4 mr-2" />
              Sound Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {soundEquipment.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">DJs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {djmcBookings.filter(booking => booking.type === 'dj').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MCs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {djmcBookings.filter(booking => booking.type === 'mc').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hired Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {hiredEquipment.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {(isAdding || editingItem || editingDJMC) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingItem || editingDJMC ? 'Edit' : 'Add New'} {activeTab === 'equipment' ? 'Equipment' : 'DJ/MC'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'equipment' ? (
              <form onSubmit={handleEquipmentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Equipment Name</label>
                  <Input value={equipmentForm.name} onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={equipmentForm.type} 
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value as any })}
                  >
                    <option value="sound">Sound</option>
                    <option value="lighting">Lighting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={equipmentForm.status} 
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, status: e.target.value as any })}
                  >
                    <option value="in-store">In Store</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input type="number" value={equipmentForm.quantity} onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: parseInt(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (KSH)</label>
                  <Input type="number" value={equipmentForm.price} onChange={(e) => setEquipmentForm({ ...equipmentForm, price: parseFloat(e.target.value) })} required />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingItem(null); setEquipmentForm({ name: '', type: 'sound', status: 'in-store', quantity: 0, price: 0 }); }}>Cancel</Button>
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleDJMCSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={djmcForm.name} onChange={(e) => setDJMCForm({ ...djmcForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={djmcForm.type} 
                    onChange={(e) => setDJMCForm({ ...djmcForm, type: e.target.value as any })}
                  >
                    <option value="dj">DJ</option>
                    <option value="mc">MC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Event</label>
                  <Input value={djmcForm.currentEvent} onChange={(e) => setDJMCForm({ ...djmcForm, currentEvent: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Next Event</label>
                  <Input value={djmcForm.nextEvent} onChange={(e) => setDJMCForm({ ...djmcForm, nextEvent: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact</label>
                  <Input value={djmcForm.contact} onChange={(e) => setDJMCForm({ ...djmcForm, contact: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate (KSH)</label>
                  <Input type="number" value={djmcForm.rate} onChange={(e) => setDJMCForm({ ...djmcForm, rate: parseFloat(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Name</label>
                  <Input value={djmcForm.eventName || ''} onChange={(e) => setDJMCForm({ ...djmcForm, eventName: e.target.value })} placeholder="Event they will work together" />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingDJMC(null); setDJMCForm({ name: '', type: 'dj', currentEvent: '', nextEvent: '', contact: '', rate: 0, eventName: '' }); }}>Cancel</Button>
                  <Button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    {editingDJMC ? 'Update' : 'Save'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="border-b">
          <div className="flex">
            <Button
              variant={activeTab === 'equipment' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'equipment' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('equipment')}
            >
              <Music className="h-4 w-4 mr-2" />
              Equipment
            </Button>
            <Button
              variant={activeTab === 'djmc' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'djmc' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('djmc')}
            >
              <Mic className="h-4 w-4 mr-2" />
              DJ & MC
            </Button>
          </div>
        </div>
        
        <CardContent className="p-0">
          {activeTab === 'equipment' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Equipment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {equipment.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">{item.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={item.status === 'hired' ? 'warning' : 'success'}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">KSH {item.price.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="ghost" size="icon" onClick={() => handleEditEquipment(item)} className="mr-2 text-pink-600 hover:text-pink-900 hover:bg-pink-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipment(item.id)} className="text-red-600 hover:text-red-900 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {djmcBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="relative group">
                          <span className="cursor-pointer">{booking.name}</span>
                          {booking.eventName && (
                            <div className="absolute left-0 top-full mt-1 bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                              <div className="text-xs font-medium mb-1">Event Team:</div>
                              {djmcBookings
                                .filter(b => b.eventName === booking.eventName)
                                .map(b => `${b.name} (${b.type.toUpperCase()})`)
                                .join(' + ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={booking.type === 'dj' ? 'default' : 'secondary'}>
                          {booking.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-green-500" />
                          {booking.currentEvent || 'Available'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{booking.nextEvent || 'Not scheduled'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{booking.contact}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">KSH {booking.rate.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{booking.eventName || 'No event assigned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="ghost" size="icon" onClick={() => handleEditDJMC(booking)} className="mr-2 text-pink-600 hover:text-pink-900 hover:bg-pink-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDJMC(booking.id)} className="text-red-600 hover:text-red-900 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EntertainmentManager;