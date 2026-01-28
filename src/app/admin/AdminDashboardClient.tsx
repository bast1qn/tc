"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Users, FileText, LogOut, Shield, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AdminDashboard from "@/components/AdminDashboard";
import UserManagement from "@/components/UserManagement";
import MasterDataManagement from "@/components/MasterDataManagement";
import { AdminRole } from "@prisma/client";

interface AdminSession {
  adminId: string;
  username: string;
  role: AdminRole;
}

export default function AdminDashboardClient() {
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"submissions" | "users" | "masterdata">("submissions");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/admin/verify");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin-login");
          return;
        }
        throw new Error("Session-Prüfung fehlgeschlagen");
      }

      const data = await response.json();
      setSession(data.admin);
    } catch (error) {
      console.error("Session check error:", error);
      router.push("/admin-login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" });
      toast.success("Erfolgreich abgemeldet");
      router.push("/admin-login");
    } catch (err) {
      toast.error("Abmeldung fehlgeschlagen");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#E30613] mx-auto animate-spin mb-4" />
          <p className="text-gray-600">Session wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-gray-600">
                Eingeloggt als <span className="font-semibold">{session.username}</span>
              </p>
              <Badge
                variant="outline"
                className={
                  session.role === AdminRole.ADMIN
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-green-100 text-green-800 border-green-200"
                }
              >
                <Shield className="w-3 h-3 mr-1" />
                {session.role === AdminRole.ADMIN ? "Admin" : "Mitarbeiter"}
              </Badge>
            </div>
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

        {/* Tab Buttons - Side by Side */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTab === "submissions" ? "default" : "outline"}
            onClick={() => setActiveTab("submissions")}
            className={activeTab === "submissions" ? "bg-[#E30613] hover:bg-[#C00510] text-white" : "border-[#E30613] text-[#E30613] hover:bg-[#E30613] hover:text-white"}
          >
            <FileText className="w-4 h-4 mr-2" />
            Mängel
          </Button>
          <Button
            variant={activeTab === "masterdata" ? "default" : "outline"}
            onClick={() => setActiveTab("masterdata")}
            className={activeTab === "masterdata" ? "bg-[#E30613] hover:bg-[#C00510] text-white" : "border-[#E30613] text-[#E30613] hover:bg-[#E30613] hover:text-white"}
          >
            <Settings className="w-4 h-4 mr-2" />
            Stammdaten
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className={activeTab === "users" ? "bg-[#E30613] hover:bg-[#C00510] text-white" : "border-[#E30613] text-[#E30613] hover:bg-[#E30613] hover:text-white"}
          >
            <Users className="w-4 h-4 mr-2" />
            Benutzer
          </Button>
        </div>
      </div>

      {/* Direct content display */}
      {activeTab === "submissions" ? (
        <AdminDashboard />
      ) : activeTab === "users" ? (
        <UserManagement currentUserId={session.adminId} currentRole={session.role} />
      ) : (
        <MasterDataManagement currentRole={session.role} />
      )}
    </div>
  );
}
