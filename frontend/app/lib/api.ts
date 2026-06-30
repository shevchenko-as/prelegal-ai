const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; version: string }>('/api/health'),

  templates: {
    list: () => request<{ name: string; description: string; filename: string }[]>('/api/templates'),
  },

  documents: {
    list: () => request<Document[]>('/api/documents'),
    get: (id: number) => request<Document>(`/api/documents/${id}`),
    create: (payload: DocumentCreate) =>
      request<Document>('/api/documents', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: number, payload: DocumentCreate) =>
      request<Document>(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: number) =>
      fetch(`${BASE}/api/documents/${id}`, { method: 'DELETE' }),
  },

  chat: (messages: ChatMessage[], currentFields: Record<string, unknown>) =>
    request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, current_fields: currentFields }),
    }),
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  fields: Record<string, unknown>;
}

export interface Document {
  id: number;
  title: string;
  template_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  title: string;
  template_type?: string;
  content: string;
}
