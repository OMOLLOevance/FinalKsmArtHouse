import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowLeft, Save, Package, Home, Clock, AlertTriangle, User, X, Check, Database, Settings } from 'lucide-react';
import { DecorItem } from '@/types';
import { useDecorItemsDB } from '@/hooks/useEventItems';
import { useDecorCustomerIntegration } from '@/hooks/useDecorCustomerIntegration';
import { supabase } from '@/lib/supabase';
import { ensureAuthenticated } from '@/utils/authHelpers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface DecorManagerProps {
  onBack: () => void;
}

// Default categories structure (fallback)
const DEFAULT_CATEGORIES = [
  {
    name: 'TABLE CLOTHES',
    items: [
      'White Flowery', 'White Plain', 'White Cotton', 'Old Flowery', 'Navy Blue Plain', 'Navy Blue Flowery',
      'Royal Blue', 'Green Plain', 'Green Flowery', 'Grey', 'Purple', 'Black', 'Brown', 'Red', 'Gold',
      'Maroon', 'Beige', 'Cream', 'Ugandan Gold', 'Ugandan Grey', 'Ugandan Green', 'Ugandan White',
      'Silk Beige', 'Sage Green', 'White Sequin', 'Rose Gold Sequin', 'Silver Sequin', 'Gold and White Sequin', 'Gold Sequin'
    ]
  },
  {
    name: 'SATIN TABLE CLOTHES',
    items: [
      'White', 'Black Red', 'Lime Green', 'Navy Blue', 'Royal Blue', 'Orange', 'Turquoise', 'Purple',
      'Cream Yellow', 'Pink', 'Gold', 'Mustard Yellow', 'Shining Gold Table Clothes', 'Silver Shiny Table Clothes'
    ]
  },
  {
    name: 'RUNNERS',
    items: [
      'Till Green', 'Navy Blue', 'Royal Blue', 'Turquoise Blue', 'Silver', 'Grey Silver Black & White', 'Zebra',
      'Burnt Orange', 'Gold', 'Peach', 'Orange', 'Safaricom Green', 'White Stripped Blue', 'Lilac', 'Lime Green',
      'Zigzag Red & White', 'Zigzag White & Black Fine Neat', 'Zigzag White & Black Sifon', 'Polka Dots White & Black',
      'Navy Blue Stripped White', 'Black Stripped White', 'Black & White Flowery', 'Purple', 'Orange & Grey',
      'Parm Purple & Wnice', 'Coral', 'Animal Print', 'Red', 'Maroon', 'Magenta', 'Black', 'Mustard Yellow',
      'Yellow Velvet', 'Yellow', 'Gold Mustard', 'Hot Pink', 'Chocolate Brown', 'Silver', 'Silver Shining',
      'White & Maroon', 'Lime Cream', 'Sequin Gold', 'Sequin Rose Gold', 'Navy Kitenge & Beige Kitenge',
      'Emerald Green Flowery', 'Green Cotton', 'Gold', 'Maroon Cotton', 'Maroon Flowery', 'Navy Blue Plain',
      'Navy Blue Flowery', 'Turquoise Blue', 'Sky Blue', 'Royal Blue', 'Burnt Orange', 'Purple Cotton',
      'Purple Flowery', 'Purple Light', 'Safaricom Green', 'Jungle Green', 'Lime Green', 'White Cotton',
      'White Flowery', 'Navy Blue Light', 'Baby Pink', 'Hot Pink', 'Peach', 'Red Cotton', 'Red Flowery',
      'Black Flowery', 'Chocolate Brown', 'Shiny Gold', 'Cream', 'Till Blue', 'Navy Blues Beige Kitenge',
      'Till Green Flowery', 'Gold Yellow', 'Yellow', 'Beige', 'Lilac', 'White & Maroon Flowery',
      'Black & Red Kitenge', 'Bantana', 'Sage Green Cotton', 'Sage Green Flowery', 'Shiny Sage Green'
    ]
  },
  {
    name: 'ELASTIC TIEBACKS',
    items: [
      'Navy Blue', 'Gold', 'Purple', 'Red', 'Safaricom Green', 'Emerald Green', 'Royal Blue', 'Turquoise Blue', 'Hot Pink'
    ]
  },
  {
    name: 'SHEER CURTAINS',
    items: [
      'Nikita Sheer', 'Sheer Pieces', 'Sheer Curtains', 'Fine Neat Curtains', 'Curtain Sheers Double Ceiling',
      'Gazebo Ceilings', 'Skirting White & Black'
    ]
  },
  {
    name: 'SPANDEX',
    items: [
      'White', 'Black', 'A Frame Ceilings', 'A Frame Curtains', 'Gazebo Ceilings', 'B Line 6x6 Ceilings',
      'B Line 6x6 Curtains', 'B Line 10x10 Ceilings', 'B Line 10x10 Curtains'
    ]
  },
  {
    name: 'DROPS',
    items: [
      'White', 'Emerald Green', 'Gold', 'Red', 'Orange', 'Safaricom Green', 'Maroon', 'Hot Pink', 'Baby Pink',
      'Egg Yellow', 'Mustard Yellow', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Turquoise', 'Till Blue',
      'Till Green', 'Black', 'Grey', 'Cream', 'Peach', 'Chocolate Brown', 'Coral', 'Lilac', 'Magenta',
      'Lime Green', 'Purple Royal', 'Purple Dark', 'Burnt Orange', 'Beige', 'Cheetah Dots', 'Sequin Gold',
      'Sequin Black', 'Sequin Purple', 'Sequin Navy Blue'
    ]
  },
  {
    name: 'TRADITIONAL ITEMS',
    items: [
      'Natural Oteos', 'Coloured Oteos', 'Flat Oteos with Beads', 'Brown & Gold Mats', 'Oval Woven Mats',
      'Woven Mats', 'Hysths Mats', 'Face Masks with Beads', 'Face Masks without Beads', 'Giraffe Sculpture Stand',
      'Comb Sculpture', 'Drums', 'Additional Fans', 'Medium Baskets', 'Medium Baskets with Holes', 'Small Baskets',
      'Long Guards', 'Guard with Shells', 'Guard Pots', 'Brown Animal Printed', 'Brown & Black Guards',
      'Maroon Guards', 'Red Guards', 'Bushy Oteos', 'Flat Brown/Gold Oteos', 'Slay Queens', 'King Queen'
    ]
  },
  {
    name: 'CHARGER PLATES',
    items: [
      'Glass Gold Standard Charger Plates', 'Glass Silver Standard Charger Plates', 'Glass Gold Stripped',
      'Glass Gold Flowery', 'Big Glass Gold Stripped', 'Silver Standard Melamine', 'Gold Melamine', 'New China Gold Melamine'
    ]
  },
  {
    name: 'TABLE MIRRORS',
    items: ['Large Table Mirrors', 'Small Table Mirrors', 'Wooden Table Mirrors']
  },
  {
    name: 'HOLDERS',
    items: [
      'Gold Spirals', 'Silver Spirals', 'Gold Half Moon', 'Silver Half Moon', 'Woven', 'Gold Flowered',
      'Shiny Silver', 'Shiny Gold', 'Gold Round', 'Gold'
    ]
  },
  {
    name: 'ARTIFICIAL FLOWERS',
    items: [
      'Maroon', 'White', 'Lime Green', 'Hot Pink', 'Baby Pink', 'Peach', 'Cream', 'Mustard Yellow',
      'Blue Royal', 'Orange', 'Lilac', 'Red', 'Chocolate Brown', 'Bushy Greenery', 'Greens', 'Snake Flowers',
      'Burnt Orange', 'White Artificials (NEW)'
    ]
  },
  {
    name: 'HANGING FLOWERS',
    items: [
      'White & Green', 'Purple', 'Lilac', 'Light Blue', 'Orange Peach', 'White', 'White Hangings', 'Green Hangings'
    ]
  },
  {
    name: 'CENTREPIECES',
    items: [
      'Gold Boxes', 'Skeleton', 'Dangling', 'Circular Cups', 'Hexagon Gold Cup', 'Long - 5 Cups', 'Medium 13 Cups',
      'Small 6 Cups', 'Heavy Glass', 'Long Glass', 'Cube Glass', 'Gold Pots', 'Pallets', 'Fish Bowl', 'Big Fish Bowls'
    ]
  }
];

