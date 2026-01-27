export type WarrantyStatus = 'Offen' | 'In Bearbeitung' | 'Erledigt' | 'Mangel abgelehnt';

export interface UploadedFile {
  id?: string;           // Optional für Kompatibilität
  name: string;
  type: string;
  size: number;
  url?: string;          // Blob URL (statt dataUrl)
  dataUrl?: string;      // Behalten für Rückwärtskompatibilität
  uploadedAt?: string;
}

export interface WarrantySubmission {
  id: string;
  timestamp: string;
  vorname: string;
  nachname: string;
  strasseHausnummer: string;
  plz: string;
  ort: string;
  tcNummer: string;
  email: string;
  telefon: string;
  beschreibung: string;
  files: UploadedFile[];
  dsgvoAccepted: boolean;
  status: WarrantyStatus;
  ersteFrist?: string | null;
  zweiteFrist?: string | null;
  erledigtAm?: string | null;
  haustyp?: string | null;
  bauleitung?: string | null;
  abnahme?: string | null;
  verantwortlicher?: string | null;
  gewerk?: string | null;
  firma?: string | null;
}

export interface WarrantyFormData {
  vorname: string;
  nachname: string;
  strasseHausnummer: string;
  plz: string;
  ort: string;
  tcNummer: string;
  email: string;
  telefon: string;
  beschreibung: string;
  haustyp?: string;
  bauleitung?: string;
  abnahme?: string;
  verantwortlicher?: string;
  gewerk?: string;
  firma?: string;
  files: File[];
  dsgvoAccepted: boolean;
}

export interface FormErrors {
  [key: string]: string | undefined;
}
