import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Validation schemas
export const RestaurantSaleSchema = z.object({
  date: z.string().min(1),
  item: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalAmount: z.number().min(0),
  expenses: z.number().min(0).optional(),
});

export type CreateRestaurantSaleRequest = z.infer<typeof RestaurantSaleSchema>;

class RestaurantService {
  // Get all restaurant sales for user
  async getRestaurantSales(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/restaurant?userId=${userId}`);
    return response.data;
  }

  // Create new restaurant sale
  async createRestaurantSale(userId: string, saleData: CreateRestaurantSaleRequest): Promise<any> {
    RestaurantSaleSchema.parse(saleData);
    
    const response = await apiClient.post<{ data: any }>('/restaurant', {
      userId,
      ...saleData
    });
    
    return response.data;
  }
}

export const restaurantService = new RestaurantService();