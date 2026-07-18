const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Type definitions for API responses
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  organizationId: string;
  teamId?: string;
  mfaEnabled: boolean;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User;
}

export interface Contract {
  id: string;
  title: string;
  description?: string;
  contractType: string;
  status: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  parties?: string[];
  effectiveDate?: string;
  expirationDate?: string;
  jurisdiction?: string;
  governingLaw?: string;
  value?: number;
  currency?: string;
  paymentTerms?: string;
  organizationId: string;
  teamId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ContractListResponse {
  data: Contract[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}

// API helper
class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else if (Array.isArray(options.headers)) {
        for (const [key, value] of options.headers) {
          headers[key] = value;
        }
      } else {
        Object.assign(headers, options.headers as Record<string, string>);
      }
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    organizationId: string;
    teamId?: string;
    role?: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Contracts
  async getContracts(options?: {
    skip?: number;
    take?: number;
    search?: string;
    contractType?: string;
    status?: string;
    teamId?: string;
  }): Promise<ContractListResponse> {
    const params = new URLSearchParams();
    if (options?.skip) params.set('skip', options.skip.toString());
    if (options?.take) params.set('take', options.take.toString());
    if (options?.search) params.set('search', options.search);
    if (options?.contractType) params.set('contractType', options.contractType);
    if (options?.status) params.set('status', options.status);
    if (options?.teamId) params.set('teamId', options.teamId);

    return this.request<ContractListResponse>(`/contracts?${params.toString()}`);
  }

  async getContract(id: string): Promise<Contract> {
    return this.request<Contract>(`/contracts/${id}`);
  }

  async createContract(data: {
    title: string;
    description?: string;
    contractType: string;
    status?: string;
    teamId?: string;
    parties?: string[];
    effectiveDate?: string;
    expirationDate?: string;
    jurisdiction?: string;
    governingLaw?: string;
    value?: number;
    currency?: string;
    paymentTerms?: string;
  }): Promise<Contract> {
    return this.request<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadContractFile(id: string, file: File): Promise<Contract> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/contracts/${id}/upload`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return response.json();
  }

  async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    return this.request<Contract>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async archiveContract(id: string): Promise<void> {
    return this.request<void>(`/contracts/${id}/archive`, {
      method: 'POST',
    });
  }

  async restoreContract(id: string): Promise<Contract> {
    return this.request<Contract>(`/contracts/${id}/restore`, {
      method: 'POST',
    });
  }

  async deleteContract(id: string): Promise<void> {
    return this.request<void>(`/contracts/${id}`, {
      method: 'DELETE',
    });
  }

  async getContractStats() {
    return this.request('/contracts/stats');
  }
}

export const api = new ApiClient();
