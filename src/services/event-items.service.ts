import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Validation schemas
export const EventItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantityAvailable: z.number().min(0),
  price: z.number().min(0),
  unit: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['available', 'hired', 'maintenance']).default('available'),
});

export type CreateEventItemRequest = z.infer<typeof EventItemSchema>;

class EventItemsService {
  // Get all event items for user
  async getEventItems(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/api/event-items?userId=${userId}`);
    return response.data.map(this.mapDbToFrontend);
  }

  // Get items by category
  async getItemsByCategory(userId: string, category: string): Promise<any[]> {
    const items = await this.getEventItems(userId);
    return items.filter(item => item.category === category);
  }

  // Create new event item
  async createEventItem(userId: string, itemData: CreateEventItemRequest): Promise<any> {
    EventItemSchema.parse(itemData);
    
    const dbItem = {
      user_id: userId,
      name: itemData.name,
      category: itemData.category,
      quantity_available: itemData.quantityAvailable,
      price: itemData.price,
      unit: itemData.unit,
      description: itemData.description,
      status: itemData.status
    };

    const response = await apiClient.post<{ data: any }>('/api/event-items', dbItem);
    return this.mapDbToFrontend(response.data);
  }

  // Update event item
  async updateEventItem(userId: string, id: string, updates: Partial<CreateEventItemRequest>): Promise<any> {
    const dbUpdates: any = { id };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.quantityAvailable !== undefined) dbUpdates.quantity_available = updates.quantityAvailable;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const response = await apiClient.put<{ data: any }>('/api/event-items', dbUpdates);
    return this.mapDbToFrontend(response.data);
  }

  // Delete event item
  async deleteEventItem(userId: string, id: string): Promise<void> {
    await apiClient.delete(`/api/event-items?id=${id}`);
  }

  // Mapping function
  private mapDbToFrontend(dbItem: any): any {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      quantityAvailable: Number(dbItem.quantity_available),
      price: Number(dbItem.price),
      unit: dbItem.unit,
      description: dbItem.description,
      status: dbItem.status,
      createdAt: dbItem.created_at
    };
  }

  // Get event categories (dynamic from database)
  async getEventCategories(userId: string): Promise<string[]> {
    const items = await this.getEventItems(userId);
    const categories = [...new Set(items.map(item => item.category))];
    return categories.length > 0 ? categories : ['sound', 'lighting', 'decor', 'catering', 'sanitation', 'entertainment'];
  }
}

export const eventItemsService = new EventItemsService();
