"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type MasterDataType = 'bauleitung' | 'verantwortlicher' | 'gewerk' | 'firma';

const TYPE_LABELS: Record<MasterDataType, string> = {
  bauleitung: "Bauleitung",
  verantwortlicher: "Verantwortlicher",
  gewerk: "Gewerk",
  firma: "Firma",
};

interface MasterDataItem {
  id: string;
  name: string;
  active: boolean;
}

interface MasterDataManagementProps {
  onClose?: () => void;
}

export default function MasterDataManagement({ onClose }: MasterDataManagementProps) {
  const [activeTab, setActiveTab] = useState<MasterDataType>('bauleitung');
  const [data, setData] = useState<Record<MasterDataType, MasterDataItem[]>>({
    bauleitung: [],
    verantwortlicher: [],
    gewerk: [],
    firma: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/master-data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to load master data:', error);
      toast.error('Fehler beim Laden der Stammdaten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async () => {
    const name = newItemName.trim();
    if (!name) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab, name }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Fehler beim Hinzufügen');
        return;
      }

      setData(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], result.item],
      }));

      setNewItemName("");
      toast.success(`${TYPE_LABELS[activeTab]} "${name}" hinzugefügt`);
    } catch (error) {
      console.error('Failed to add item:', error);
      toast.error('Fehler beim Hinzufügen');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/master-data/${id}?type=${activeTab}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        toast.error('Fehler beim Löschen');
        return;
      }

      setData(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => item.id !== id),
      }));

      toast.success(`${TYPE_LABELS[activeTab]} gelöscht`);
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stammdaten verwalten</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(Object.keys(TYPE_LABELS) as MasterDataType[]).map((type) => (
            <Button
              key={type}
              variant={activeTab === type ? "default" : "outline"}
              onClick={() => setActiveTab(type)}
              className={activeTab === type ? "bg-[#E30613] hover:bg-[#C00510]" : ""}
            >
              {TYPE_LABELS[type]}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#E30613] animate-spin" />
          </div>
        ) : (
          <>
            {/* Add new item */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder={`Neuen ${TYPE_LABELS[activeTab]} hinzufügen...`}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAdding}
              />
              <Button
                onClick={handleAdd}
                disabled={!newItemName.trim() || isAdding}
                className="bg-[#E30613] hover:bg-[#C00510]"
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {data[activeTab].length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Keine {TYPE_LABELS[activeTab]} vorhanden
                </p>
              ) : (
                data[activeTab].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium">{item.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting === item.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              {data[activeTab].length} {TYPE_LABELS[activeTab]}
              {data[activeTab].length !== 1 ? 'e' : ''}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
