"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, FileImage, Calendar, User, MapPin, Phone, Mail, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

interface SubmissionData {
  id: string;
  tcNummer: string;
  vorname: string;
  nachname: string;
  strasseHausnummer: string;
  plz: string;
  ort: string;
  email: string;
  telefon: string;
  beschreibung: string;
  haustyp?: string;
  bauleitung?: string;
  abnahme?: string;
  verantwortlicher?: string;
  gewerk?: string;
  firma?: string;
  status: string;
  ersteFrist?: string | null;
  zweiteFrist?: string | null;
  erledigtAm?: string | null;
  timestamp: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bgColor: string }> = {
  "Offen": { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-100" },
  "In Bearbeitung": { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100" },
  "Erledigt": { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" },
  "Mangel abgelehnt": { icon: XCircle, color: "text-gray-600", bgColor: "bg-gray-100" },
};

export default function TrackingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;

  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);

  const [formData, setFormData] = useState({
    plz: searchParams.get('plz') || '',
    email: searchParams.get('email') || '',
  });

  // Auto-verify if params are provided
  useEffect(() => {
    if (formData.plz && formData.email) {
      handleVerify();
    }
  }, []);

  const handleVerify = async () => {
    if (!formData.plz || !formData.email) {
      setError('Bitte geben Sie Ihre Postleitzahl und E-Mail-Adresse ein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/track/${token}?plz=${encodeURIComponent(formData.plz)}&email=${encodeURIComponent(formData.email)}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verifikation fehlgeschlagen');
      }

      const data = await response.json();

      if (data.verified) {
        setVerified(true);
        setSubmission(data.submission);
      } else {
        setError('Verifikation fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Logo/Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#E30613] rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Status verfolgen</h1>
              <p className="text-gray-600 mt-2">
                Geben Sie Ihre Daten ein, um den Status Ihrer Meldung zu sehen.
              </p>
            </div>

            {/* Verification Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postleitzahl *
                </label>
                <input
                  type="text"
                  value={formData.plz}
                  onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                  placeholder="z.B. 12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
                  maxLength={5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ihre@email.de"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E30613] focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-[#E30613] hover:bg-[#C00510] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Wird geladen...
                  </>
                ) : (
                  'Zum Status'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Diese Informationen schützen Ihre Daten vor unbefugtem Zugriff.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) return null;

  const statusInfo = statusConfig[submission.status] || statusConfig["Offen"];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                TC-{submission.tcNummer}
              </h1>
              <p className="text-gray-600">
                Gemeldet am {formatDate(submission.timestamp)}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full ${statusInfo.bgColor} ${statusInfo.color} font-semibold flex items-center gap-2`}>
              <StatusIcon className="w-5 h-5" />
              {submission.status}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#E30613]" />
            Kundendaten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{submission.vorname} {submission.nachname}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">TC-Nummer</p>
              <p className="font-medium font-mono">{submission.tcNummer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Adresse</p>
              <p className="font-medium">
                {submission.strasseHausnummer}
                <br />
                {submission.plz} {submission.ort}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Kontakt</p>
              <p className="font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {submission.telefon || '-'}
              </p>
              <p className="font-medium flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {submission.email}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Beschreibung</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-wrap text-gray-700">{submission.beschreibung}</p>
          </div>
        </div>

        {/* Processing Details */}
        {(submission.bauleitung || submission.gewerk || submission.firma || submission.verantwortlicher) && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bearbeitung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submission.bauleitung && (
                <div>
                  <p className="text-sm text-gray-500">Bauleitung</p>
                  <p className="font-medium">{submission.bauleitung}</p>
                </div>
              )}
              {submission.verantwortlicher && (
                <div>
                  <p className="text-sm text-gray-500">Verantwortliche/r</p>
                  <p className="font-medium">{submission.verantwortlicher}</p>
                </div>
              )}
              {submission.gewerk && (
                <div>
                  <p className="text-sm text-gray-500">Gewerk</p>
                  <p className="font-medium">{submission.gewerk}</p>
                </div>
              )}
              {submission.firma && (
                <div>
                  <p className="text-sm text-gray-500">Firma</p>
                  <p className="font-medium">{submission.firma}</p>
                </div>
              )}
              {submission.abnahme && (
                <div>
                  <p className="text-sm text-gray-500">Abnahme</p>
                  <p className="font-medium">{submission.abnahme}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deadlines */}
        {(submission.ersteFrist || submission.zweiteFrist || submission.erledigtAm) && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E30613]" />
              Fristen
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">1. Frist</p>
                <p className="font-medium">{formatDate(submission.ersteFrist)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">2. Frist</p>
                <p className="font-medium">{formatDate(submission.zweiteFrist)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Erledigt am</p>
                <p className="font-medium">{formatDate(submission.erledigtAm)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Files */}
        {submission.files && submission.files.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileImage className="w-5 h-5 text-[#E30613]" />
              Hochgeladene Dateien ({submission.files.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {submission.files.map((file, index) => (
                <a
                  key={index}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FileImage className="w-8 h-8 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Town & Country Gewährleistungssystem</p>
          <p className="mt-1">
            Bei Fragen erreichen Sie uns unter{' '}
            <a href="mailto:hilfe@hauswunsch24.de" className="text-[#E30613] hover:underline">
              hilfe@hauswunsch24.de
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
