"use client";

import { useState, useRef, type FormEvent, type ChangeEvent } from "react";
import { Loader2, Upload, X, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFileSize } from "@/lib/storage";
import { submissionsAPI } from "@/lib/api-client";
import type { WarrantyFormData, FormErrors } from "@/types/warranty";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

const initialFormData: WarrantyFormData = {
  vorname: "",
  nachname: "",
  strasseHausnummer: "",
  plz: "",
  ort: "",
  tcNummer: "",
  email: "",
  telefon: "",
  beschreibung: "",
  haustyp: "",
  bauleitung: "",
  abnahme: "",
  verantwortlicher: "",
  gewerk: "",
  firma: "",
  files: [],
  dsgvoAccepted: false,
};

export default function WarrantyForm() {
  const [formData, setFormData] = useState<WarrantyFormData>(initialFormData);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.vorname.trim()) {
      newErrors.vorname = "Vorname ist erforderlich";
    }
    if (!formData.nachname.trim()) {
      newErrors.nachname = "Nachname ist erforderlich";
    }
    if (!formData.strasseHausnummer.trim()) {
      newErrors.strasseHausnummer = "Straße und Hausnummer sind erforderlich";
    }
    if (!formData.plz.trim()) {
      newErrors.plz = "PLZ ist erforderlich";
    } else if (!/^\d{5}$/.test(formData.plz.trim())) {
      newErrors.plz = "PLZ muss 5 Ziffern haben";
    }
    if (!formData.ort.trim()) {
      newErrors.ort = "Ort ist erforderlich";
    }
    if (!formData.tcNummer.trim()) {
      newErrors.tcNummer = "Bauvorhaben-Nummer ist erforderlich";
    }
    if (!formData.email.trim()) {
      newErrors.email = "E-Mail-Adresse ist erforderlich";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Ungültige E-Mail-Adresse";
    }
    if (!formData.telefon.trim()) {
      newErrors.telefon = "Telefonnummer ist erforderlich";
    }
    if (!formData.beschreibung.trim()) {
      newErrors.beschreibung = "Beschreibung ist erforderlich";
    } else if (formData.beschreibung.trim().length < 20) {
      newErrors.beschreibung = "Beschreibung muss mindestens 20 Zeichen haben";
    }
    if (!formData.dsgvoAccepted) {
      newErrors.dsgvoAccepted = "Sie müssen die Datenschutzerklärung akzeptieren";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const fileErrors: string[] = [];

    selectedFiles.forEach((file) => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        fileErrors.push(`${file.name}: Dateityp nicht erlaubt`);
      } else if (file.size > MAX_FILE_SIZE) {
        fileErrors.push(`${file.name}: Datei zu groß (max. 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (fileErrors.length > 0) {
      toast.error("Einige Dateien konnten nicht hinzugefügt werden", {
        description: fileErrors.join(", "),
      });
    }

    setUploadedFiles((prev) => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Alle Formularfelder hinzufügen
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'files') {
          formDataToSend.append(key, String(value));
        }
      });

      // Dateien hinzufügen
      uploadedFiles.forEach(file => {
        formDataToSend.append('files', file);
      });

      // API Call
      await submissionsAPI.create(formDataToSend);

      toast.success("Ihre Meldung wurde erfolgreich übermittelt", {
        description: "Wir werden uns zeitnah bei Ihnen melden.",
      });

      // Reset
      setIsSuccess(true);
      setFormData(initialFormData);
      setUploadedFiles([]);

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Fehler beim Übermitteln", {
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es später erneut.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Vielen Dank für Ihre Anfrage!
          </h2>
          <p className="text-gray-600 mb-6">
            Ihre Gewährleistungsanfrage wurde erfolgreich übermittelt.
            <br />
            Wir werden uns schnellstmöglich bei Ihnen melden.
          </p>
          <Button
            onClick={() => setIsSuccess(false)}
            className="bg-[#E30613] hover:bg-[#C00510]"
          >
            Neue Anfrage stellen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-[#E30613] to-[#C00510] text-white rounded-t-lg">
        <CardTitle className="text-2xl">Gewährleistungsanfrage</CardTitle>
        <CardDescription className="text-white/90">
          Füllen Sie das Formular aus, um eine Gewährleistungsanfrage zu stellen.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 bg-gray-50 rounded-b-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vorname" className="font-medium">
                Vorname <span className="text-[#E30613]">*</span>
              </Label>
              <Input
                id="vorname"
                name="vorname"
                value={formData.vorname}
                onChange={handleInputChange}
                placeholder="Max"
                className={errors.vorname ? "border-red-500" : ""}
                aria-invalid={!!errors.vorname}
                aria-describedby={errors.vorname ? "vorname-error" : undefined}
              />
              {errors.vorname && (
                <p id="vorname-error" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.vorname}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nachname" className="font-medium">
                Nachname <span className="text-[#E30613]">*</span>
              </Label>
              <Input
                id="nachname"
                name="nachname"
                value={formData.nachname}
                onChange={handleInputChange}
                placeholder="Mustermann"
                className={errors.nachname ? "border-red-500" : ""}
                aria-invalid={!!errors.nachname}
                aria-describedby={errors.nachname ? "nachname-error" : undefined}
              />
              {errors.nachname && (
                <p id="nachname-error" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nachname}
                </p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="strasseHausnummer" className="font-medium">
              Straße und Hausnummer <span className="text-[#E30613]">*</span>
            </Label>
            <Input
              id="strasseHausnummer"
              name="strasseHausnummer"
              value={formData.strasseHausnummer}
              onChange={handleInputChange}
              placeholder="Musterstraße 123"
              className={errors.strasseHausnummer ? "border-red-500" : ""}
              aria-invalid={!!errors.strasseHausnummer}
              aria-describedby={errors.strasseHausnummer ? "strasse-error" : undefined}
            />
            {errors.strasseHausnummer && (
              <p id="strasse-error" className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.strasseHausnummer}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plz" className="font-medium">
                PLZ <span className="text-[#E30613]">*</span>
              </Label>
              <Input
                id="plz"
                name="plz"
                value={formData.plz}
                onChange={handleInputChange}
                placeholder="12345"
                maxLength={5}
                className={errors.plz ? "border-red-500" : ""}
                aria-invalid={!!errors.plz}
                aria-describedby={errors.plz ? "plz-error" : undefined}
              />
              {errors.plz && (
                <p id="plz-error" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.plz}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ort" className="font-medium">
                Ort <span className="text-[#E30613]">*</span>
              </Label>
              <Input
                id="ort"
                name="ort"
                value={formData.ort}
                onChange={handleInputChange}
                placeholder="Musterstadt"
                className={errors.ort ? "border-red-500" : ""}
                aria-invalid={!!errors.ort}
                aria-describedby={errors.ort ? "ort-error" : undefined}
              />
              {errors.ort && (
                <p id="ort-error" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.ort}
                </p>
              )}
            </div>
          </div>

          {/* Bauvorhaben Number */}
          <div className="space-y-2">
            <Label htmlFor="tcNummer" className="font-medium">
              Bauvorhaben-Nummer <span className="text-[#E30613]">*</span>
            </Label>
            <Input
              id="tcNummer"
              name="tcNummer"
              value={formData.tcNummer}
              onChange={handleInputChange}
              placeholder="BV-123456"
              className={errors.tcNummer ? "border-red-500" : ""}
              aria-invalid={!!errors.tcNummer}
              aria-describedby={errors.tcNummer ? "bv-error" : undefined}
            />
            {errors.tcNummer && (
              <p id="bv-error" className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.tcNummer}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Die sechsstellige Bauvorhaben-Nummer finden Sie auf Ihren Rechnungen oder Zusatzvereinbarungen.
            </p>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">
                E-Mail-Adresse <span className="text-[#E30613]">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="max.mustermann@email.de"
                className={errors.email ? "border-red-500" : ""}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefon" className="font-medium">
                Telefonnummer <span className="text-[#E30613]">*</span>
              </Label>
              <Input
                id="telefon"
                name="telefon"
                type="tel"
                value={formData.telefon}
                onChange={handleInputChange}
                placeholder="+49 123 456789"
                className={errors.telefon ? "border-red-500" : ""}
                aria-invalid={!!errors.telefon}
                aria-describedby={errors.telefon ? "telefon-error" : undefined}
              />
              {errors.telefon && (
                <p id="telefon-error" className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.telefon}
                </p>
              )}
            </div>
          </div>

          {/* Additional Project Information (Optional) */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Weitere Informationen (optional)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Diese Informationen helfen uns bei der schnelleren Bearbeitung Ihrer Anfrage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="haustyp" className="font-medium">
                  Haustyp
                </Label>
                <Input
                  id="haustyp"
                  name="haustyp"
                  value={formData.haustyp || ""}
                  onChange={handleInputChange}
                  placeholder="z.B. Reihenhaus, Doppelhaushälfte"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bauleitung" className="font-medium">
                  Bauleitung
                </Label>
                <Input
                  id="bauleitung"
                  name="bauleitung"
                  value={formData.bauleitung || ""}
                  onChange={handleInputChange}
                  placeholder="Name der Bauleitung"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abnahme" className="font-medium">
                  Abnahme
                </Label>
                <Input
                  id="abnahme"
                  name="abnahme"
                  value={formData.abnahme || ""}
                  onChange={handleInputChange}
                  placeholder="Datum der Abnahme"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verantwortlicher" className="font-medium">
                  Verantwortliche/r
                </Label>
                <Input
                  id="verantwortlicher"
                  name="verantwortlicher"
                  value={formData.verantwortlicher || ""}
                  onChange={handleInputChange}
                  placeholder="Name der verantwortlichen Person"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gewerk" className="font-medium">
                  Gewerk
                </Label>
                <Input
                  id="gewerk"
                  name="gewerk"
                  value={formData.gewerk || ""}
                  onChange={handleInputChange}
                  placeholder="z.B. Elektro, Sanitär, Dach"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="firma" className="font-medium">
                  Firma
                </Label>
                <Input
                  id="firma"
                  name="firma"
                  value={formData.firma || ""}
                  onChange={handleInputChange}
                  placeholder="Name des ausführenden Unternehmens"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="beschreibung" className="font-medium">
              Beschreibung des Problems <span className="text-[#E30613]">*</span>
            </Label>
            <Textarea
              id="beschreibung"
              name="beschreibung"
              value={formData.beschreibung}
              onChange={handleInputChange}
              placeholder="Bitte beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
              rows={5}
              className={errors.beschreibung ? "border-red-500" : ""}
              aria-invalid={!!errors.beschreibung}
              aria-describedby={errors.beschreibung ? "beschreibung-error" : undefined}
            />
            {errors.beschreibung && (
              <p id="beschreibung-error" className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.beschreibung}
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="font-medium">Bilder/Dokumente hochladen</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#E30613] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-1">
                Klicken Sie hier oder ziehen Sie Dateien hierher
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, GIF, WebP oder PDF (max. 10MB pro Datei)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Dateien hochladen"
              />
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-500"
                      aria-label={`${file.name} entfernen`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* reCAPTCHA Placeholder */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                <span className="text-xs text-gray-600">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  reCAPTCHA-Platzhalter
                </p>
                <p className="text-xs text-gray-500">
                  In der Produktionsversion wird hier ein reCAPTCHA eingebunden.
                </p>
              </div>
            </div>
          </div>

          {/* DSGVO Checkbox */}
          <div className="space-y-2">
            <label
              htmlFor="dsgvoAccepted"
              className="flex gap-3 cursor-pointer group"
            >
              <Checkbox
                id="dsgvoAccepted"
                checked={formData.dsgvoAccepted}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({
                    ...prev,
                    dsgvoAccepted: checked === true,
                  }));
                  if (errors.dsgvoAccepted) {
                    setErrors((prev) => ({ ...prev, dsgvoAccepted: undefined }));
                  }
                }}
                className="mt-0.5 shrink-0 border-gray-400 data-[state=checked]:bg-[#E30613] data-[state=checked]:border-[#E30613]"
                aria-invalid={!!errors.dsgvoAccepted}
                aria-describedby={errors.dsgvoAccepted ? "dsgvo-error" : undefined}
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                Ich habe die{" "}
                <a
                  href="https://www.tc.de/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E30613] hover:underline font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  Datenschutzerklärung
                </a>{" "}
                zur Kenntnis genommen und bin damit einverstanden, dass die von mir eingegebenen Daten elektronisch verarbeitet und gespeichert werden.
                <span className="text-[#E30613] ml-1">*</span>
              </span>
            </label>
            {errors.dsgvoAccepted && (
              <p id="dsgvo-error" className="text-sm text-red-500 flex items-center gap-1 ml-7">
                <AlertCircle className="w-4 h-4" />
                {errors.dsgvoAccepted}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E30613] hover:bg-[#C00510] text-white font-semibold py-6 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              "Absenden"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
