import {
  AuthResponse,
  ContributionRequest,
  ContributionResponse,
  ContributionTotalResponse,
  HoldingResponse,
  IpoHoldingRequest,
  IpoHoldingResponse,
  LoginRequest,
  PortfolioSummaryResponse,
  SignupCreateGroupRequest,
  SignupJoinGroupRequest,
  TradeRequest,
  TradeResponse,
  ValuationSnapshotRequest,
  ValuationSnapshotResponse,
} from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('poolfolio_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    let errorData = null;
    try {
      const text = await response.text();
      try {
        errorData = JSON.parse(text);
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {
        if (text) errorMsg = text;
      }
    } catch {
      // Keep fallback
    }

    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('poolfolio_token');
      localStorage.removeItem('poolfolio_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }

    throw new ApiError(errorMsg, response.status, errorData);
  }

  // Check if no content returned
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export const api = {
  // Auth
  auth: {
    login: (data: LoginRequest) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    signupCreateGroup: (data: SignupCreateGroupRequest) =>
      request<AuthResponse>('/auth/signup/create-group', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    signupJoinGroup: (data: SignupJoinGroupRequest) =>
      request<AuthResponse>('/auth/signup/join-group', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Contributions
  contributions: {
    create: (data: ContributionRequest) =>
      request<ContributionResponse>('/contributions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMyHistory: () =>
      request<ContributionResponse[]>('/contributions/me'),

    getMyTotal: () =>
      request<ContributionTotalResponse>('/contributions/me/total'),

    getGroupTotal: () =>
      request<ContributionTotalResponse>('/contributions/group/total'),
  },

  // Trades
  trades: {
    getAll: () =>
      request<TradeResponse[]>('/trades'),

    getById: (id: number) =>
      request<TradeResponse>(`/trades/${id}`),

    create: (data: TradeRequest) =>
      request<TradeResponse>('/trades', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: TradeRequest) =>
      request<TradeResponse>(`/trades/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<void>(`/trades/${id}`, {
        method: 'DELETE',
      }),
  },

  // Holdings
  holdings: {
    getAll: () =>
      request<HoldingResponse[]>('/holdings'),

    getBySymbol: (symbol: string) =>
      request<HoldingResponse>(`/holdings/${symbol}`),
  },

  // IPO Holdings
  ipoHoldings: {
    getAll: () =>
      request<IpoHoldingResponse[]>('/ipo-holdings'),

    create: (data: IpoHoldingRequest) =>
      request<IpoHoldingResponse>('/ipo-holdings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: IpoHoldingRequest) =>
      request<IpoHoldingResponse>(`/ipo-holdings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request<void>(`/ipo-holdings/${id}`, {
        method: 'DELETE',
      }),
  },

  // Portfolio
  portfolio: {
    getSummary: () =>
      request<PortfolioSummaryResponse>('/portfolio/summary'),
  },

  // Valuations
  valuations: {
    createSnapshot: (data: ValuationSnapshotRequest) =>
      request<ValuationSnapshotResponse>('/valuations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getLatest: () =>
      request<ValuationSnapshotResponse>('/valuations/latest'),

    getById: (id: number) =>
      request<ValuationSnapshotResponse>(`/valuations/${id}`),
  },
};
