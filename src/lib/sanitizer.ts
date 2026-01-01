// Input sanitization utilities
export class InputSanitizer {
  // Sanitize HTML content to prevent XSS
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  // Sanitize log input to prevent log injection
  static sanitizeLog(input: any): string {
    if (typeof input !== 'string') {
      input = String(input);
    }
    
    return input
      .replace(/\r\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\t/g, ' ')
      .substring(0, 1000); // Limit length
  }
  
  // Sanitize URL to prevent SSRF
  static sanitizeUrl(url: string): string {
    if (typeof url !== 'string') return '';
    
    try {
      const parsed = new URL(url);
      
      // Only allow https and http protocols
      if (!['https:', 'http:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      // Block private IP ranges
      const hostname = parsed.hostname;
      if (this.isPrivateIP(hostname)) {
        throw new Error('Private IP not allowed');
      }
      
      return parsed.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }
  
  // Check if IP is in private range
  private static isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];
    
    return privateRanges.some(range => range.test(hostname));
  }
  
  // Validate and sanitize user input
  static sanitizeUserInput(input: any): string {
    if (typeof input !== 'string') {
      input = String(input);
    }
    
    return input
      .trim()
      .substring(0, 5000) // Reasonable length limit
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }
}

// Safe logging utility
export const safeLog = {
  info: (message: string, data?: any) => {
    console.info(InputSanitizer.sanitizeLog(message), data ? InputSanitizer.sanitizeLog(data) : '');
  },
  
  error: (message: string, error?: any) => {
    console.error(InputSanitizer.sanitizeLog(message), error ? InputSanitizer.sanitizeLog(error) : '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn(InputSanitizer.sanitizeLog(message), data ? InputSanitizer.sanitizeLog(data) : '');
  }
};