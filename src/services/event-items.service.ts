import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Validation schemas
export const EventItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  quantity_available: z.number().min(0),
  price: z.number().min(0),
  unit: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['available', 'hired', 'maintenance']).default('available'),
});

export type CreateEventItemRequest = z.infer<typeof EventItemSchema>;

class EventItemsService {
  // Get all event items for user
  async getEventItems(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/event-items?userId=${userId}`);
    return response.data;
  }

  // Get items by category
  async getItemsByCategory(userId: string, category: string): Promise<any[]> {
    const items = await this.getEventItems(userId);
    return items.filter(item => item.category === category);
  }

  // Create new event item
  async createEventItem(userId: string, itemData: CreateEventItemRequest): Promise<any> {
    EventItemSchema.parse(itemData);
    
    const response = await apiClient.post<{ data: any }>('/event-items', {
      userId,
      ...itemData
    });
    
    return response.data;
  }

  // Get event categories (dynamic from database)
  async getEventCategories(userId: string): Promise<string[]> {
    const items = await this.getEventItems(userId);
    const categories = [...new Set(items.map(item => item.category))];
    return categories.length > 0 ? categories : ['sound', 'lighting', 'decor', 'catering', 'sanitation', 'entertainment'];
  }
}

export const eventItemsService = new EventItemsService();