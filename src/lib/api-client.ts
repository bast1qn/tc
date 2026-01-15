import type { WarrantySubmission, WarrantyStatus } from '@/types/warranty';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new APIError(response.status, error.error || 'API request failed');
  }

  return response.json();
}

export const submissionsAPI = {
  getAll: (params?: {
    status?: WarrantyStatus | 'Alle';
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'Alle') searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    return fetchAPI<{ submissions: WarrantySubmission[]; total: number }>(
      `/api/submissions?${searchParams}`
    );
  },

  create: async (data: FormData) => {
    const response = await fetch('/api/submissions', {
      method: 'POST',
      body: data,
    });
    if (!response.ok) throw new APIError(response.status, 'Submission failed');
    return response.json();
  },

  updateStatus: (id: string, status: WarrantyStatus) =>
    fetchAPI<{ submission: WarrantySubmission }>(`/api/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updateFristen: (id: string, ersteFrist?: string | null, zweiteFrist?: string | null) =>
    fetchAPI<{ submission: WarrantySubmission }>(`/api/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ersteFrist, zweiteFrist }),
    }),

  updateField: (id: string, field: string, value: string | null) =>
    fetchAPI<{ submission: WarrantySubmission }>(`/api/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value }),
    }),

  delete: (id: string) =>
    fetchAPI<{ success: boolean }>(`/api/submissions/${id}`, {
      method: 'DELETE',
    }),

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('File upload failed');
    return response.json();
  },
};
