import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";
import { Editor } from "./types";

interface EditorsTabProps {
  editors: Editor[];
  newEditor: { username: string; password: string };
  setNewEditor: (editor: { username: string; password: string }) => void;
  addEditor: () => void;
  deleteEditor: (id: number) => void;
}

export const EditorsTab = ({ editors, newEditor, setNewEditor, addEditor, deleteEditor }: EditorsTabProps) => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};
