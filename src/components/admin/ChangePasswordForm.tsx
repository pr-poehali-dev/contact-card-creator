import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChangePasswordFormProps {
  changePassword: { old: string; new: string; confirm: string };
  setChangePassword: (value: { old: string; new: string; confirm: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ChangePasswordForm = ({ changePassword, setChangePassword, onSave, onCancel }: ChangePasswordFormProps) => {
  return (
    <Card className="p-6 bg-slate-900 border-cyan-500/30 mb-4">
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
          <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
            Сохранить
          </Button>
          <Button onClick={onCancel} variant="outline">
            Отмена
          </Button>
        </div>
      </div>
    </Card>
  );
};
