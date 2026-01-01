/**
 * Custom Error classes for KSM.ART HOUSE
 */

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /**
   * Create an ApiError from a Supabase error
   */
  static fromSupabase(error: any): ApiError {
    // Map Supabase error codes to user-friendly messages
    let message = error.message || 'An unexpected database error occurred';
    let status = 500;

    if (error.code === 'PGRST116') {
      message = 'The requested record was not found.';
      status = 404;
    } else if (error.code === '23505') {
      message = 'This record already exists.';
      status = 409;
    } else if (error.code === '42501') {
      message = 'You do not have permission to perform this action.';
      status = 403;
    }

    return new ApiError(message, status, error.code, error);
  }
}
