'use client';

const SESSION_KEY = 'prelegal_user';

export function getUser(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_KEY);
}

export function login(email: string): void {
  localStorage.setItem(SESSION_KEY, email);
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return !!getUser();
}
