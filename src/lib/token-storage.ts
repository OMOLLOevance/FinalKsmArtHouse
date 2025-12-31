// Secure token storage utility
class SecureTokenStorage {
  private readonly TOKEN_KEY = 'auth_token';
  
  // Store token securely (in production, consider httpOnly cookies)
  setToken(token: string): void {
    try {
      // In development, use localStorage with encryption
      const encrypted = this.encrypt(token);
      localStorage.setItem(this.TOKEN_KEY, encrypted);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }
  
  // Retrieve token securely
  getToken(): string | null {
    try {
      const encrypted = localStorage.getItem(this.TOKEN_KEY);
      if (!encrypted) return null;
      
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }
  
  // Remove token
  removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }
  
  // Simple encryption (in production, use proper encryption)
  private encrypt(text: string): string {
    // Basic obfuscation - in production use proper encryption
    return btoa(text);
  }
  
  // Simple decryption
  private decrypt(encrypted: string): string {
    try {
      return atob(encrypted);
    } catch {
      throw new Error('Invalid token format');
    }
  }
}

export const tokenStorage = new SecureTokenStorage();