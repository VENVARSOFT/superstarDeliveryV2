import {tokenStorage} from '@state/storage';
import {refresh_tokens} from '@service/authService';

export interface TokenData {
  token: string;
  refreshToken: string;
  tokenExpiry: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<string | null> | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Check if token is expired or will expire within the next 5 minutes
   */
  isTokenExpired(): boolean {
    const tokenExpiry = tokenStorage.getString('tokenExpiry');
    if (!tokenExpiry) {
      return true;
    }

    const expiryTime = new Date(tokenExpiry).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds

    return currentTime >= expiryTime - fiveMinutesInMs;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return tokenStorage.getString('accessToken') ?? null;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return tokenStorage.getString('refreshToken') ?? null;
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry(): string | null {
    return tokenStorage.getString('tokenExpiry') ?? null;
  }

  /**
   * Store tokens securely
   */
  storeTokens(tokenData: TokenData): void {
    tokenStorage.set('accessToken', tokenData.token);
    tokenStorage.set('refreshToken', tokenData.refreshToken);
    tokenStorage.set('tokenExpiry', tokenData.tokenExpiry);
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    tokenStorage.delete('accessToken');
    tokenStorage.delete('refreshToken');
    tokenStorage.delete('tokenExpiry');
    tokenStorage.delete('userId');
  }

  /**
   * Get valid access token, refresh if needed
   */
  async getValidAccessToken(): Promise<string | null> {
    // If token is not expired, return current token
    if (!this.isTokenExpired()) {
      return this.getAccessToken();
    }

    // If refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start refresh process
    this.refreshPromise = this.refreshAccessToken();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const newAccessToken = await refresh_tokens();
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const tokenExpiry = this.getTokenExpiry();

    // Check if we have all required tokens
    if (!token || !refreshToken || !tokenExpiry) {
      return false;
    }

    // Check if token is not expired
    return !this.isTokenExpired();
  }

  /**
   * Get time until token expires in milliseconds
   */
  getTimeUntilExpiry(): number {
    const tokenExpiry = this.getTokenExpiry();
    if (!tokenExpiry) {
      return 0;
    }

    const expiryTime = new Date(tokenExpiry).getTime();
    const currentTime = new Date().getTime();
    return Math.max(0, expiryTime - currentTime);
  }

  /**
   * Get time until token expires in minutes
   */
  getTimeUntilExpiryInMinutes(): number {
    return Math.floor(this.getTimeUntilExpiry() / (1000 * 60));
  }
}

export const tokenManager = TokenManager.getInstance();
