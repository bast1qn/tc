"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Loader2, Home, FileText, Calendar, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomerDashboard from "@/components/CustomerDashboard";
import type { WarrantySubmission } from "@/types/warranty";

const statusColors: Record<string, string> = {
  Offen: "bg-red-100 text-red-800 border-red-200",
  "In Bearbeitung": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Erledigt: "bg-green-100 text-green-800 border-green-200",
  "Mangel abgelehnt": "bg-gray-100 text-gray-800 border-gray-200",
};

const statusIcons: Record<string, React.ReactNode> = {
  Offen: <AlertCircle className="w-3 h-3" />,
  "In Bearbeitung": <Loader2 className="w-3 h-3" />,
  Erledigt: <Home className="w-3 h-3" />,
  "Mangel abgelehnt": <AlertCircle className="w-3 h-3" />,
};

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<WarrantySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<WarrantySubmission | null>(null);

  const loadSubmissions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/customer/submissions");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/customer-login");
          return;
        }
        throw new Error("Fehler beim Laden der Daten");
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/customer/login", { method: "DELETE" });
      toast.success("Erfolgreich abgemeldet");
      router.push("/customer-login");
    } catch (err) {
      toast.error("Abmeldung fehlgeschlagen");
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#E30613] mx-auto animate-spin mb-4" />
            <p className="text-gray-600">Daten werden geladen...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mein Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Übersicht Ihrer Gewährleistungsanfragen
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-[#E30613] text-[#E30613] hover:bg-[#E30613] hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Gesamt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{submissions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Offen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">
                  {submissions.filter((s) => s.status === "Offen").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">In Bearbeitung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">
                  {submissions.filter((s) => s.status === "In Bearbeitung").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Erledigt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {submissions.filter((s) => s.status === "Erledigt").length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Meine Meldungen</CardTitle>
              <CardDescription>
                {submissions.length === 0
                  ? "Sie haben noch keine Meldungen eingereicht"
                  : `${submissions.length} Meldung(en)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Meldungen vorhanden</p>
                  <a
                    href="/"
                    className="inline-block mt-4 text-[#E30613] hover:underline"
                  >
                    Neue Meldung erstellen
                  </a>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>TC-Nummer</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead>Gewerk</TableHead>
                        <TableHead>Firma</TableHead>
                        <TableHead>1. Frist</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(submission.timestamp)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {submission.tcNummer}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {submission.beschreibung}
                          </TableCell>
                          <TableCell>{submission.gewerk || "-"}</TableCell>
                          <TableCell>{submission.firma || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(submission.ersteFrist)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={statusColors[submission.status]}
                            >
                              {statusIcons[submission.status]}
                              <span className="ml-1">{submission.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Detail Modal */}
      {selectedSubmission && (
        <CustomerDashboard
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
}
