import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import { RestaurantSale } from '@/types';
import { logger } from '@/lib/logger';

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
  // Get all restaurant sales
  async getRestaurantSales(userId: string): Promise<RestaurantSale[]> {
    try {
      const response = await apiClient.get<{ data: any[] }>(`/api/restaurant?userId=${userId}`);
      return (response?.data || []).map(this.mapDbToFrontend);
    } catch (error) {
      logger.error('RestaurantService.getRestaurantSales failed:', error);
      return [];
    }
  }

  // Create new restaurant sale
  async createRestaurantSale(userId: string, saleData: CreateRestaurantSaleRequest): Promise<RestaurantSale | null> {
    try {
      RestaurantSaleSchema.parse(saleData);
      
      const response = await apiClient.post<{ data: any }>('/api/restaurant', {
        userId,
        ...saleData
      });
      
      return response?.data ? this.mapDbToFrontend(response.data) : null;
    } catch (error) {
      logger.error('RestaurantService.createRestaurantSale failed:', error);
      throw error;
    }
  }

  // Update restaurant sale
  async updateRestaurantSale(userId: string, id: string, updates: Partial<CreateRestaurantSaleRequest>): Promise<RestaurantSale | null> {
    try {
      const response = await apiClient.put<{ data: any }>('/api/restaurant', {
        id,
        ...updates
      });
      return response?.data ? this.mapDbToFrontend(response.data) : null;
    } catch (error) {
      logger.error('RestaurantService.updateRestaurantSale failed:', error);
      throw error;
    }
  }

  // Delete restaurant sale
  async deleteRestaurantSale(userId: string, id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/restaurant?id=${id}`);
    } catch (error) {
      logger.error('RestaurantService.deleteRestaurantSale failed:', error);
      throw error;
    }
  }

  private mapDbToFrontend(dbSale: any): RestaurantSale {
    return {
      id: dbSale.id,
      date: dbSale.sale_date || dbSale.date,
      item: dbSale.item_name || dbSale.item,
      quantity: dbSale.quantity,
      unitPrice: Number(dbSale.unit_price || dbSale.unitPrice || 0),
      totalAmount: Number(dbSale.total_amount || dbSale.totalAmount || 0),
      expenses: Number(dbSale.expenses || 0),
    };
  }
}

export const restaurantService = new RestaurantService();
