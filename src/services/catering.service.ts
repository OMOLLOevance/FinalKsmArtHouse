import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Validation schemas
export const CateringItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().min(0),
  pricePerPlate: z.number().min(0),
  minOrder: z.number().min(1),
  description: z.string().optional(),
  available: z.boolean().default(true),
});

export type CreateCateringItemRequest = z.infer<typeof CateringItemSchema>;

class CateringService {
  // Get all catering items
  async getCateringItems(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/api/catering?userId=${userId}`);
    return response.data.map(this.mapDbToFrontend);
  }

  // Create new catering item
  async createCateringItem(userId: string, itemData: CreateCateringItemRequest): Promise<any> {
    CateringItemSchema.parse(itemData);
    const response = await apiClient.post<{ data: any }>('/api/catering', {
      userId,
      ...itemData
    });
    return this.mapDbToFrontend(response.data);
  }

  // Update catering item
  async updateCateringItem(userId: string, id: string, updates: Partial<CreateCateringItemRequest>): Promise<any> {
    const response = await apiClient.put<{ data: any }>('/api/catering', {
      id,
      ...updates
    });
    return this.mapDbToFrontend(response.data);
  }

  // Delete catering item
  async deleteCateringItem(userId: string, id: string): Promise<void> {
    await apiClient.delete(`/api/catering?id=${id}`);
  }

  private mapDbToFrontend(dbItem: any): any {
    return {
      id: dbItem.id,
      name: dbItem.name,
      category: dbItem.category,
      unit: dbItem.unit,
      quantity: dbItem.quantity,
      pricePerPlate: Number(dbItem.price_per_plate),
      minOrder: dbItem.min_order,
      description: dbItem.description,
      available: dbItem.available,
      createdAt: dbItem.created_at
    };
  }

  // Get catering categories
  async getCateringCategories(userId: string): Promise<string[]> {
    const items = await this.getCateringItems(userId);
    const categories = [...new Set(items.map(item => item.category))];
    return categories.length > 0 ? categories : ['Main Course', 'Appetizer', 'Side Dish', 'Dessert', 'Beverage'];
  }
}

export const cateringService = new CateringService();