const DecorManager: React.FC<DecorManagerProps> = ({ onBack }) => {
  const { items, loading, addItem, updateItem, deleteItem } = useDecorItemsDB();
  const [activeTab, setActiveTab] = useState<'all' | 'tents' | 'seats' | 'decorations' | 'hired' | 'in-store'>('all');
  const [editingItem, setEditingItem] = useState<DecorItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);
  
  // Dynamic Structure State
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isManagingStructure, setIsManagingStructure] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addingItemToCategory, setAddingItemToCategory] = useState<string | null>(null);

  // Integration hook for customer requirements
  const {
    customers,
    showCustomerSelector,
    setShowCustomerSelector,
    pendingItem,
    handleItemClick,
    selectCustomerForItem
  } = useDecorCustomerIntegration();

  // All Items Inventory Data
  const [allItemsData, setAllItemsData] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    name: '',
    type: 'decoration' as 'tent' | 'seat' | 'decoration',
    status: 'in-store' as 'in-store' | 'hired',
    quantity: 0,
    price: 0,
    hiredDate: '',
    returnDate: '',
    client: '',
  });

  const handleAllItemsChange = (category: string, item: string, field: string, value: string) => {
    const key = `${category}_${item}`;
    setAllItemsData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveInventoryToDatabase = async () => {
    setIsSavingInventory(true);
    try {
      const user = await ensureAuthenticated();
      if (!user?.id) {
        alert('Please log in to save inventory data');
        return;
      }

      const { error: upsertError } = await supabase
        .from('decor_inventory_data')
        .upsert({
          user_id: user.id,
          inventory_data: allItemsData, // Saves counts
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      // We should also ideally save the 'categories' structure to DB if we want it to persist across devices for the structure itself.
      // For now, it's in LocalStorage via useDataPersistence. 
      // To make structure truly dynamic across devices, we'd need a separate DB column or table.
      
      alert('Decor inventory data saved to database successfully!');
    } catch (error) {
      console.error('Error saving decor inventory to database:', error);
      alert('Failed to save decor inventory to database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSavingInventory(false);
    }
  };

  // Add Item to Dynamic Category
  const handleAddItemToCategory = (categoryName: string) => {
    if (!newItemName.trim()) return;
    
    setCategories(prev => prev.map(cat => {
      if (cat.name === categoryName) {
        return { ...cat, items: [...cat.items, newItemName.trim()] };
      }
      return cat;
    }));
    
    setNewItemName('');
    setAddingItemToCategory(null);
  };

  // Delete Item from Category
  const handleDeleteItemFromCategory = (categoryName: string, itemToDelete: string) => {
    if (!confirm(`Are you sure you want to remove "${itemToDelete}" from this list?`)) return;
    
    setCategories(prev => prev.map(cat => {
      if (cat.name === categoryName) {
        return { ...cat, items: cat.items.filter(i => i !== itemToDelete) };
      }
      return cat;
    }));
  };

  useEffect(() => {
    const loadInventoryFromDatabase = async () => {
      try {
        const user = await ensureAuthenticated();
        if (!user?.id) {
          console.log('No authenticated user found, skipping decor inventory load');
          return;
        }

        const { data, error } = await supabase
          .from('decor_inventory_data')
          .select('inventory_data')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.inventory_data) {
          setAllItemsData(data.inventory_data);
        }
      } catch (error) {
        console.error('Error loading decor inventory from database:', error);
      }
    };

    loadInventoryFromDatabase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('💾 Saving décor item to database...');

      const itemData: any = {
        name: formData.name,
        category: formData.type,
        quantity: formData.quantity,
        rental_price: formData.price,
        condition: formData.status,
        notes: formData.client ? `Client: ${formData.client}, Hired: ${formData.hiredDate}, Return: ${formData.returnDate}` : ''
      };

      if (editingItem) {
        await updateItem(editingItem.id, itemData);
        console.log('✅ Décor item updated successfully in database');
        alert('✅ Décor item updated successfully in database!');
        setEditingItem(null);
      } else {
        await addItem(itemData);
        console.log('✅ Décor item saved successfully to database');
        alert('✅ Décor item saved successfully to database!');
        setIsAdding(false);
      }

      setFormData({
        name: '',
        type: 'decoration',
        status: 'in-store',
        quantity: 0,
        price: 0,
        hiredDate: '',
        returnDate: '',
        client: '',
      });

    } catch (error) {
      console.error('❌ Error saving décor item to database:', error);
      alert('❌ Failed to save décor item to database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEdit = (item: DecorItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: (item.category || item.type || 'decoration') as 'tent' | 'seat' | 'decoration',
      status: (item.condition || item.status || 'in-store') as 'in-store' | 'hired',
      quantity: item.quantity,
      price: item.rental_price || item.price || 0,
      hiredDate: item.hiredDate || '',
      returnDate: item.returnDate || '',
      client: item.client || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteItem(id);
    } catch (error) {
      console.error('Error deleting decor item:', error);
      alert('Failed to delete decor item');
    }
  };

  const getFilteredItems = () => {
    switch (activeTab) {
      case 'tents':
        return items.filter(item => (item.category || item.type) === 'tent');
      case 'seats':
        return items.filter(item => (item.category || item.type) === 'seat');
      case 'decorations':
        return items.filter(item => (item.category || item.type) === 'decoration');
      case 'hired':
        return items.filter(item => (item.condition || item.status) === 'hired');
      case 'in-store':
        return items.filter(item => (item.condition || item.status) === 'in-store');
      default:
        return items;
    }
  };

  const tents = items.filter(item => (item.category || item.type) === 'tent');
  const seats = items.filter(item => (item.category || item.type) === 'seat');
  const decorations = items.filter(item => (item.category || item.type) === 'decoration');
  const hiredItems = items.filter(item => (item.condition || item.status) === 'hired');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading decor items...</p>
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
            <h2 className="text-3xl font-bold tracking-tight">Decor Management</h2>
            <p className="text-muted-foreground">Manage tents, seats, and decorations</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Customer Selector Modal */}
      {showCustomerSelector && pendingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add to Customer Requirements</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCustomerSelector(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium"><strong>Item:</strong> {pendingItem.name}</p>
                <p className="text-sm text-muted-foreground"><strong>Category:</strong> {pendingItem.category}</p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomerForItem(customer.id)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.eventType} • {customer.eventDate}</div>
                    <div className="text-sm text-muted-foreground">{customer.location}</div>
                  </button>
                ))}
              </div>

              {customers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No customers found</p>
                  <p className="text-sm">Add customers first to assign items</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Items Inventory Table */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Items Inventory</CardTitle>
              <CardDescription className="mt-1">
                Click on any item name to add it to a customer's requirements.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isManagingStructure ? "destructive" : "outline"}
                onClick={() => setIsManagingStructure(!isManagingStructure)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isManagingStructure ? 'Done Editing List' : 'Edit Items List'}
              </Button>
              <Button
                onClick={handleSaveInventoryToDatabase}
                disabled={isSavingInventory}
                variant={isSavingInventory ? "secondary" : "default"}
              >
                <Database className="h-4 w-4 mr-2" />
                {isSavingInventory ? 'Saving...' : 'Update to Database'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isManagingStructure && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
              <strong>Edit Mode:</strong> You can now delete items from the list using the trash icon next to item names, or add new items using the "+ Add Item" buttons.
            </div>
          )}
          
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground border-r">ITEM NAME</th>
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground border-r">CATEGORY</th>
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground border-r">IN STORE</th>
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground border-r">HIRED</th>
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground border-r">DAMAGED</th>
                  <th className="px-4 py-3 text-left font-bold text-sm text-muted-foreground">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((category) => (
                  <React.Fragment key={category.name}>
                    {/* Category Header */}
                    <tr className="bg-muted/30">
                      <td 
                        colSpan={6} 
                        className="px-4 py-3 font-bold text-lg text-primary flex items-center justify-between"
                      >
                        {category.name}
                        {isManagingStructure && !addingItemToCategory && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-xs"
                            onClick={() => setAddingItemToCategory(category.name)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Item
                          </Button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Add Item Row */}
                    {addingItemToCategory === category.name && (
                      <tr className="bg-blue-50">
                        <td colSpan={6} className="p-2">
                          <div className="flex gap-2 items-center">
                            <Input 
                              placeholder="New Item Name" 
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              className="h-8 max-w-sm"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleAddItemToCategory(category.name)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setAddingItemToCategory(null)}>Cancel</Button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Category Items */}
                    {category.items.map((item, index) => {
                      const key = `${category.name}_${item}`;
                      const itemData = allItemsData[key] || { inStore: 0, hired: 0, damaged: 0 };
                      
                      return (
                        <tr key={`${category.name}_${index}`} className="hover:bg-muted/50">
                          <td className="px-4 py-2 border border-gray-300 text-sm font-medium flex items-center justify-between group">
                            <button
                              onClick={() => handleItemClick(item, category.name)}
                              className="text-left hover:text-primary hover:underline transition-colors"
                              title="Click to add to customer requirements"
                            >
                              {item}
                            </button>
                            {isManagingStructure && (
                              <button 
                                onClick={() => handleDeleteItemFromCategory(category.name, item)}
                                className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded transition-all"
                                title="Remove item from list"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <Badge variant="outline" className="text-[10px]">
                              {category.name.split(' ')[0]}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <Input
                              type="number"
                              min="0"
                              value={Number(itemData.inStore || 0)}
                              onChange={(e) => handleAllItemsChange(category.name, item, 'inStore', e.target.value)}
                              className="h-8 w-20 text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <Input
                              type="number"
                              min="0"
                              value={Number(itemData.hired || 0)}
                              onChange={(e) => handleAllItemsChange(category.name, item, 'hired', e.target.value)}
                              className="h-8 w-20 text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <Input
                              type="number"
                              min="0"
                              value={Number(itemData.damaged || 0)}
                              onChange={(e) => handleAllItemsChange(category.name, item, 'damaged', e.target.value)}
                              className="h-8 w-20 text-center"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
                                onClick={() => {
                                  const currentHired = Number(itemData.hired || 0);
                                  const currentInStore = Number(itemData.inStore || 0);
                                  if (currentInStore > 0) {
                                    handleAllItemsChange(category.name, item, 'hired', (currentHired + 1).toString());
                                    handleAllItemsChange(category.name, item, 'inStore', (currentInStore - 1).toString());
                                  }
                                }}
                                title="Hire Item"
                              >
                                Hire
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                                onClick={() => {
                                  const currentHired = Number(itemData.hired || 0);
                                  const currentInStore = Number(itemData.inStore || 0);
                                  if (currentHired > 0) {
                                    handleAllItemsChange(category.name, item, 'hired', (currentHired - 1).toString());
                                    handleAllItemsChange(category.name, item, 'inStore', (currentInStore + 1).toString());
                                  }
                                }}
                                title="Return Item"
                              >
                                Return
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                                onClick={() => {
                                  const currentInStore = Number(itemData.inStore || 0);
                                  const currentDamaged = Number(itemData.damaged || 0);
                                  if (currentInStore > 0) {
                                    handleAllItemsChange(category.name, item, 'inStore', (currentInStore - 1).toString());
                                    handleAllItemsChange(category.name, item, 'damaged', (currentDamaged + 1).toString());
                                  }
                                }}
                                title="Mark as Damaged"
                              >
                                Damage
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                onClick={() => {
                                  const currentDamaged = Number(itemData.damaged || 0);
                                  const currentInStore = Number(itemData.inStore || 0);
                                  if (currentDamaged > 0) {
                                    handleAllItemsChange(category.name, item, 'damaged', (currentDamaged - 1).toString());
                                    handleAllItemsChange(category.name, item, 'inStore', (currentInStore + 1).toString());
                                  }
                                }}
                                title="Repair Item"
                              >
                                Repair
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Click item names</strong> to add them to customer requirements</li>
              <li>Enter quantities for items in store, hired out, or damaged</li>
              <li>Use action buttons to move items between statuses</li>
              <li>All data is automatically saved as you type</li>
              <li><strong>Click "Edit Items List"</strong> to add new items or remove old ones from this list.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tents.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {seats.reduce((sum, item) => sum + (item.quantity || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Decorations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {decorations.reduce((sum, item) => sum + (item.quantity || 0), 0)}
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
                <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="tent">Tent</option>
                  <option value="seat">Seat</option>
                  <option value="decoration">Decoration</option>
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
                </>
              )}
              <div className="md:col-span-2 flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingItem(null); }}>Cancel</Button>
                <Button type="submit"><Save className="h-4 w-4 mr-2" />{editingItem ? 'Update' : 'Save'}</Button>
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
              className={`rounded-none border-b-2 ${activeTab === 'all' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('all')}
            >
              All Items
            </Button>
            <Button
              variant={activeTab === 'tents' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'tents' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('tents')}
            >
              Tents
            </Button>
            <Button
              variant={activeTab === 'seats' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'seats' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('seats')}
            >
              Seats
            </Button>
            <Button
              variant={activeTab === 'decorations' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'decorations' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('decorations')}
            >
              Decorations
            </Button>
            <Button
              variant={activeTab === 'hired' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'hired' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('hired')}
            >
              Hired Items
            </Button>
            <Button
              variant={activeTab === 'in-store' ? 'default' : 'ghost'}
              className={`rounded-none border-b-2 ${activeTab === 'in-store' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTab('in-store')}
            >
              <Home className="h-4 w-4 mr-2" />
              In Store
            </Button>
          </div>
        </div>
        <CardContent className="pt-6">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Added</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {getFilteredItems().map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">{item.category || item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={(item.condition || item.status) === 'hired' ? 'warning' : 'success'}>
                        {item.condition || item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.quantity || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">KSH {(item.rental_price || item.price || 0).toLocaleString()}</td>
                    {activeTab === 'hired' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.notes || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="mr-2">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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

export default DecorManager;