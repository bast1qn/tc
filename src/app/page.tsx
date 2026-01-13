import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WarrantyForm from "@/components/WarrantyForm";
import FAQ from "@/components/FAQ";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Gewährleistungsanfrage
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Haben Sie einen Mangel an Ihrem Town & Country Haus festgestellt?
              <br className="hidden md:block" />
              Nutzen Sie unser Formular, um Ihre Anfrage schnell und unkompliziert einzureichen.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#E30613] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Formular ausfüllen</h3>
              <p className="text-sm text-gray-600">
                Geben Sie Ihre Daten und eine Beschreibung des Mangels ein.
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-[#E30613] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Bilder hochladen</h3>
              <p className="text-sm text-gray-600">
                Dokumentieren Sie den Mangel mit Fotos oder Dokumenten.
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
          <div className="mb-16">
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
