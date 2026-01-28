"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  Maximize,
  X,
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
import { DefectsByGewerk } from "@/components/charts/DefectsByGewerk";
import { DefectsByBauleitung } from "@/components/charts/DefectsByBauleitung";
import { DefectsByFirma } from "@/components/charts/DefectsByFirma";

type SortField = "timestamp" | "vorname" | "nachname" | "name" | "ort" | "status" | "tcNummer";
type SortDirection = "asc" | "desc";

const statusColors: Record<WarrantyStatus, string> = {
  Offen: "bg-red-100 text-red-800 hover:bg-red-200",
  "In Bearbeitung": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  Erledigt: "bg-green-100 text-green-800 hover:bg-green-200",
  "Mangel abgelehnt": "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

// Row background colors based on status
const rowBgColors: Record<WarrantyStatus, string> = {
  Offen: "bg-red-50 hover:bg-red-100",
  "In Bearbeitung": "bg-blue-50 hover:bg-blue-100",
  Erledigt: "bg-green-50 hover:bg-green-100",
  "Mangel abgelehnt": "bg-gray-50 hover:bg-gray-100",
};

// Debounce Hook für Suche
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Inline Editierbares Textfeld
function EditableCell({
  value,
  onChange,
  field,
  className = "",
}: {
  value: string;
  onChange: (field: string, value: string) => void;
  field: string;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      onChange(field, editValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`h-8 px-2 ${className}`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded -mx-2 block ${className}`}
      title="Klicken zum Bearbeiten"
    >
      {value || "-"}
    </span>
  );
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<WarrantySubmission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<WarrantySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<WarrantyStatus | "Alle">("Alle");
  const [jahrFilter, setJahrFilter] = useState<string>("Alle");
  const [verantwortlicherFilter, setVerantwortlicherFilter] = useState<string>("Alle");
  const [firmaFilter, setFirmaFilter] = useState<string>("Alle");
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSubmission, setSelectedSubmission] = useState<WarrantySubmission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<WarrantySubmission | null>(null);

  // Master data from API
  const [masterData, setMasterData] = useState<{
    bauleitung: string[];
    verantwortlicher: string[];
    gewerk: string[];
    firma: string[];
  }>({
    bauleitung: [],
    verantwortlicher: [],
    gewerk: [],
    firma: [],
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Stabile Nummer basierend auf Erstellungsdatum (erste Meldung = Nr. 1)
  const getStableNumber = (id: string, timestamp: string) => {
    const sortedByTimestamp = [...allSubmissions].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const index = sortedByTimestamp.findIndex(s => s.id === id);
    return index + 1;
  };

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Suche wird client-seitig durchgeführt, daher kein search-Parameter an API
      const data = await submissionsAPI.getAll({
        status: statusFilter === "Alle" ? undefined : statusFilter,
        jahr: jahrFilter === "Alle" ? undefined : jahrFilter,
        verantwortlicherId: verantwortlicherFilter === "Alle" ? undefined : verantwortlicherFilter,
        firmaId: firmaFilter === "Alle" ? undefined : firmaFilter,
        sortBy: sortField,
        sortOrder: sortDirection,
      });
      setSubmissions(data.submissions);

      // Alle Einträge für stabile Nummer laden (ohne Filter)
      const allData = await submissionsAPI.getAll({});
      setAllSubmissions(allData.submissions);
    } catch (err) {
      const message = err instanceof APIError ? err.message : 'Fehler beim Laden der Daten';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, jahrFilter, verantwortlicherFilter, firmaFilter, sortField, sortDirection]);

  const loadMasterData = useCallback(async () => {
    try {
      const response = await fetch('/api/master-data');
      const data = await response.json();

      setMasterData({
        bauleitung: data.bauleitung?.map((item: any) => item.name) || [],
        verantwortlicher: data.verantwortlicher?.map((item: any) => item.name) || [],
        gewerk: data.gewerk?.map((item: any) => item.name) || [],
        firma: data.firma?.map((item: any) => item.name) || [],
      });
    } catch (err) {
      console.error('Failed to load master data:', err);
      // Bei Fehler Fallback-Werte verwenden
      setMasterData({
        bauleitung: ["Daniel Mordass", "Jens Kohnert", "Markus Wünsch"],
        verantwortlicher: ["Daniel Mordass", "Jens Kohnert", "Markus Wünsch", "Thomas Wötzel"],
        gewerk: ["Außenputz", "Balkone", "Dachdeckung", "Dachstuhl", "Elektro", "Estrich", "Fenster", "Fliesen", "Heizung/Sanitär", "Hochbau", "Innenputz", "Innentüren", "Lüftung", "Tiefbau", "Treppen", "Trockenbau"],
        firma: ["Arndt", "Bauconstruct", "Bauservice Zwenkau", "Bergander", "BMB", "Breman", "Cierpinski", "Döhler", "Enick", "Estrichteam", "Gaedtke", "Guttenberger", "Happke", "Harrandt", "HIB", "HIT", "Hoppe & Kant", "Hüther", "Kieburg", "Krieg", "Lunos", "MoJé Bau", "Pluggit", "Raum + Areal", "Salomon", "Stoof", "Streubel", "TMP", "Treppenmeister", "UDIPAN", "Werner"],
      });
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const handleStatusChange = async (id: string, newStatus: WarrantyStatus) => {
    // Optimistisches Update - sofortige UI-Aktualisierung
    const previousSubmissions = [...submissions];
    const submission = submissions.find(s => s.id === id);

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

    try {
      await submissionsAPI.updateStatus(id, newStatus);

      // Wenn Status auf "Erledigt" geändert wurde und kein Datum existierte → Datum speichern
      if (newStatus === "Erledigt" && !submission?.erledigtAm) {
        const today = new Date().toISOString();
        await submissionsAPI.updateField(id, 'erledigtAm', today);
      }

      toast.success(`Status auf "${newStatus}" geändert`);
    } catch (err) {
      // Bei Fehler wiederherstellen
      setSubmissions(previousSubmissions);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const handleFristChange = async (
    id: string,
    field: 'ersteFrist' | 'zweiteFrist',
    date: Date | undefined
  ) => {
    // Optimistisches Update
    const previousSubmissions = [...submissions];
    const dateString = date ? date.toISOString() : null;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: dateString } : s
      )
    );

    try {
      await submissionsAPI.updateFristen(
        id,
        field === 'ersteFrist' ? dateString : undefined,
        field === 'zweiteFrist' ? dateString : undefined
      );
      toast.success(`${field === 'ersteFrist' ? '1. Frist' : '2. Frist'} aktualisiert`);
    } catch (err) {
      setSubmissions(previousSubmissions);
      toast.error('Fehler beim Aktualisieren der Frist');
    }
  };

  const handleAbnahmeChange = async (id: string, date: Date | undefined) => {
    // Optimistisches Update
    const previousSubmissions = [...submissions];
    const dateString = date ? date.toISOString().split('T')[0] : null;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, abnahme: dateString } : s
      )
    );

    try {
      await submissionsAPI.updateField(id, 'abnahme', dateString);
      toast.success('Abnahme aktualisiert');
    } catch (err) {
      setSubmissions(previousSubmissions);
      toast.error('Fehler beim Aktualisieren der Abnahme');
    }
  };

  const handleErledigtAmChange = async (id: string, date: Date | undefined) => {
    // Optimistisches Update
    const previousSubmissions = [...submissions];
    const submission = submissions.find(s => s.id === id);
    const dateString = date ? date.toISOString() : null;

    // Wenn Datum gesetzt wird und Status noch nicht "Erledigt" ist → Status ändern
    const shouldUpdateStatus = dateString && submission?.status !== "Erledigt";

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updates: Partial<WarrantySubmission> = { erledigtAm: dateString };
          if (shouldUpdateStatus) {
            updates.status = "Erledigt";
          }
          return { ...s, ...updates };
        }
        return s;
      })
    );

    try {
      // Datum aktualisieren
      await submissionsAPI.updateField(id, 'erledigtAm', dateString);

      // Falls Status geändert werden muss
      if (shouldUpdateStatus) {
        await submissionsAPI.updateStatus(id, "Erledigt");
        toast.success('Erledigt-Datum gesetzt und Status auf "Erledigt" geändert');
      } else {
        toast.success(dateString ? 'Erledigt-Datum aktualisiert' : 'Erledigt-Datum entfernt');
      }
    } catch (err) {
      setSubmissions(previousSubmissions);
      toast.error('Fehler beim Aktualisieren des Erledigt-Datums');
    }
  };

  const handleFieldChange = async (id: string, field: string, value: string) => {
    // Optimistisches Update
    const previousSubmissions = [...submissions];

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );

    try {
      await submissionsAPI.updateField(id, field, value);
      toast.success(`${field} aktualisiert`);
    } catch (err) {
      setSubmissions(previousSubmissions);
      toast.error(`Fehler beim Aktualisieren von ${field}`);
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

    // Filter by search term (use searchTerm directly when empty for instant reset)
    const effectiveSearchTerm = searchTerm === "" ? "" : debouncedSearchTerm;
    if (effectiveSearchTerm) {
      const term = effectiveSearchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.vorname.toLowerCase().includes(term) ||
          s.nachname.toLowerCase().includes(term) ||
          s.tcNummer.toLowerCase().includes(term) ||
          s.strasseHausnummer.toLowerCase().includes(term) ||
          s.plz.toLowerCase().includes(term) ||
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
        case "name":
          comparison = `${a.vorname} ${a.nachname}`.localeCompare(`${b.vorname} ${b.nachname}`, "de");
          break;
        case "ort":
          comparison = a.ort.localeCompare(b.ort, "de");
          break;
        case "tcNummer":
          comparison = a.tcNummer.localeCompare(b.tcNummer, "de");
          break;
        case "status":
          const statusOrder = { Offen: 0, "In Bearbeitung": 1, Erledigt: 2, "Mangel abgelehnt": 3 };
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
      mangelAbgelehnt: submissions.filter((s) => s.status === "Mangel abgelehnt").length,
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium text-red-600">Offen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.offen}</p>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Abgelehnt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-600">{stats.mangelAbgelehnt}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Auswertungen</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mängel nach Gewerk</CardTitle>
            </CardHeader>
            <CardContent>
              <DefectsByGewerk />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mängel nach Bauleitung</CardTitle>
            </CardHeader>
            <CardContent>
              <DefectsByBauleitung />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Mängel nach Firma (pro Gewerk)</CardTitle>
          </CardHeader>
          <CardContent>
            <DefectsByFirma />
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
                  placeholder="Suchen nach Name, E-Mail, BV-Nummer, Straße, Ort, Beschreibung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as WarrantyStatus | "Alle")}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent highZIndex={isFullscreen}>
                  <SelectItem value="Alle">Alle Status</SelectItem>
                  <SelectItem value="Offen">Offen</SelectItem>
                  <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="Erledigt">Erledigt</SelectItem>
                  <SelectItem value="Mangel abgelehnt">Mangel abgelehnt</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={jahrFilter}
                onValueChange={setJahrFilter}
              >
                <SelectTrigger className="w-full sm:w-[100px]">
                  <SelectValue placeholder="Jahr" />
                </SelectTrigger>
                <SelectContent highZIndex={isFullscreen}>
                  <SelectItem value="Alle">Alle Jahre</SelectItem>
                  {Array.from(
                    new Set(allSubmissions.map(s => new Date(s.timestamp).getFullYear()))
                  )
                    .sort((a, b) => b - a)
                    .map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select
                value={verantwortlicherFilter}
                onValueChange={setVerantwortlicherFilter}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Verantwortlicher" />
                </SelectTrigger>
                <SelectContent highZIndex={isFullscreen}>
                  <SelectItem value="Alle">Alle Verantwortlichen</SelectItem>
                  {masterData.verantwortlicher.map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={firmaFilter}
                onValueChange={setFirmaFilter}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Firma" />
                </SelectTrigger>
                <SelectContent highZIndex={isFullscreen}>
                  <SelectItem value="Alle">Alle Firmen</SelectItem>
                  {masterData.firma.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
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
              <Button
                onClick={() => setIsFullscreen(true)}
                variant="outline"
                title="Vollbildmodus"
                className="flex items-center gap-2"
              >
                <Maximize className="w-4 h-4" />
                <span className="hidden sm:inline">Vollbild</span>
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
                  <TableHead className="whitespace-nowrap">Nr</TableHead>
                  <TableHead className="whitespace-nowrap">Eingang</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                    onClick={() => handleSort("tcNummer")}
                  >
                    BV-Nr <SortIcon field="tcNummer" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                    onClick={() => handleSort("name")}
                  >
                    Name <SortIcon field="name" />
                  </TableHead>
                  <TableHead className="whitespace-nowrap">Telefon</TableHead>
                  <TableHead>Straße und Ort</TableHead>
                  <TableHead className="whitespace-nowrap">Bauleitung</TableHead>
                  <TableHead className="whitespace-nowrap">Abnahme</TableHead>
                  <TableHead className="whitespace-nowrap">Verantwortliche/r</TableHead>
                  <TableHead className="whitespace-nowrap">Gewerk</TableHead>
                  <TableHead className="whitespace-nowrap">Firma</TableHead>
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
                    <TableCell colSpan={16} className="text-center py-12 text-gray-500">
                      {submissions.length === 0
                        ? "Noch keine Anfragen vorhanden"
                        : "Keine Anfragen gefunden für die aktuellen Filter"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedSubmissions.map((submission) => (
                    <TableRow key={submission.id} className={rowBgColors[submission.status]}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {getStableNumber(submission.id, submission.timestamp)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.timestamp)}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {submission.tcNummer}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <EditableCell
                            value={submission.vorname}
                            onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                            field="vorname"
                            className="text-sm"
                          />
                          <EditableCell
                            value={submission.nachname}
                            onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                            field="nachname"
                            className="text-sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <EditableCell
                          value={submission.telefon}
                          onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                          field="telefon"
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <EditableCell
                            value={submission.strasseHausnummer}
                            onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                            field="strasseHausnummer"
                            className="text-sm"
                          />
                          <div className="flex gap-1 items-center">
                            <EditableCell
                              value={submission.plz}
                              onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                              field="plz"
                              className="text-sm w-16"
                            />
                            <EditableCell
                              value={submission.ort}
                              onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                              field="ort"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select
                          value={submission.bauleitung || ""}
                          onValueChange={(value) =>
                            handleFieldChange(submission.id, 'bauleitung', value)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {masterData.bauleitung.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <DatePicker
                          value={submission.abnahme ? new Date(submission.abnahme) : undefined}
                          onChange={(date) => handleAbnahmeChange(submission.id, date)}
                          placeholder="Auswählen..."
                          className="w-[120px]"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select
                          value={submission.verantwortlicher || ""}
                          onValueChange={(value) =>
                            handleFieldChange(submission.id, 'verantwortlicher', value)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {masterData.verantwortlicher.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select
                          value={submission.gewerk || ""}
                          onValueChange={(value) =>
                            handleFieldChange(submission.id, 'gewerk', value)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {masterData.gewerk.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select
                          value={submission.firma || ""}
                          onValueChange={(value) =>
                            handleFieldChange(submission.id, 'firma', value)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Auswählen..." />
                          </SelectTrigger>
                          <SelectContent>
                            {masterData.firma.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <DatePicker
                          value={submission.ersteFrist ? new Date(submission.ersteFrist) : undefined}
                          onChange={(date) => handleFristChange(submission.id, 'ersteFrist', date)}
                          placeholder="Auswählen..."
                          className="w-[120px]"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <DatePicker
                          value={submission.zweiteFrist ? new Date(submission.zweiteFrist) : undefined}
                          onChange={(date) => handleFristChange(submission.id, 'zweiteFrist', date)}
                          placeholder="Auswählen..."
                          className="w-[120px]"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <DatePicker
                          value={submission.erledigtAm ? new Date(submission.erledigtAm) : undefined}
                          onChange={(date) => handleErledigtAmChange(submission.id, date)}
                          placeholder="Auswählen..."
                          className="w-[120px]"
                        />
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <EditableCell
                          value={submission.beschreibung}
                          onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                          field="beschreibung"
                          className="text-sm block truncate"
                        />
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
                            <SelectItem value="Mangel abgelehnt">Mangel abgelehnt</SelectItem>
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
                      <SelectItem value="Mangel abgelehnt">Mangel abgelehnt</SelectItem>
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

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-gray-900/50 flex items-center justify-center">
          <div className="bg-white w-full h-full max-h-[100vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold">Gewährleistungsanfragen - Vollbildansicht</h2>
              <Button onClick={() => setIsFullscreen(false)} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Schließen
              </Button>
            </div>

            {/* Scrollbare Tabelle */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="whitespace-nowrap">Nr</TableHead>
                    <TableHead className="whitespace-nowrap">Eingang</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                      onClick={() => handleSort("tcNummer")}
                    >
                      BV-Nr <SortIcon field="tcNummer" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                      onClick={() => handleSort("name")}
                    >
                      Name <SortIcon field="name" />
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Telefon</TableHead>
                    <TableHead>Straße und Ort</TableHead>
                    <TableHead className="whitespace-nowrap">Bauleitung</TableHead>
                    <TableHead className="whitespace-nowrap">Abnahme</TableHead>
                    <TableHead className="whitespace-nowrap">Verantwortliche/r</TableHead>
                    <TableHead className="whitespace-nowrap">Gewerk</TableHead>
                    <TableHead className="whitespace-nowrap">Firma</TableHead>
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
                      <TableCell colSpan={16} className="text-center py-12 text-gray-500">
                        {submissions.length === 0
                          ? "Noch keine Anfragen vorhanden"
                          : "Keine Anfragen gefunden für die aktuellen Filter"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedSubmissions.map((submission) => (
                      <TableRow key={submission.id} className={rowBgColors[submission.status] + " hover:opacity-80"}>
                        <TableCell className="whitespace-nowrap font-medium">{getStableNumber(submission.id, submission.timestamp)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-gray-500">{formatDate(submission.timestamp)}</TableCell>
                        <TableCell className="font-mono text-sm whitespace-nowrap">{submission.tcNummer}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <EditableCell
                              value={submission.vorname}
                              onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                              field="vorname"
                              className="text-sm"
                            />
                            <EditableCell
                              value={submission.nachname}
                              onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                              field="nachname"
                              className="text-sm"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <EditableCell
                            value={submission.telefon}
                            onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                            field="telefon"
                            className="text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <EditableCell
                              value={submission.strasseHausnummer}
                              onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                              field="strasseHausnummer"
                              className="text-sm"
                            />
                            <div className="flex gap-1 items-center">
                              <EditableCell
                                value={submission.plz}
                                onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                                field="plz"
                                className="text-sm w-16"
                              />
                              <EditableCell
                                value={submission.ort}
                                onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                                field="ort"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Select
                            value={submission.bauleitung || ""}
                            onValueChange={(value) =>
                              handleFieldChange(submission.id, 'bauleitung', value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Auswählen..." />
                            </SelectTrigger>
                            <SelectContent highZIndex={isFullscreen}>
                              {masterData.bauleitung.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <DatePicker
                            value={submission.abnahme ? new Date(submission.abnahme) : undefined}
                            onChange={(date) => handleAbnahmeChange(submission.id, date)}
                            placeholder="Auswählen..."
                            className="w-[120px]"
                            highZIndex={isFullscreen}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Select
                            value={submission.verantwortlicher || ""}
                            onValueChange={(value) =>
                              handleFieldChange(submission.id, 'verantwortlicher', value)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Auswählen..." />
                            </SelectTrigger>
                            <SelectContent highZIndex={isFullscreen}>
                              {masterData.verantwortlicher.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Select
                            value={submission.gewerk || ""}
                            onValueChange={(value) =>
                              handleFieldChange(submission.id, 'gewerk', value)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Auswählen..." />
                            </SelectTrigger>
                            <SelectContent highZIndex={isFullscreen}>
                              {masterData.gewerk.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Select
                            value={submission.firma || ""}
                            onValueChange={(value) =>
                              handleFieldChange(submission.id, 'firma', value)
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Auswählen..." />
                            </SelectTrigger>
                            <SelectContent highZIndex={isFullscreen}>
                              {masterData.firma.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <DatePicker
                            value={submission.ersteFrist ? new Date(submission.ersteFrist) : undefined}
                            onChange={(date) => handleFristChange(submission.id, 'ersteFrist', date)}
                            placeholder="Auswählen..."
                            className="w-[120px]"
                            highZIndex={isFullscreen}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <DatePicker
                            value={submission.zweiteFrist ? new Date(submission.zweiteFrist) : undefined}
                            onChange={(date) => handleFristChange(submission.id, 'zweiteFrist', date)}
                            placeholder="Auswählen..."
                            className="w-[120px]"
                            highZIndex={isFullscreen}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <DatePicker
                            value={submission.erledigtAm ? new Date(submission.erledigtAm) : undefined}
                            onChange={(date) => handleErledigtAmChange(submission.id, date)}
                            placeholder="Auswählen..."
                            className="w-[120px]"
                            highZIndex={isFullscreen}
                          />
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <EditableCell
                            value={submission.beschreibung}
                            onChange={(field, value) => handleFieldChange(submission.id, field, value)}
                            field="beschreibung"
                            className="text-sm block truncate"
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Select
                            value={submission.status}
                            onValueChange={(value) =>
                              handleStatusChange(submission.id, value as WarrantyStatus)
                            }
                          >
                            <SelectTrigger className={`w-[140px] ${statusColors[submission.status]}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent highZIndex={isFullscreen}>
                              <SelectItem value="Offen">Offen</SelectItem>
                              <SelectItem value="In Bearbeitung">In Bearbeitung</SelectItem>
                              <SelectItem value="Erledigt">Erledigt</SelectItem>
                              <SelectItem value="Mangel abgelehnt">Mangel abgelehnt</SelectItem>
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

            {/* Footer mit Info */}
            <div className="p-3 border-t bg-gray-50 text-sm text-gray-600 text-center">
              {filteredAndSortedSubmissions.length} von {submissions.length} Anzeigen • ESC zum Schließen
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
