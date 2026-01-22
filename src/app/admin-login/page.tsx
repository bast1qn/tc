"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordChangeModal from "@/components/PasswordChangeModal";
import type { AdminRole } from "@prisma/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminData, setAdminData] = useState<{ id: string; username: string } | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login fehlgeschlagen");
      }

      // Check if password change is required
      if (data.admin.mustChangePassword) {
        setAdminData({
          id: data.admin.id,
          username: data.admin.username,
        });
        setShowPasswordModal(true);
      } else {
        toast.success("Erfolgreich eingeloggt");
        router.push("/admin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    toast.success("Passwort geändert. Sie werden weitergeleitet...");
    setTimeout(() => {
      router.push("/admin");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#E30613] rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin-Login</CardTitle>
          <CardDescription>
            Melden Sie sich an, um auf das Admin-Dashboard zuzugreifen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Benutzername"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10"
                  disabled={isLoading}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Passwort"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10"
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E30613] hover:bg-[#C00510]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Anmeldung läuft...
                </>
              ) : (
                "Anmelden"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change Modal */}
      {showPasswordModal && adminData && (
        <PasswordChangeModal
          adminId={adminData.id}
          username={adminData.username}
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordChanged}
          isForced={true}
        />
      )}
    </div>
  );
}
