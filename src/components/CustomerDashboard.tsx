"use client";

import { FileImage, Download, Calendar, User, Building2, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WarrantySubmission } from "@/types/warranty";

const statusColors: Record<string, string> = {
  Offen: "bg-red-100 text-red-800 border-red-200",
  "In Bearbeitung": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Erledigt: "bg-green-100 text-green-800 border-green-200",
  "Mangel abgelehnt": "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  Offen: <XCircle className="w-5 h-5 text-red-600" />,
  "In Bearbeitung": <Clock className="w-5 h-5 text-yellow-600" />,
  Erledigt: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  "Mangel abgelehnt": <XCircle className="w-5 h-5 text-gray-600" />,
};

interface CustomerDashboardProps {
  submission: WarrantySubmission;
  onClose: () => void;
}

export default function CustomerDashboard({ submission, onClose }: CustomerDashboardProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={!!submission} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Meldungsdetails</DialogTitle>
          <DialogDescription>
            Eingereicht am {formatDate(submission.timestamp)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            submission.status === "Erledigt"
              ? "bg-green-50 border-green-200"
              : submission.status === "In Bearbeitung"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"
          }`}>
            {statusIcons[submission.status]}
            <div>
              <p className="font-medium">Status: {submission.status}</p>
              {submission.erledigtAm && (
                <p className="text-sm text-gray-600">
                  Erledigt am {formatDate(submission.erledigtAm)}
                </p>
              )}
            </div>
          </div>

          {/* Kundeninformationen */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Ihre Informationen
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium">
                    {submission.vorname} {submission.nachname}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">TC-Nummer</p>
                  <p className="font-medium font-mono">{submission.tcNummer}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Adresse</p>
                <p className="font-medium">
                  {submission.strasseHausnummer}
                  <br />
                  {submission.plz} {submission.ort}
                </p>
              </div>
            </div>
          </div>

          {/* Bearbeitungsinformationen */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Bearbeitung
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {submission.gewerk && (
                  <div>
                    <p className="text-xs text-gray-500">Gewerk</p>
                    <p className="font-medium">{submission.gewerk}</p>
                  </div>
                )}
                {submission.firma && (
                  <div>
                    <p className="text-xs text-gray-500">Firma</p>
                    <p className="font-medium">{submission.firma}</p>
                  </div>
                )}
                {submission.bauleitung && (
                  <div>
                    <p className="text-xs text-gray-500">Bauleitung</p>
                    <p className="font-medium">{submission.bauleitung}</p>
                  </div>
                )}
                {submission.verantwortlicher && (
                  <div>
                    <p className="text-xs text-gray-500">Verantwortlicher</p>
                    <p className="font-medium">{submission.verantwortlicher}</p>
                  </div>
                )}
              </div>

              {/* Fristen */}
              {(submission.ersteFrist || submission.zweiteFrist) && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fristen
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {submission.ersteFrist && (
                      <div>
                        <p className="text-xs text-gray-500">1. Frist</p>
                        <p className="font-medium">{formatDate(submission.ersteFrist)}</p>
                      </div>
                    )}
                    {submission.zweiteFrist && (
                      <div>
                        <p className="text-xs text-gray-500">2. Frist</p>
                        <p className="font-medium">{formatDate(submission.zweiteFrist)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Beschreibung */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Beschreibung</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="whitespace-pre-wrap">{submission.beschreibung}</p>
            </div>
          </div>

          {/* Dateien */}
          {submission.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3">
                Hochgeladene Dateien ({submission.files.length})
              </h3>
              <div className="space-y-2">
                {submission.files.map((file) => (
                  <a
                    key={file.id}
                    href={file.url || file.dataUrl}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <FileImage className="w-8 h-8 text-gray-400 group-hover:text-[#E30613] transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-[#E30613] transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status-Historie */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Status-Verlauf</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-[#E30613] rounded-full" />
                  <div className="w-0.5 h-full bg-gray-200" />
                </div>
                <div className="pb-4">
                  <p className="font-medium">Meldung eingereicht</p>
                  <p className="text-sm text-gray-500">{formatDate(submission.timestamp)}</p>
                </div>
              </div>

              {submission.ersteFrist && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      new Date(submission.ersteFrist) < new Date()
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`} />
                    <div className="w-0.5 h-full bg-gray-200" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">1. Frist gesetzt</p>
                    <p className="text-sm text-gray-500">{formatDate(submission.ersteFrist)}</p>
                  </div>
                </div>
              )}

              {submission.status === "In Bearbeitung" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    <div className="w-0.5 h-full bg-gray-200" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-yellow-700">In Bearbeitung</p>
                    <p className="text-sm text-gray-500">Ihre Anfrage wird bearbeitet</p>
                  </div>
                </div>
              )}

              {submission.status === "Erledigt" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Erledigt</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(submission.erledigtAm)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
