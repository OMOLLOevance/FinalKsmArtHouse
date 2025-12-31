import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Validation schemas
export const CateringItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().min(0),
  price_per_plate: z.number().min(0),
  min_order: z.number().min(1),
  description: z.string().optional(),
  available: z.boolean().default(true),
});

export type CreateCateringItemRequest = z.infer<typeof CateringItemSchema>;

class CateringService {
  // Get all catering items for user
  async getCateringItems(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/catering?userId=${userId}`);
    return response.data;
  }

  // Create new catering item
  async createCateringItem(userId: string, itemData: CreateCateringItemRequest): Promise<any> {
    CateringItemSchema.parse(itemData);
    
    const response = await apiClient.post<{ data: any }>('/catering', {
      userId,
      ...itemData
    });
    
    return response.data;
  }

  // Get catering categories (dynamic from database)
  async getCateringCategories(userId: string): Promise<string[]> {
    const items = await this.getCateringItems(userId);
    const categories = [...new Set(items.map(item => item.category))];
    return categories.length > 0 ? categories : ['Main Course', 'Appetizer', 'Side Dish', 'Dessert', 'Beverage'];
  }
}

export const cateringService = new CateringService();