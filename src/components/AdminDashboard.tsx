"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  Eye,
  FileImage,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import {
  formatTimestamp,
  formatFileSize,
} from "@/lib/storage";
import { submissionsAPI, APIError } from "@/lib/api-client";
import type { WarrantySubmission, WarrantyStatus } from "@/types/warranty";

type SortField = "timestamp" | "vorname" | "nachname" | "ort" | "status" | "tcNummer";
type SortDirection = "asc" | "desc";

const statusColors: Record<WarrantyStatus, string> = {
  Offen: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  "In Bearbeitung": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  Erledigt: "bg-green-100 text-green-800 hover:bg-green-200",
};

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<WarrantySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | "Alle">("Alle");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSubmission, setSelectedSubmission] = useState<WarrantySubmission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WarrantySubmission | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await submissionsAPI.getAll({
        status: statusFilter,
        search: searchTerm,
        sortBy: sortField,
        sortOrder: sortDirection,
      });
      setSubmissions(data.submissions);
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Fehler beim Laden der Daten';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleStatusChange = async (id: string, newStatus: WarrantyStatus) => {
    try {
      await submissionsAPI.updateStatus(id, newStatus);
      setSubmissions((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const updates: Partial<WarrantySubmission> = { status: newStatus };
            // Setze erledigtAm wenn Status auf "Erledigt" geändert wird
            if (newStatus === "Erledigt" && !s.erledigtAm) {
              updates.erledigtAm = new Date().toISOString();
            }
            return { ...s, ...updates };
          }
          return s;
        })
      );
      toast.success(`Status auf "${newStatus}" geändert`);
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleFristChange = async (
    id: string,
    field: 'ersteFrist' | 'zweiteFrist',
    date: Date | undefined
  ) => {
    try {
      const dateString = date ? date.toISOString() : null;
      await submissionsAPI.updateFristen(
        id,
        field === 'ersteFrist' ? dateString : undefined,
        field === 'zweiteFrist' ? dateString : undefined
      );

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, [field]: dateString } : s
        )
      );
      toast.success(`${field === 'ersteFrist' ? '1. Frist' : '2. Frist'} aktualisiert`);
    } catch (err) {
      toast.error('Fehler beim Aktualisieren der Frist');
    }
  };

  const handleDelete = (submission: WarrantySubmission) => {
    setDeleteConfirm(submission);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await submissionsAPI.delete(deleteConfirm.id);
      setSubmissions((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
      toast.success("Anfrage wurde gelöscht");
      setDeleteConfirm(null);
    } catch (err) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];

    // Filter by status
    if (statusFilter !== "Alle") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.vorname.toLowerCase().includes(term) ||
          s.nachname.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.tcNummer.toLowerCase().includes(term) ||
          s.ort.toLowerCase().includes(term) ||
          s.beschreibung.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "timestamp":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case "vorname":
          comparison = a.vorname.localeCompare(b.vorname, "de");
          break;
        case "nachname":
          comparison = a.nachname.localeCompare(b.nachname, "de");
          break;
        case "ort":
          comparison = a.ort.localeCompare(b.ort, "de");
          break;
        case "tcNummer":
          comparison = a.tcNummer.localeCompare(b.tcNummer, "de");
          break;
        case "status":
          const statusOrder = { Offen: 0, "In Bearbeitung": 1, Erledigt: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [submissions, statusFilter, searchTerm, sortField, sortDirection]);

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = filteredAndSortedSubmissions.map((s) => ({
        Datum: formatTimestamp(s.timestamp),
        Vorname: s.vorname,
        Nachname: s.nachname,
        "Straße und Hausnummer": s.strasseHausnummer,
        PLZ: s.plz,
        Ort: s.ort,
        "TC-Nummer": s.tcNummer,
        "E-Mail": s.email,
        Telefon: s.telefon,
        Beschreibung: s.beschreibung,
        "Anzahl Dateien": s.files.length,
        Status: s.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Gewährleistungsanfragen");

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      worksheet["!cols"] = colWidths;

      const fileName = `gewaehrleistungsanfragen_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success("Export erfolgreich", {
        description: `${filteredAndSortedSubmissions.length} Einträge exportiert`,
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export fehlgeschlagen");
    } finally {
      setIsExporting(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      offen: submissions.filter((s) => s.status === "Offen").length,
      inBearbeitung: submissions.filter((s) => s.status === "In Bearbeitung").length,
      erledigt: submissions.filter((s) => s.status === "Erledigt").length,
    };
  }, [submissions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#E30613] mx-auto animate-spin mb-4" />
          <p className="text-gray-600">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Fehler beim Laden</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadSubmissions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Offen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.offen}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">In Bearbeitung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.inBearbeitung}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Erledigt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.erledigt}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Suchen nach Name, E-Mail, TC-Nummer, Ort..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as WarrantyStatus | "Alle")}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alle">Alle Status</SelectItem>
                  <SelectItem value="Offen">Offen</SelectItem>
                  <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="Erledigt">Erledigt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadSubmissions}
                variant="outline"
                size="icon"
                title="Aktualisieren"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={exportToExcel}
                disabled={isExporting || filteredAndSortedSubmissions.length === 0}
                className="bg-[#E30613] hover:bg-[#C00510]"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Excel Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                    onClick={() => handleSort("tcNummer")}
                  >
                    Nr <SortIcon field="tcNummer" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                    onClick={() => handleSort("timestamp")}
                  >
                    Eingang <SortIcon field="timestamp" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("nachname")}
                  >
                    Name <SortIcon field="nachname" />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">1. Frist</TableHead>
                  <TableHead className="whitespace-nowrap">2. Frist</TableHead>
                  <TableHead className="whitespace-nowrap">Erledigt</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                    onClick={() => handleSort("status")}
                  >
                    Status <SortIcon field="status" />
                  </TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      {submissions.length === 0
                        ? "Noch keine Anfragen vorhanden"
                        : "Keine Anfragen gefunden für die aktuellen Filter"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedSubmissions.map((submission) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {submission.tcNummer}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTimestamp(submission.timestamp)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {submission.vorname} {submission.nachname}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <DatePicker
                          value={submission.ersteFrist ? new Date(submission.ersteFrist) : undefined}
                          onChange={(date) => handleFristChange(submission.id, 'ersteFrist', date)}
                          placeholder="Auswählen..."
                          className="w-[150px]"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <DatePicker
                          value={submission.zweiteFrist ? new Date(submission.zweiteFrist) : undefined}
                          onChange={(date) => handleFristChange(submission.id, 'zweiteFrist', date)}
                          placeholder="Auswählen..."
                          className="w-[150px]"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {submission.erledigtAm ? formatTimestamp(submission.erledigtAm) : "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {submission.beschreibung}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={submission.status}
                          onValueChange={(value) =>
                            handleStatusChange(submission.id, value as WarrantyStatus)
                          }
                        >
                          <SelectTrigger className={`w-[140px] ${statusColors[submission.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Offen">Offen</SelectItem>
                            <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                            <SelectItem value="Erledigt">Erledigt</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedSubmission(submission)}
                            title="Details anzeigen"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(submission)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <p className="text-sm text-gray-500 text-center">
        {filteredAndSortedSubmissions.length} von {submissions.length} Anfragen angezeigt
      </p>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>Anfrage Details</DialogTitle>
                <DialogDescription>
                  Eingereicht am {formatTimestamp(selectedSubmission.timestamp)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">
                      {selectedSubmission.vorname} {selectedSubmission.nachname}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">TC-Nummer</p>
                    <p className="font-medium font-mono">{selectedSubmission.tcNummer}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium">
                    {selectedSubmission.strasseHausnummer}
                    <br />
                    {selectedSubmission.plz} {selectedSubmission.ort}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <p className="font-medium">{selectedSubmission.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{selectedSubmission.telefon}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Beschreibung</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedSubmission.beschreibung}</p>
                  </div>
                </div>
                {selectedSubmission.files.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">
                      Hochgeladene Dateien ({selectedSubmission.files.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedSubmission.files.map((file, index) => (
                        <a
                          key={index}
                          href={file.url || file.dataUrl}
                          download={file.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                          <FileImage className="w-5 h-5 text-gray-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-2">Status</p>
                  <Select
                    value={selectedSubmission.status}
                    onValueChange={(value) => {
                      handleStatusChange(selectedSubmission.id, value as WarrantyStatus);
                      setSelectedSubmission((prev) =>
                        prev ? { ...prev, status: value as WarrantyStatus } : null
                      );
                    }}
                  >
                    <SelectTrigger className={`w-[180px] ${statusColors[selectedSubmission.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Offen">Offen</SelectItem>
                      <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                      <SelectItem value="Erledigt">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anfrage löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie die Anfrage von{" "}
              <strong>
                {deleteConfirm?.vorname} {deleteConfirm?.nachname}
              </strong>{" "}
              wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
