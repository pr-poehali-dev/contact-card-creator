import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableContact } from "./admin/SortableContact";

const CONTACTS_URL = "https://functions.poehali.dev/8ac292f9-91df-4949-911c-f0fee6ad4870";
const CHANGE_PASSWORD_URL = "https://functions.poehali.dev/29b968a6-e9e5-41e9-a806-fd45fb51170f";

interface Contact {
  id: number;
  name: string;
  role: string;
  telegram: string;
  color: string;
  order_index: number;
}

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpdate: () => void;
  sessionToken: string | null;
}

const colorOptions = [
  { value: 'from-purple-500 to-pink-500', label: '🟣 Фиолетовый → Розовый' },
  { value: 'from-blue-500 to-cyan-500', label: '🔵 Синий → Голубой' },
  { value: 'from-green-500 to-emerald-500', label: '🟢 Зеленый → Изумрудный' },
  { value: 'from-orange-500 to-red-500', label: '🟠 Оранжевый → Красный' },
  { value: 'from-pink-500 to-rose-500', label: '🌸 Розовый → Алый' },
  { value: 'from-yellow-500 to-orange-500', label: '🟡 Желтый → Оранжевый' },
];

export const AdminPanel = ({ open, onOpenChange, onDataUpdate, sessionToken }: AdminPanelProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePassword, setChangePassword] = useState({ old: '', new: '', confirm: '' });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchContacts = async () => {
    const response = await fetch(CONTACTS_URL);
    const data = await response.json();
    setContacts(data);
  };

  useEffect(() => {
    if (open) {
      fetchContacts();
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
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || ''
      },
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
    } else {
      const error = await response.json();
      toast.error(error.error || "Ошибка сохранения");
    }
  };

  const deleteContact = async (id: number) => {
    const response = await fetch(`${CONTACTS_URL}?id=${id}`, { 
      method: 'DELETE',
      headers: { 'X-Session-Token': sessionToken || '' }
    });
    
    if (response.ok) {
      toast.success("Контакт удален");
      fetchContacts();
      onDataUpdate();
    } else {
      const error = await response.json();
      toast.error(error.error || "Ошибка удаления");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = contacts.findIndex((c) => c.id === active.id);
    const newIndex = contacts.findIndex((c) => c.id === over.id);

    const newContacts = arrayMove(contacts, oldIndex, newIndex);
    setContacts(newContacts);

    const orders = newContacts.map((c, index) => ({
      id: c.id,
      order_index: index
    }));

    const response = await fetch(CONTACTS_URL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || ''
      },
      body: JSON.stringify({ orders })
    });

    if (response.ok) {
      toast.success("Порядок обновлён");
      onDataUpdate();
    } else {
      fetchContacts();
      toast.error("Ошибка изменения порядка");
    }
  };

  const handleChangePassword = async () => {
    if (!changePassword.new || !changePassword.old) {
      toast.error("Заполните все поля");
      return;
    }

    if (changePassword.new !== changePassword.confirm) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (changePassword.new.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }

    const response = await fetch(CHANGE_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        old_password: changePassword.old,
        new_password: changePassword.new
      })
    });

    if (response.ok) {
      toast.success("Пароль успешно изменён");
      setChangePassword({ old: '', new: '', confirm: '' });
      setShowChangePassword(false);
    } else {
      const error = await response.json();
      toast.error(error.error || "Ошибка смены пароля");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-950 border-purple-500/30">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Панель управления
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10"
            >
              <Icon name="Key" size={16} className="mr-2" />
              Сменить пароль
            </Button>
          </div>
        </DialogHeader>

        {showChangePassword && (
          <Card className="p-6 bg-slate-900 border-yellow-500/30">
            <h3 className="text-lg font-bold text-white mb-4">Смена пароля</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Текущий пароль</Label>
                <Input
                  type="password"
                  value={changePassword.old}
                  onChange={(e) => setChangePassword({ ...changePassword, old: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Новый пароль</Label>
                <Input
                  type="password"
                  value={changePassword.new}
                  onChange={(e) => setChangePassword({ ...changePassword, new: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300">Подтвердите новый пароль</Label>
                <Input
                  type="password"
                  value={changePassword.confirm}
                  onChange={(e) => setChangePassword({ ...changePassword, confirm: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleChangePassword} className="bg-green-600 hover:bg-green-700">
                  Сохранить
                </Button>
                <Button onClick={() => setShowChangePassword(false)} variant="outline">
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={contacts.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {contacts.map(contact => (
                  <SortableContact
                    key={contact.id}
                    contact={contact}
                    onEdit={setEditingContact}
                    onDelete={deleteContact}
                    canEdit={true}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </DialogContent>
    </Dialog>
  );
};