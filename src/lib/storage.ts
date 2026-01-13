import { v4 as uuidv4 } from 'uuid';
import type { WarrantySubmission, WarrantyFormData, UploadedFile, WarrantyStatus } from '@/types/warranty';

const STORAGE_KEY = 'tc_warranty_submissions';

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getSubmissions(): WarrantySubmission[] {
  if (!isLocalStorageAvailable()) {
    throw new StorageError('localStorage ist nicht verfügbar');
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const submissions = JSON.parse(data) as WarrantySubmission[];
    return submissions.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error);
    throw new StorageError('Fehler beim Laden der gespeicherten Anfragen');
  }
}

export function saveSubmissions(submissions: WarrantySubmission[]): void {
  if (!isLocalStorageAvailable()) {
    throw new StorageError('localStorage ist nicht verfügbar');
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new StorageError('Speicherplatz voll. Bitte löschen Sie alte Anfragen.');
    }
    console.error('Fehler beim Speichern:', error);
    throw new StorageError('Fehler beim Speichern der Daten');
  }
}

export async function fileToDataUrl(file: File): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result as string,
      });
    };
    reader.onerror = () => {
      reject(new Error(`Fehler beim Lesen der Datei: ${file.name}`));
    };
    reader.readAsDataURL(file);
  });
}

export async function addSubmission(formData: WarrantyFormData): Promise<WarrantySubmission> {
  const uploadedFiles: UploadedFile[] = [];

  for (const file of formData.files) {
    const uploadedFile = await fileToDataUrl(file);
    uploadedFiles.push(uploadedFile);
  }

  const submission: WarrantySubmission = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    vorname: formData.vorname,
    nachname: formData.nachname,
    strasseHausnummer: formData.strasseHausnummer,
    plz: formData.plz,
    ort: formData.ort,
    tcNummer: formData.tcNummer,
    email: formData.email,
    telefon: formData.telefon,
    beschreibung: formData.beschreibung,
    files: uploadedFiles,
    dsgvoAccepted: formData.dsgvoAccepted,
    status: 'Offen',
  };

  const submissions = getSubmissions();
  submissions.unshift(submission);
  saveSubmissions(submissions);

  return submission;
}

export function updateSubmissionStatus(id: string, status: WarrantyStatus): void {
  const submissions = getSubmissions();
  const index = submissions.findIndex(s => s.id === id);

  if (index === -1) {
    throw new StorageError('Anfrage nicht gefunden');
  }

  submissions[index].status = status;
  saveSubmissions(submissions);
}

export function deleteSubmission(id: string): void {
  const submissions = getSubmissions();
  const filtered = submissions.filter(s => s.id !== id);

  if (filtered.length === submissions.length) {
    throw new StorageError('Anfrage nicht gefunden');
  }

  saveSubmissions(filtered);
}

export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
