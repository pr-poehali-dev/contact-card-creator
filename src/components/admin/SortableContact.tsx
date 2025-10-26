import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Contact } from "./types";

interface SortableContactProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  editorName?: string;
}

export const SortableContact = ({ contact, onEdit, onDelete, canEdit, editorName }: SortableContactProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 bg-slate-900 border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-move touch-none">
            <Icon name="GripVertical" size={20} className="text-gray-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white">{contact.name}</h4>
            <p className="text-sm text-gray-400">{contact.role}</p>
            <p className="text-sm text-gray-500">@{contact.telegram}</p>
            {editorName && (
              <p className="text-xs text-cyan-400 mt-1">
                <Icon name="User" size={12} className="inline mr-1" />
                Создал: {editorName}
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(contact)}
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
            >
              <Icon name="Edit" size={16} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(contact.id)}
              className="border-red-500/50 text-red-300 hover:bg-red-500/10"
            >
              <Icon name="Trash2" size={16} />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
