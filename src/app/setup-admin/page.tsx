"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SetupAdminPage() {
  const [secret, setSecret] = useState("initial-setup-2025");
  const [isLoading, setIsLoading] = useState(false);

  const setupAdmin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/seed-admin", {
        method: "POST",
        headers: { "Authorization": `Bearer ${secret}` },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Admin-Account erstellt!");
        console.log(data);
      } else {
        toast.error(data.error || "Fehler");
      }
    } catch (error) {
      toast.error("Fehler");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>Erstelle den initialen Admin-Account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Secret Key"
          />
          <Button
            onClick={setupAdmin}
            disabled={isLoading}
            className="w-full bg-[#E30613] hover:bg-[#C00510]"
          >
            {isLoading ? "Erstelle..." : "Admin erstellen"}
          </Button>
          <p className="text-xs text-gray-500">
            Nach Erstellung: Benutzername "Admin", Passwort "admin123"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
