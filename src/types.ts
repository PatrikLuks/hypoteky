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

export interface PripadHypoteky {
  id: number;
  klient: string;
  poradce: string;
  aktualniKrok: number;
  krok1: any;
  krok2: any;
  krok3: any;
  kroky: KrokPripadu[];
  poznamka?: string;
  archivovano?: boolean;
}

export interface KrokZmena {
  kdo: string;
  kdy: string;
  zmena: string;
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
  aktivniPoradce: string;
  setAktivniPoradce: (v: string) => void;
  stavKrokuFilter: string;
  setStavKrokuFilter: (v: string) => void;
  zobrazArchivovane: boolean;
  setZobrazArchivovane: (v: boolean) => void;
  dashboardPrefs: any;
  setDashboardPrefs: (v: any) => void;
  isMobile: boolean;
  search: string;
  setSearch: (v: string) => void;
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
  onSave: (data: any) => void;
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
