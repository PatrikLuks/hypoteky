// Utility funkce pro hypotéky
import { create } from 'zustand';
import type { PripadHypoteky, DemoUser, UndoRedoEntry } from './types';

const DEMO_USERS_KEY = 'demoUsers';
const DEMO_AUTH_KEY = 'demoAuthUser';

interface PripadyState {
  pripady: PripadHypoteky[];
  setPripady: (pripady: PripadHypoteky[]) => void;
  addPripad: (pripad: PripadHypoteky) => void;
  updatePripad: (pripad: PripadHypoteky) => void;
  deletePripad: (id: number) => void;
}

export const usePripadyStore = create<PripadyState>((set, get) => ({
  pripady: [],
  setPripady: (pripady) => set({ pripady }),
  addPripad: (pripad) => set({ pripady: [...get().pripady, pripad] }),
  updatePripad: (pripad) => set({ pripady: get().pripady.map(p => p.id === pripad.id ? pripad : p) }),
  deletePripad: (id) => set({ pripady: get().pripady.filter(p => p.id !== id) }),
}));

/**
 * Vrací pole upozornění na blížící se termíny v případu (do 7 dnů).
 * @param pripad Případ hypotéky
 */
export function bliziciSeTerminy(pripad: PripadHypoteky): string[] {
  const dnes = new Date();
  const limit = new Date(dnes);
  limit.setDate(dnes.getDate() + 7);
  const upozorneni: string[] = [];
  if (pripad.krok2.termin) {
    const t = new Date(pripad.krok2.termin);
    if (t > dnes && t <= limit) upozorneni.push(`Návrh financování: ${pripad.krok2.termin}`);
  }
  pripad.kroky.forEach((krok) => {
    if (krok.termin) {
      const t = new Date(krok.termin);
      if (!krok.splneno && t > dnes && t <= limit) {
        upozorneni.push(`${krok.nazev}: ${krok.termin}`);
      }
    }
  });
  return upozorneni;
}

export function getDemoUsers(): DemoUser[] {
  return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
}

export function saveDemoUsers(users: DemoUser[]) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

export function registerDemoUser(user: DemoUser): boolean {
  const users = getDemoUsers();
  if (users.some(u => u.username === user.username)) return false;
  users.push(user);
  saveDemoUsers(users);
  return true;
}

export function loginDemoUser(username: string, password: string): DemoUser | null {
  const users = getDemoUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function logoutDemoUser() {
  localStorage.removeItem(DEMO_AUTH_KEY);
}

export function getCurrentDemoUser(): DemoUser | null {
  const data = localStorage.getItem(DEMO_AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

function getUndoKey(id: number) { return `undoStack-${id}`; }
function getRedoKey(id: number) { return `redoStack-${id}`; }

export function addUndoEntry(pripad: PripadHypoteky, prev: PripadHypoteky, kdo: string, popis: string) {
  const stack: UndoRedoEntry[] = JSON.parse(localStorage.getItem(getUndoKey(pripad.id)) || '[]');
  stack.push({ pripadId: pripad.id, prev, next: pripad, kdy: new Date().toISOString(), kdo, popis });
  localStorage.setItem(getUndoKey(pripad.id), JSON.stringify(stack));
  // Po každé změně vyčistit redo stack
  localStorage.removeItem(getRedoKey(pripad.id));
}

export function getUndoStack(id: number): UndoRedoEntry[] {
  return JSON.parse(localStorage.getItem(getUndoKey(id)) || '[]');
}
export function getRedoStack(id: number): UndoRedoEntry[] {
  return JSON.parse(localStorage.getItem(getRedoKey(id)) || '[]');
}

export function undoPripad(pripad: PripadHypoteky): PripadHypoteky | null {
  const stack = getUndoStack(pripad.id);
  if (stack.length === 0) return null;
  const last = stack.pop()!;
  // Uložit do redo stacku
  const redo = getRedoStack(pripad.id);
  redo.push(last);
  localStorage.setItem(getUndoKey(pripad.id), JSON.stringify(stack));
  localStorage.setItem(getRedoKey(pripad.id), JSON.stringify(redo));
  return last.prev;
}

export function redoPripad(pripad: PripadHypoteky): PripadHypoteky | null {
  const redo = getRedoStack(pripad.id);
  if (redo.length === 0) return null;
  const entry = redo.pop()!;
  // Uložit zpět do undo stacku
  const stack = getUndoStack(pripad.id);
  stack.push(entry);
  localStorage.setItem(getUndoKey(pripad.id), JSON.stringify(stack));
  localStorage.setItem(getRedoKey(pripad.id), JSON.stringify(redo));
  return entry.next;
}
