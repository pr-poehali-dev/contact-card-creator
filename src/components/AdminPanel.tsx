import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Contact, Editor, User, CONTACTS_URL, EDITORS_URL, CHANGE_PASSWORD_URL } from "./admin/types";
import { ChangePasswordForm } from "./admin/ChangePasswordForm";
import { ContactsTab } from "./admin/ContactsTab";
import { EditorsTab } from "./admin/EditorsTab";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataUpdate: () => void;
  sessionToken: string | null;
  user: User | null;
}

export const AdminPanel = ({ open, onOpenChange, onDataUpdate, sessionToken, user }: AdminPanelProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editors, setEditors] = useState<Editor[]>([]);
  const [editingContact, setEditingContact] = useState<Partial<Contact> | null>(null);
  const [newEditor, setNewEditor] = useState({ username: '', password: '' });
  const [changePassword, setChangePassword] = useState({ old: '', new: '', confirm: '' });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [usersMap, setUsersMap] = useState<Record<number, string>>({});
  
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

  const fetchEditors = async () => {
    if (!sessionToken || user?.role !== 'superadmin') return;
    const response = await fetch(EDITORS_URL, {
      headers: { 'X-Session-Token': sessionToken }
    });
    if (response.ok) {
      const data = await response.json();
      setEditors(data);
      
      const map: Record<number, string> = { [user.id]: 'admin' };
      data.forEach((editor: Editor) => {
        map[editor.id] = editor.username;
      });
      setUsersMap(map);
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

    const response = await fetch(CHANGE_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken || ''
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
          <ChangePasswordForm
            changePassword={changePassword}
            setChangePassword={setChangePassword}
            onSave={handleChangePassword}
            onCancel={() => setShowChangePassword(false)}
          />
        )}

        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className={`grid w-full ${user?.role === 'superadmin' ? 'grid-cols-2' : 'grid-cols-1'} bg-slate-900`}>
            <TabsTrigger value="contacts">Контакты</TabsTrigger>
            {user?.role === 'superadmin' && (
              <TabsTrigger value="editors">Редакторы</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <ContactsTab
              contacts={contacts}
              editingContact={editingContact}
              setEditingContact={setEditingContact}
              saveContact={saveContact}
              deleteContact={deleteContact}
              handleDragEnd={handleDragEnd}
              sensors={sensors}
              user={user}
              usersMap={usersMap}
            />
          </TabsContent>

          {user?.role === 'superadmin' && (
            <TabsContent value="editors" className="space-y-4">
              <EditorsTab
                editors={editors}
                newEditor={newEditor}
                setNewEditor={setNewEditor}
                addEditor={addEditor}
                deleteEditor={deleteEditor}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
