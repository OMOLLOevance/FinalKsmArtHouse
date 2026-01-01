import { apiClient } from '@/lib/api-client';
import { z } from 'zod';
import { Customer } from '@/types';
import { logger } from '@/lib/logger';

// Validation schemas
export const CustomerSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  eventType: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  totalAmount: z.number().default(0),
  paidAmount: z.number().default(0),
  paymentStatus: z.string().default('pending'),
  paymentMethod: z.string().default('cash'),
  serviceStatus: z.string().default('pending'),
  notes: z.string().optional().nullable(),
  requirements: z.any().optional().nullable(),
});

export type CreateCustomerRequest = z.infer<typeof CustomerSchema>;

class CustomerService {
  // Get all customers for user
  async getCustomers(userId: string, fields: string = '*', limit: number = 100, offset: number = 0): Promise<Customer[]> {
    try {
      const response = await apiClient.get<{ data: any[] }>(`/api/customers?userId=${userId}&fields=${fields}&limit=${limit}&offset=${offset}`);
      return (response?.data || []).map(this.mapDbToFrontend);
    } catch (error) {
      logger.error('CustomerService.getCustomers failed:', error);
      return [];
    }
  }

  // Create new customer
  async createCustomer(userId: string, data: CreateCustomerRequest): Promise<Customer | null> {
    try {
      CustomerSchema.parse(data);
      
      const dbCustomer = {
        user_id: userId,
        name: data.name,
        contact: data.contact,
        location: data.location,
        event_type: data.eventType,
        event_date: data.eventDate,
        total_amount: data.totalAmount,
        paid_amount: data.paidAmount,
        payment_status: data.paymentStatus,
        payment_method: data.paymentMethod,
        service_status: data.serviceStatus,
        notes: data.notes,
        requirements: data.requirements
      };

      const response = await apiClient.post<{ data: any }>('/api/customers', dbCustomer);
      return response?.data ? this.mapDbToFrontend(response.data) : null;
    } catch (error) {
      logger.error('CustomerService.createCustomer failed:', error);
      throw error;
    }
  }

  // Update customer
  async updateCustomer(userId: string, id: string, updates: Partial<CreateCustomerRequest>): Promise<Customer | null> {
    try {
      const dbUpdates: any = { id };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;
      if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
      if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
      if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.serviceStatus !== undefined) dbUpdates.service_status = updates.serviceStatus;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.requirements !== undefined) dbUpdates.requirements = updates.requirements;

      const response = await apiClient.put<{ data: any }>('/api/customers', dbUpdates);
      return response?.data ? this.mapDbToFrontend(response.data) : null;
    } catch (error) {
      logger.error('CustomerService.updateCustomer failed:', error);
      throw error;
    }
  }

  // Delete customer
  async deleteCustomer(userId: string, id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/customers?id=${id}&userId=${userId}`);
    } catch (error) {
      logger.error('CustomerService.deleteCustomer failed:', error);
      throw error;
    }
  }

  private mapDbToFrontend(dbCustomer: any): Customer {
    return {
      id: dbCustomer.id,
      name: dbCustomer.name,
      contact: dbCustomer.contact,
      location: dbCustomer.location,
      eventType: dbCustomer.event_type || dbCustomer.eventType,
      eventDate: dbCustomer.event_date || dbCustomer.eventDate,
      totalAmount: Number(dbCustomer.total_amount || 0),
      paidAmount: Number(dbCustomer.paid_amount || 0),
      paymentStatus: dbCustomer.payment_status || 'pending',
      paymentMethod: dbCustomer.payment_method || 'cash',
      serviceStatus: dbCustomer.service_status || 'pending',
      notes: dbCustomer.notes,
      requirements: dbCustomer.requirements,
    };
  }
}

export const customerService = new CustomerService();