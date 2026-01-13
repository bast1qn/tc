export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-[#E30613] mb-3">
              Town & Country Haus
            </h3>
            <p className="text-gray-400 text-sm">
              Deutschlands meistgebautes Markenhaus.
              <br />
              Ihr Partner für den Hausbau.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href="https://www.tc.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E30613] transition-colors"
                >
                  Website
                </a>
              </li>
              <li>
                <a
                  href="https://www.tc.de/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E30613] transition-colors"
                >
                  Datenschutzerklärung
                </a>
              </li>
              <li>
                <a
                  href="https://www.tc.de/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E30613] transition-colors"
                >
                  Impressum
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Kontakt</h3>
            <p className="text-sm text-gray-400">
              Bei Fragen zur Gewährleistung
              <br />
              wenden Sie sich bitte an Ihren
              <br />
              regionalen Ansprechpartner.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-500">
          <p>
            © {currentYear} Town & Country Haus. Alle Rechte vorbehalten.
          </p>
          <p className="mt-1 text-xs">
            Demo-Anwendung für Gewährleistungsanfragen
          </p>
        </div>
      </div>
    </footer>
  );
}
