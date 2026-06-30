const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('prelegal_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader() },
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
    list: () => request<SavedDocument[]>('/api/documents'),
    get: (id: number) => request<SavedDocument>(`/api/documents/${id}`),
    create: (payload: DocumentCreate) =>
      request<SavedDocument>('/api/documents', { method: 'POST', body: JSON.stringify(payload) }),
    delete: (id: number) =>
      fetch(`${BASE}/api/documents/${id}`, { method: 'DELETE', headers: authHeader() }),
  },

  chat: (messages: ChatMessage[], currentFields: Record<string, unknown>, docType: string | null = null) =>
    request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, current_fields: currentFields, doc_type: docType }),
    }),
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  fields: Record<string, unknown>;
  doc_type: string | null;
}

export interface SavedDocument {
  id: number;
  user_id: number;
  title: string;
  template_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  title: string;
  template_type: string;
  content: string;
}
