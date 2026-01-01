import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import { SaunaBooking } from '@/types';
import { logger } from '@/lib/logger';

// Validation schemas
export const SaunaBookingSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  client: z.string().min(1),
  duration: z.number().min(1),
  amount: z.number().min(0),
  status: z.enum(['booked', 'completed']).default('booked'),
});

export type CreateSaunaBookingRequest = z.infer<typeof SaunaBookingSchema>;

class SaunaService {
  // Sauna Bookings
  async getSaunaBookings(userId: string): Promise<SaunaBooking[]> {
    try {
      const response = await apiClient.get<{ data: any[] }>(`/api/sauna?userId=${userId}`);
      return (response?.data || []).map(this.mapDbToFrontend);
    } catch (error) {
      logger.error('SaunaService.getSaunaBookings failed:', error);
      return [];
    }
  }

  async createSaunaBooking(userId: string, bookingData: CreateSaunaBookingRequest): Promise<SaunaBooking | null> {
    try {
      SaunaBookingSchema.parse(bookingData);
      const response = await apiClient.post<{ data: any }>('/api/sauna', {
        userId,
        ...bookingData
      });
      return response?.data ? this.mapDbToFrontend(response.data) : null;
    } catch (error) {
      logger.error('SaunaService.createSaunaBooking failed:', error);
      throw error;
    }
  }

  async updateSaunaBooking(userId: string, id: string, updates: Partial<CreateSaunaBookingRequest>): Promise<SaunaBooking | null> {
    try {
      const response = await apiClient.put<{ data: any }>('/api/sauna', {
        id,
        ...updates
      });
      return response?.data ? this.mapDbToFrontend(response.data) : null;
    } catch (error) {
      logger.error('SaunaService.updateSaunaBooking failed:', error);
      throw error;
    }
  }

  async deleteSaunaBooking(userId: string, id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/sauna?id=${id}&userId=${userId}`);
    } catch (error) {
      logger.error('SaunaService.deleteSaunaBooking failed:', error);
      throw error;
    }
  }

  private mapDbToFrontend(dbBooking: any): SaunaBooking {
    return {
      id: dbBooking.id,
      date: dbBooking.booking_date || dbBooking.date,
      time: dbBooking.booking_time || dbBooking.time,
      client: dbBooking.client_name || dbBooking.client,
      duration: dbBooking.duration || 60,
      amount: Number(dbBooking.amount || 0),
      status: dbBooking.status || 'booked',
    };
  }
}

export const saunaService = new SaunaService();
