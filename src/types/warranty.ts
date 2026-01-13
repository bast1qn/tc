export type WarrantyStatus = 'Offen' | 'In Bearbeitung' | 'Erledigt';

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
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
  files: File[];
  dsgvoAccepted: boolean;
}

export interface FormErrors {
  [key: string]: string | undefined;
}
