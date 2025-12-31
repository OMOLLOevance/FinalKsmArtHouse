import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Validation schemas for Supabase operations
export const SupabaseQuerySchema = z.object({
  table: z.string(),
  select: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  orderBy: z.object({
    column: z.string(),
    ascending: z.boolean().optional(),
  }).optional(),
  limit: z.number().optional(),
});

export type SupabaseQuery = z.infer<typeof SupabaseQuerySchema>;

class SupabaseService {
  private client = supabase;

  async query<T>(params: SupabaseQuery): Promise<T[]> {
    const validatedParams = SupabaseQuerySchema.parse(params);
    
    let query = this.client
      .from(validatedParams.table)
      .select(validatedParams.select || '*');

    // Apply filters
    if (validatedParams.filters) {
      Object.entries(validatedParams.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (validatedParams.orderBy) {
      query = query.order(validatedParams.orderBy.column, { 
        ascending: validatedParams.orderBy.ascending ?? true 
      });
    }

    // Apply limit
    if (validatedParams.limit) {
      query = query.limit(validatedParams.limit);
    }

    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return data as T[];
  }

  async insert<T>(table: string, data: any): Promise<T> {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return result as T;
  }

  async update<T>(table: string, id: string, data: any, userIdFilter?: string): Promise<T> {
    let query = this.client
      .from(table)
      .update(data)
      .eq('id', id);

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    const { data: result, error } = await query
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase update failed: ${error.message}`);
    }

    return result as T;
  }

  async delete(table: string, id: string, userIdFilter?: string): Promise<void> {
    let query = this.client
      .from(table)
      .delete()
      .eq('id', id);

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter);
    }

    const { error } = await query;

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      const { error } = await this.client.from('users').select('count').limit(1);
      return { 
        status: error ? 'error' : 'ok', 
        message: error ? error.message : 'Database connected successfully' 
      };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  getClient() {
    return this.client;
  }
}

export const supabaseService = new SupabaseService();