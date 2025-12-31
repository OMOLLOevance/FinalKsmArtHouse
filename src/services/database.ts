import { supabase, checkDatabaseHealth, initializeUserProfile } from '@/lib/supabase';

export class DatabaseService {
  private static instance: DatabaseService;
  private isInitialized = false;

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<{ success: boolean; message: string }> {
    if (this.isInitialized) {
      return { success: true, message: 'Database already initialized' };
    }

    try {
      // Check database health
      const healthCheck = await checkDatabaseHealth();
      const failedTables = healthCheck.filter(table => table.status === 'error');
      
      if (failedTables.length > 0) {
        console.warn('Some tables are not accessible:', failedTables);
        return { 
          success: false, 
          message: `Tables not found: ${failedTables.map(t => t.tableName).join(', ')}. Please run the database setup script.` 
        };
      }

      this.isInitialized = true;
      return { success: true, message: 'Database initialized successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Database initialization failed' 
      };
    }
  }

  async ensureUserProfile(userId: string): Promise<any> {
    try {
      // Check if user profile exists
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (existingUser) {
        return existingUser;
      }

      // Get user data from auth
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        throw new Error('No authenticated user found');
      }

      // Create user profile
      const result = await initializeUserProfile(userId, {
        email: authUser.user.email || '',
        firstName: authUser.user.user_metadata?.first_name || '',
        lastName: authUser.user.user_metadata?.last_name || '',
        role: 'staff'
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      throw error;
    }
  }

  async seedDefaultData(userId: string): Promise<void> {
    try {
      // Seed catering inventory if empty
      const { data: inventory } = await supabase
        .from('catering_inventory')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!inventory || inventory.length === 0) {
        await this.createDefaultCateringInventory(userId);
      }

      // Add default event items
      const { data: eventItems } = await supabase
        .from('event_items')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!eventItems || eventItems.length === 0) {
        await this.createDefaultEventItems(userId);
      }
    } catch (error) {
      console.error('Error seeding default data:', error);
    }
  }

  private async createDefaultCateringInventory(userId: string): Promise<void> {
    const categories = [
      { name: 'cups', count: 3 },
      { name: 'plates', count: 9 },
      { name: 'cutleries', count: 12 },
      { name: 'glasses', count: 6 },
      { name: 'jugs', count: 4 },
      { name: 'bowls', count: 11 },
      { name: 'display_stands', count: 5 },
      { name: 'juice', count: 3 },
      { name: 'general_utensils', count: 16 },
      { name: 'chaffing_dishes', count: 11 },
      { name: 'wash_up', count: 4 },
      { name: 'cooking_stuffs', count: 15 },
      { name: 'uniforms', count: 9 }
    ];

    const inventoryItems = categories.flatMap(category =>
      Array.from({ length: category.count }, (_, index) => ({
        user_id: userId,
        category: category.name,
        item_number: index + 1,
        particular: '',
        good_condition: 0,
        repair_needed: 0
      }))
    );

    await supabase.from('catering_inventory').insert(inventoryItems);
  }

  private async createDefaultEventItems(userId: string): Promise<void> {
    const defaultItems = [
      // Sound Equipment
      { name: 'Microphone Set', category: 'sound', quantity_available: 5, price: 500, unit: 'pieces' },
      { name: 'Speaker System', category: 'sound', quantity_available: 3, price: 2000, unit: 'pieces' },
      { name: 'Mixer Console', category: 'sound', quantity_available: 2, price: 1500, unit: 'pieces' },
      
      // Lighting
      { name: 'LED Lights', category: 'lighting', quantity_available: 10, price: 300, unit: 'pieces' },
      { name: 'Stage Lights', category: 'lighting', quantity_available: 4, price: 800, unit: 'pieces' },
      
      // Decor
      { name: 'Round Tables', category: 'decor', quantity_available: 20, price: 200, unit: 'pieces' },
      { name: 'Plastic Chairs', category: 'decor', quantity_available: 100, price: 50, unit: 'pieces' },
      { name: 'Tents', category: 'decor', quantity_available: 5, price: 3000, unit: 'pieces' },
      
      // Catering
      { name: 'Buffet Setup', category: 'catering', quantity_available: 1, price: 5000, unit: 'service' },
      { name: 'Waiter Service', category: 'catering', quantity_available: 1, price: 2000, unit: 'person/day' }
    ];

    const items = defaultItems.map(item => ({
      ...item,
      user_id: userId,
      status: 'available'
    }));

    await supabase.from('event_items').insert(items);
  }

  getSupabaseClient() {
    return supabase;
  }
}

export const dbService = DatabaseService.getInstance();