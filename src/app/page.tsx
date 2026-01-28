"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Search, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WarrantyForm from "@/components/WarrantyForm";
import FAQ from "@/components/FAQ";

export default function Home() {
  const [selectedTab, setSelectedTab] = useState<"new" | "track">("new");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Gewährleistungsanfrage
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Haben Sie ein Problem an Ihrem Town & Country Haus festgestellt?
              <br className="hidden md:block" />
              Nutzen Sie unser Formular, um Ihre Anfrage schnell und unkompliziert einzureichen.
            </p>
          </div>

          {/* Choice Cards - Neue Anfrage vs Anfrage verfolgen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-4xl mx-auto">
            {/* Neue Anfrage Card */}
            <Link
              href="#neue-anfrage"
              onClick={() => setSelectedTab("new")}
              className={`group relative overflow-hidden rounded-xl border-2 p-6 transition-all ${
                selectedTab === "new"
                  ? "border-[#E30613] bg-red-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-[#E30613] hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  selectedTab === "new" ? "bg-[#E30613]" : "bg-gray-100 group-hover:bg-[#E30613]"
                } transition-colors`}>
                  <FileText className={`w-6 h-6 ${selectedTab === "new" ? "text-white" : "text-[#E30613] group-hover:text-white"} transition-colors`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Neue Anfrage</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Erfassen Sie eine neue Gewährleistungsanfrage mit Fotos und Beschreibung.
                  </p>
                  <span className={`inline-flex items-center text-sm font-medium ${
                    selectedTab === "new" ? "text-[#E30613]" : "text-gray-500 group-hover:text-[#E30613]"
                  } transition-colors`}>
                    Zum Formular
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Anfrage verfolgen Card */}
            <Link
              href="/customer-login"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 transition-all hover:border-[#E30613] hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-gray-100 group-hover:bg-[#E30613] transition-colors">
                  <Search className="w-6 h-6 text-[#E30613] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Anfrage verfolgen</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Verfolgen Sie den Status Ihrer bestehenden Anfrage mit E-Mail und TC-Nummer.
                  </p>
                  <span className="inline-flex items-center text-sm font-medium text-gray-500 group-hover:text-[#E30613] transition-colors">
                    Zum Login
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#E30613] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Formular ausfüllen</h3>
              <p className="text-sm text-gray-600">
                Geben Sie Ihre Daten und eine Beschreibung des Sachverhaltes ein.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#E30613] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Bilder hochladen</h3>
              <p className="text-sm text-gray-600">
                Dokumentieren Sie den Sachverhalt mit Fotos oder Dokumenten.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#E30613] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Anfrage absenden</h3>
              <p className="text-sm text-gray-600">
                Wir bearbeiten Ihre Anfrage schnellstmöglich.
              </p>
            </div>
          </div>

          {/* Form */}
          <div id="neue-anfrage" className="mb-16">
            <WarrantyForm />
          </div>

          {/* FAQ Section */}
          <div className="mb-8">
            <FAQ />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
