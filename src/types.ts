// Typy pro případ a kroky (můžete rozšířit dle potřeby)
export interface KrokPripadu {
  nazev: string;
  termin?: string;
  splneno: boolean;
  poznamka?: string;
  splnenoAt?: string;
  historie?: KrokZmena[];
  pripomenoutZa?: number;
  pripomenoutDatum?: string;
  attachments?: Attachment[];
}

export interface Krok1Data {
  co: string;
  castka: string;
  popis?: string;
}
export interface Krok2Data {
  termin: string;
  urok: string;
}
export interface Krok3Data {
  banka: string;
}

export interface PripadHypoteky {
  id: number;
  klient: string;
  poradce: string;
  aktualniKrok: number;
  krok1: Krok1Data;
  krok2: Krok2Data;
  krok3: Krok3Data;
  kroky: KrokPripadu[];
  poznamka?: string;
  archivovano?: boolean;
}

export interface KrokZmena {
  kdo: string;
  kdy: string;
  zmena: string;
  predchozi?: KrokPripadu;
  nove?: KrokPripadu;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface DashboardProps {
  pripady: PripadHypoteky[];
  KROKY: string[];
  poradci: string[];
  poradce: string;
  setPoradce: (v: string) => void;
  stavKrokuFilter: string;
  setStavKrokuFilter: (v: string) => void;
  zobrazArchivovane: boolean;
  setZobrazArchivovane: (v: boolean) => void;
  dashboardPrefs: {
    showSuccess: boolean;
    showPipeline: boolean;
    showAvgTime?: boolean;
    showHeatmap?: boolean;
  };
  setDashboardPrefs: (v: DashboardProps['dashboardPrefs']|((prev: DashboardProps['dashboardPrefs'])=>DashboardProps['dashboardPrefs'])) => void;
  isMobile: boolean;
  search: string;
  setSearch: (v: string) => void;
  bankaFilter: string;
  setBankaFilter: (v: string) => void;
  terminFilter: string;
  setTerminFilter: (v: string) => void;
}

export interface PripadCardProps {
  pripad: PripadHypoteky;
  onEdit: (pripad: PripadHypoteky) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  onShowWorkflow: (id: number) => void;
}

export interface EditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Krok1Data & Krok2Data & Krok3Data & { klient: string; poradce: string; poznamka: string; attachments: Attachment[] }) => void;
  pripad?: PripadHypoteky;
  banky: string[];
  themeMode: string;
}

export interface HistoryDialogProps {
  open: boolean;
  onClose: () => void;
  krok?: KrokPripadu;
  themeMode: string;
}

export interface WorkflowDialogProps {
  open: boolean;
  onClose: () => void;
  pripad?: PripadHypoteky;
  themeMode: string;
}

export interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  themeMode: string;
}

export type UserRole = 'poradce' | 'manazer' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface DemoUser {
  username: string;
  password: string;
  role: UserRole;
}

export interface UndoRedoEntry {
  pripadId: number;
  prev: PripadHypoteky;
  next: PripadHypoteky;
  kdy: string;
  kdo: string;
  popis: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  data: {
    poradce: string;
    stavKrokuFilter: string;
    zobrazArchivovane: boolean;
    bankaFilter: string;
    terminFilter: string;
    search: string;
  };
  createdAt: string;
}

export interface DashboardReport {
  date: string;
  stats: {
    total: number;
    completed: number;
    archived: number;
    byAdvisor: Record<string, number>;
    byBank: Record<string, number>;
  };
}
