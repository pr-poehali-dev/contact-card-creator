import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";

interface LoginPageProps {
  onLogin: (token: string, role: string) => void;
}

const AUTH_URL = "https://functions.poehali.dev/26237d07-d352-46bf-852b-1ec3f06d3086";

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.token, data.role);
        toast.success("Успешный вход!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Ошибка входа");
      }
    } catch (error) {
      toast.error("Ошибка подключения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-slate-900 border-purple-500/30">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Вход в систему
          </h1>
          <p className="text-gray-400">Панель управления</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-gray-300">Логин</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mt-2"
              placeholder="Введите логин"
              required
            />
          </div>

          <div>
            <Label className="text-gray-300">Пароль</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white mt-2"
              placeholder="Введите пароль"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                Вход...
              </>
            ) : (
              <>
                <Icon name="LogIn" size={18} className="mr-2" />
                Войти
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;