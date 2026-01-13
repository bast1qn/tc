import { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminDashboard from "@/components/AdminDashboard";

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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Verwalten Sie alle eingegangenen Gewährleistungsanfragen
            </p>
          </div>

          {/* Dashboard */}
          <AdminDashboard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
