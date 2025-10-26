import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Contact, colorOptions } from "./types";

interface ContactFormProps {
  contact: Partial<Contact>;
  setContact: (contact: Partial<Contact> | null) => void;
  onSave: () => void;
}

export const ContactForm = ({ contact, setContact, onSave }: ContactFormProps) => {
  return (
    <Card className="p-6 bg-slate-900 border-purple-500/30">
      <h3 className="text-lg font-bold text-white mb-4">
        {contact.id ? 'Редактировать контакт' : 'Новый контакт'}
      </h3>
      <div className="space-y-4">
        <div>
          <Label className="text-gray-300">Имя</Label>
          <Input
            value={contact.name || ''}
            onChange={(e) => setContact({ ...contact, name: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300">Должность</Label>
          <Input
            value={contact.role || ''}
            onChange={(e) => setContact({ ...contact, role: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div>
          <Label className="text-gray-300">Telegram (без @)</Label>
          <Input
            value={contact.telegram || ''}
            onChange={(e) => setContact({ ...contact, telegram: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white"
            placeholder="username"
          />
        </div>
        <div>
          <Label className="text-gray-300">Цвет градиента</Label>
          <select
            value={contact.color || 'from-purple-500 to-pink-500'}
            onChange={(e) => setContact({ ...contact, color: e.target.value })}
            className="w-full p-2 rounded-md bg-slate-800 border border-slate-700 text-white"
          >
            {colorOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
            Сохранить
          </Button>
          <Button onClick={() => setContact(null)} variant="outline">
            Отмена
          </Button>
        </div>
      </div>
    </Card>
  );
};
