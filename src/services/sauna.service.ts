import { apiClient } from '@/lib/api-client';
import { z } from 'zod';

// Validation schemas
export const SaunaBookingSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  client: z.string().min(1),
  duration: z.number().min(1),
  amount: z.number().min(0),
  status: z.enum(['booked', 'completed']).default('booked'),
});

export const SpaBookingSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  client: z.string().min(1),
  service: z.string().min(1),
  duration: z.number().min(1),
  amount: z.number().min(0),
  status: z.enum(['booked', 'completed']).default('booked'),
});

export const SaunaFinanceSchema = z.object({
  date: z.string().min(1),
  type: z.enum(['sauna-profit', 'spa-profit', 'expense']),
  description: z.string().min(1),
  amount: z.number().min(0),
  category: z.enum(['sauna', 'spa', 'general']),
});

export type CreateSaunaBookingRequest = z.infer<typeof SaunaBookingSchema>;
export type CreateSpaBookingRequest = z.infer<typeof SpaBookingSchema>;
export type CreateSaunaFinanceRequest = z.infer<typeof SaunaFinanceSchema>;

class SaunaService {
  // Sauna Bookings
  async getSaunaBookings(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/sauna?userId=${userId}&type=bookings`);
    return response.data;
  }

  async createSaunaBooking(userId: string, bookingData: CreateSaunaBookingRequest): Promise<any> {
    SaunaBookingSchema.parse(bookingData);
    
    const response = await apiClient.post<{ data: any }>('/sauna', {
      userId,
      type: 'bookings',
      ...bookingData
    });
    
    return response.data;
  }

  // Spa Bookings
  async getSpaBookings(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/sauna?userId=${userId}&type=spa`);
    return response.data;
  }

  async createSpaBooking(userId: string, bookingData: CreateSpaBookingRequest): Promise<any> {
    SpaBookingSchema.parse(bookingData);
    
    const response = await apiClient.post<{ data: any }>('/sauna', {
      userId,
      type: 'spa',
      ...bookingData
    });
    
    return response.data;
  }

  // Finances
  async getSaunaFinances(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ data: any[] }>(`/sauna?userId=${userId}&type=finances`);
    return response.data;
  }

  async createSaunaFinance(userId: string, financeData: CreateSaunaFinanceRequest): Promise<any> {
    SaunaFinanceSchema.parse(financeData);
    
    const response = await apiClient.post<{ data: any }>('/sauna', {
      userId,
      type: 'finances',
      ...financeData
    });
    
    return response.data;
  }
}

export const saunaService = new SaunaService();