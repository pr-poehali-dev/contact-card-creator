import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { AdminPanel } from "@/components/AdminPanel";
import { LoginDialog } from "@/components/LoginDialog";

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

const CONTACTS_URL = "https://functions.poehali.dev/8ac292f9-91df-4949-911c-f0fee6ad4870";

const Index = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(localStorage.getItem('session_token'));

  const fetchData = async () => {
    const contactsRes = await fetch(CONTACTS_URL);
    setContacts(await contactsRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = (token: string) => {
    setSessionToken(token);
    setLoginOpen(false);
    setAdminOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    setSessionToken(null);
    setAdminOpen(false);
  };

  const openTelegram = (username: string) => {
    window.open(`https://t.me/${username}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(155,135,245,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(217,70,239,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.15),transparent_50%)]" />
      
      <div className="relative z-10 container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight">Slivki Ghetto</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Актуалы черного рынка</p>
        </div>

        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <Icon name="Users" className="text-purple-400" size={32} />
            <h2 className="text-3xl font-bold text-white">Контакты</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact, index) => (
              <Card 
                key={contact.id} 
                className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${contact.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className="p-6 relative z-10">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${contact.color} mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {contact.name.charAt(0)}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {contact.name}
                  </h3>
                  
                  <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {contact.role}
                  </Badge>
                  
                  <Button 
                    onClick={() => openTelegram(contact.telegram)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                  >
                    <Icon name="Send" size={18} className="mr-2" />
                    Написать в Telegram
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center flex gap-4 justify-center">
          {sessionToken ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setAdminOpen(true)}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
              >
                <Icon name="Settings" size={18} className="mr-2" />
                Панель управления
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-400"
              >
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setLoginOpen(true)}
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
            >
              <Icon name="LogIn" size={18} className="mr-2" />
              Войти
            </Button>
          )}
        </div>
      </div>

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} onLogin={handleLogin} />
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} onDataUpdate={fetchData} sessionToken={sessionToken} />
    </div>
  );
};

export default Index;