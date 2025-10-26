import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";

interface Contact {
  id: number;
  name: string;
  role: string;
  telegram: string;
  color: string;
}

interface NewsItem {
  id: number;
  title: string;
  date: string;
  description: string;
}

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpdate: () => void;
}

const CONTACTS_URL = "https://functions.poehali.dev/8ac292f9-91df-4949-911c-f0fee6ad4870";
const NEWS_URL = "https://functions.poehali.dev/747ed546-8975-4aa7-8e70-93b99f858cad";

const colorOptions = [
  { value: "from-purple-500 to-pink-500", label: "Фиолетово-розовый" },
  { value: "from-blue-500 to-cyan-500", label: "Сине-голубой" },
  { value: "from-violet-500 to-purple-500", label: "Фиолетовый" },
  { value: "from-green-500 to-emerald-500", label: "Зеленый" },
  { value: "from-orange-500 to-red-500", label: "Оранжево-красный" },
  { value: "from-pink-500 to-rose-500", label: "Розовый" }
];

export const AdminPanel = ({ open, onOpenChange, onDataUpdate }: AdminPanelProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
  const [editingNews, setEditingNews] = useState<Partial<NewsItem> | null>(null);

  const fetchContacts = async () => {
    const response = await fetch(CONTACTS_URL);
    const data = await response.json();
    setContacts(data);
  };

  const fetchNews = async () => {
    const response = await fetch(NEWS_URL);
    const data = await response.json();
    setNews(data);
  };

  useEffect(() => {
    if (open) {
      fetchContacts();
      fetchNews();
    }
  }, [open]);

  const saveContact = async () => {
    if (!editingContact?.name || !editingContact?.role || !editingContact?.telegram) {
      toast.error("Заполните все поля контакта");
      return;
    }

    const method = editingContact.id ? 'PUT' : 'POST';
    const url = editingContact.id ? `${CONTACTS_URL}?id=${editingContact.id}` : CONTACTS_URL;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingContact.name,
        role: editingContact.role,
        telegram: editingContact.telegram,
        color: editingContact.color || 'from-purple-500 to-pink-500'
      })
    });

    if (response.ok) {
      toast.success(editingContact.id ? "Контакт обновлен" : "Контакт создан");
      setEditingContact(null);
      fetchContacts();
      onDataUpdate();
    }
  };

  const deleteContact = async (id: number) => {
    const response = await fetch(`${CONTACTS_URL}?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success("Контакт удален");
      fetchContacts();
      onDataUpdate();
    }
  };

  const saveNews = async () => {
    if (!editingNews?.title || !editingNews?.description || !editingNews?.date) {
      toast.error("Заполните все поля новости");
      return;
    }

    const method = editingNews.id ? 'PUT' : 'POST';
    const url = editingNews.id ? `${NEWS_URL}?id=${editingNews.id}` : NEWS_URL;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingNews.title,
        description: editingNews.description,
        date: editingNews.date
      })
    });

    if (response.ok) {
      toast.success(editingNews.id ? "Новость обновлена" : "Новость создана");
      setEditingNews(null);
      fetchNews();
      onDataUpdate();
    }
  };

  const deleteNews = async (id: number) => {
    const response = await fetch(`${NEWS_URL}?id=${id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success("Новость удалена");
      fetchNews();
      onDataUpdate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Панель управления
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900">
            <TabsTrigger value="contacts">Контакты</TabsTrigger>
            <TabsTrigger value="news">Новости</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <Button 
              onClick={() => setEditingContact({ color: 'from-purple-500 to-pink-500' })}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить контакт
            </Button>

            {editingContact && (
              <Card className="p-6 bg-slate-900 border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">
                  {editingContact.id ? 'Редактировать контакт' : 'Новый контакт'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Имя</Label>
                    <Input
                      value={editingContact.name || ''}
                      onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Должность</Label>
                    <Input
                      value={editingContact.role || ''}
                      onChange={(e) => setEditingContact({ ...editingContact, role: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Telegram (без @)</Label>
                    <Input
                      value={editingContact.telegram || ''}
                      onChange={(e) => setEditingContact({ ...editingContact, telegram: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Цвет градиента</Label>
                    <select
                      value={editingContact.color || 'from-purple-500 to-pink-500'}
                      onChange={(e) => setEditingContact({ ...editingContact, color: e.target.value })}
                      className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 text-white"
                    >
                      {colorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveContact} className="bg-green-600 hover:bg-green-700">
                      Сохранить
                    </Button>
                    <Button onClick={() => setEditingContact(null)} variant="outline">
                      Отмена
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {contacts.map(contact => (
                <Card key={contact.id} className="p-4 bg-slate-900 border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{contact.name}</h4>
                      <p className="text-sm text-gray-400">{contact.role}</p>
                      <p className="text-sm text-gray-500">@{contact.telegram}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingContact(contact)}
                        className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteContact(contact.id)}
                        className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <Button 
              onClick={() => setEditingNews({})}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Icon name="Plus" size={18} className="mr-2" />
              Добавить новость
            </Button>

            {editingNews && (
              <Card className="p-6 bg-slate-900 border-cyan-500/30">
                <h3 className="text-lg font-bold text-white mb-4">
                  {editingNews.id ? 'Редактировать новость' : 'Новая новость'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Заголовок</Label>
                    <Input
                      value={editingNews.title || ''}
                      onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Описание</Label>
                    <Textarea
                      value={editingNews.description || ''}
                      onChange={(e) => setEditingNews({ ...editingNews, description: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Дата</Label>
                    <Input
                      value={editingNews.date || ''}
                      onChange={(e) => setEditingNews({ ...editingNews, date: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="26 октября 2025"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveNews} className="bg-green-600 hover:bg-green-700">
                      Сохранить
                    </Button>
                    <Button onClick={() => setEditingNews(null)} variant="outline">
                      Отмена
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {news.map(item => (
                <Card key={item.id} className="p-4 bg-slate-900 border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{item.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{item.date}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingNews(item)}
                        className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Icon name="Edit" size={16} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNews(item.id)}
                        className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
