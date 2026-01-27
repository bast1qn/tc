"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Bis wann besteht eine Gewährleistungsfrist?",
    answer:
      "Die Gewährleistungsfrist beträgt 5 Jahre nach Abnahme. Innerhalb dieser Zeit können Sie Mängel geltend machen, die auf fehlerhafte Bauausführung zurückzuführen sind.",
  },
  {
    question: "Was ist der Unterschied zwischen Gewährleistung und Garantie?",
    answer:
      "Die Gewährleistung ist ein gesetzlicher Anspruch gegenüber dem Verkäufer bei Mängeln. Die Garantie ist eine freiwillige Zusatzleistung des Herstellers oder Verkäufers, die über die gesetzlichen Ansprüche hinausgehen kann.",
  },
  {
    question: "Welche Unterlagen benötige ich für eine Gewährleistungsanfrage?",
    answer:
      "Für eine schnelle Bearbeitung benötigen wir Ihre Bauvorhaben-Nummer (aus Ihren Rechnungen oder Zusatzvereinbarungen), eine detaillierte Beschreibung des Sachverhaltes sowie aussagekräftige Fotos oder Dokumente, die den Sachverhalt dokumentieren.",
  },
  {
    question: "Wie lange dauert die Bearbeitung meiner Anfrage?",
    answer:
      "Wir bemühen uns, jede Anfrage innerhalb von 5-10 Werktagen zu prüfen und Sie über das weitere Vorgehen zu informieren. Die tatsächliche Dauer hängt von der Art und dem Umfang des gemeldeten Mangels ab.",
  },
  {
    question: "Was passiert nach dem Einreichen meiner Anfrage?",
    answer:
      "Nach dem Einreichen erhalten Sie eine Bestätigung. Anschließend wird Ihre Anfrage von unserem Kundenservice geprüft. Bei Bedarf kontaktieren wir Sie für weitere Informationen oder vereinbaren einen Vor-Ort-Termin.",
  },
  {
    question: "Was ist, wenn der Mangel außerhalb der Gewährleistungsfrist auftritt?",
    answer:
      "Bei Mängeln außerhalb der Gewährleistungsfrist können wir Ihnen dennoch weiterhelfen. Kontaktieren Sie uns, und wir finden gemeinsam eine Lösung, beispielsweise über unseren Reparaturservice.",
  },
];

export default function FAQ() {
  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E30613]/10 rounded-full flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-[#E30613]" />
          </div>
          <div>
            <CardTitle className="text-xl">Häufig gestellte Fragen</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Antworten auf die wichtigsten Fragen zur Gewährleistung
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left hover:text-[#E30613] hover:no-underline">
                <span className="font-medium">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
