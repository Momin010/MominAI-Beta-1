interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private readonly API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.decodeUserFromToken();
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      this.setToken(data.token);
      this.user = data.user;

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data: AuthResponse = await response.json();
      this.setToken(data.token);
      this.user = data.user;

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  private decodeUserFromToken(): void {
    if (!this.token) return;

    try {
      // Decode JWT token (simple decode, not verify)
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      this.user = {
        id: payload.id,
        email: payload.email,
        username: payload.username,
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      this.logout();
    }
  }

  // Refresh token if needed
  async refreshToken(): Promise<void> {
    if (!this.token) return;

    try {
      // For now, just validate the current token
      // In a real app, you'd call a refresh endpoint
      const response = await fetch(`${this.API_BASE}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        throw new Error('Token invalid');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }
}

// Singleton instance
export const authService = new AuthService();
export default authService;