import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    supabase.from("profiles").select("nome").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.nome) setNome(data.nome); });
  }, [user]);

  useEffect(() => {
    const prefs = localStorage.getItem("user_preferences");
    if (prefs) {
      const parsed = JSON.parse(prefs);
      setDarkMode(parsed.darkMode ?? false);
      setNotifications(parsed.notifications ?? true);
      if (parsed.darkMode) document.documentElement.classList.add("dark");
    }
  }, []);

  const handleSaveProfile = () => {
    toast.success("Perfil salvo com sucesso (mockado)");
  };

  const savePrefs = (prefs: { darkMode: boolean; notifications: boolean }) => {
    localStorage.setItem("user_preferences", JSON.stringify(prefs));
    toast.success("Preferências salvas");
  };

  const handleToggleDark = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
    savePrefs({ darkMode: checked, notifications });
  };

  const handleToggleNotif = (checked: boolean) => {
    setNotifications(checked);
    savePrefs({ darkMode, notifications: checked });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil e preferências do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize seus dados pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled
                />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
              </div>
              <Button onClick={handleSaveProfile}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card>
            <CardHeader>
              <CardTitle>Preferências</CardTitle>
              <CardDescription>Personalize sua experiência no sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Tema escuro</Label>
                  <p className="text-sm text-muted-foreground">Alterna entre tema claro e escuro</p>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleToggleDark} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notificações</Label>
                  <p className="text-sm text-muted-foreground">Receber notificações do sistema</p>
                </div>
                <Switch id="notifications" checked={notifications} onCheckedChange={handleToggleNotif} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
