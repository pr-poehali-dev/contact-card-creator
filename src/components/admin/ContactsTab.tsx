import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Contact, User } from "./types";
import { SortableContact } from "./SortableContact";
import { ContactForm } from "./ContactForm";

interface ContactsTabProps {
  contacts: Contact[];
  editingContact: Partial<Contact> | null;
  setEditingContact: (contact: Partial<Contact> | null) => void;
  saveContact: () => void;
  deleteContact: (id: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  sensors: any;
  user: User | null;
  usersMap: Record<number, string>;
}

export const ContactsTab = ({
  contacts,
  editingContact,
  setEditingContact,
  saveContact,
  deleteContact,
  handleDragEnd,
  sensors,
  user,
  usersMap
}: ContactsTabProps) => {
  return (
    <div className="space-y-4">
      <Button 
        onClick={() => setEditingContact({ color: 'from-purple-500 to-pink-500' })}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        <Icon name="Plus" size={18} className="mr-2" />
        Добавить контакт
      </Button>

      {editingContact && (
        <ContactForm
          contact={editingContact}
          setContact={setEditingContact}
          onSave={saveContact}
        />
      )}

      {user?.role === 'superadmin' ? (
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
                  editorName={contact.created_by ? usersMap[contact.created_by] : undefined}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-3">
          {contacts.filter(c => c.created_by === user?.id).map(contact => (
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
      )}
    </div>
  );
};
