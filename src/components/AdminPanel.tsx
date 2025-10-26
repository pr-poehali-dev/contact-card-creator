import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Contact {
  id: number;
  name: string;
  role: string;
  telegram: string;
  color: string;
}

interface Editor {
  id: number;
  username: string;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  role: string;
}

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpdate: () => void;
  sessionToken: string | null;
  user: User | null;
}

const CONTACTS_URL = "https://functions.poehali.dev/8ac292f9-91df-4949-911c-f0fee6ad4870";
const EDITORS_URL = "https://functions.poehali.dev/419aca2d-b4f5-4523-8db0-dd42edf442f4";

const colorOptions = [
  { value: "from-purple-500 to-pink-500", label: "Фиолетово-розовый" },
  { value: "from-blue-500 to-cyan-500", label: "Сине-голубой" },
  { value: "from-violet-500 to-purple-500", label: "Фиолетовый" },
  { value: "from-green-500 to-emerald-500", label: "Зеленый" },
  { value: "from-orange-500 to-red-500", label: "Оранжево-красный" },
  { value: "from-pink-500 to-rose-500", label: "Розовый" }
];

export const AdminPanel = ({ open, onOpenChange, onDataUpdate, sessionToken, user }: AdminPanelProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
  const [newEditor, setNewEditor] = useState({ username: '', password: '' });

  const fetchContacts = async () => {
    const response = await fetch(CONTACTS_URL);
    const data = await response.json();
    setContacts(data);
  };

  const fetchEditors = async () => {
    if (!sessionToken || user?.role !== 'superadmin') return;
    const response = await fetch(EDITORS_URL, {
      headers: { 'X-Session-Token': sessionToken }
    });
    if (response.ok) {
      const data = await response.json();
      setEditors(data);
    }
  };

  useEffect(() => {
    if (open) {
      fetchContacts();
      fetchEditors();
    }
  }, [open, sessionToken, user]);

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

  const addEditor = async () => {
    if (!newEditor.username || !newEditor.password) {
      toast.error("Заполните все поля");
      return;
    }

    const response = await fetch(EDITORS_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || ''
      },
      body: JSON.stringify(newEditor)
    });

    if (response.ok) {
      toast.success("Редактор добавлен");
      setNewEditor({ username: '', password: '' });
      fetchEditors();
    } else {
      const error = await response.json();
      toast.error(error.error || "Ошибка добавления редактора");
    }
  };

  const deleteEditor = async (id: number) => {
    const response = await fetch(`${EDITORS_URL}?id=${id}`, { 
      method: 'DELETE',
      headers: { 'X-Session-Token': sessionToken || '' }
    });
    
    if (response.ok) {
      toast.success("Редактор удален");
      fetchEditors();
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
            {user?.role === 'superadmin' && (
              <TabsTrigger value="editors">Редакторы</TabsTrigger>
            )}
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

          {user?.role === 'superadmin' && (
            <TabsContent value="editors" className="space-y-4">
              <Card className="p-6 bg-slate-900 border-purple-500/30">
                <h3 className="text-lg font-bold text-white mb-4">Добавить редактора</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Логин</Label>
                    <Input
                      value={newEditor.username}
                      onChange={(e) => setNewEditor({ ...newEditor, username: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="editor1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Пароль</Label>
                    <Input
                      type="password"
                      value={newEditor.password}
                      onChange={(e) => setNewEditor({ ...newEditor, password: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <Button onClick={addEditor} className="bg-green-600 hover:bg-green-700">
                    <Icon name="UserPlus" size={18} className="mr-2" />
                    Добавить
                  </Button>
                </div>
              </Card>

              <div className="space-y-3">
                {editors.map(editor => (
                  <Card key={editor.id} className="p-4 bg-slate-900 border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white">{editor.username}</h4>
                        <p className="text-xs text-gray-500">Создан: {new Date(editor.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteEditor(editor.id)}
                        className="border-red-500/50 text-red-300 hover:bg-red-500/10"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};