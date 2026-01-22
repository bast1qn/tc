import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | Town & Country Haus",
  description: "Verwaltung der Gewährleistungsanfragen",
};

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminDashboardClient />
        </div>
      </main>

      <Footer />
    </div>
  );
}
