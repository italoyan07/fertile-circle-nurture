import { useState } from "react";
import { Camera, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import logoFertile from "@/assets/logo-fertile.png";

const Profile = () => {
  const [name, setName] = useState("Maria Silva");
  const [age, setAge] = useState("32");
  const [tryingFor, setTryingFor] = useState("1 ano");
  const [diagnosis, setDiagnosis] = useState("sop");
  const [privateProfile, setPrivateProfile] = useState(true);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-12 pb-5">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Meu Perfil</h1>
            <p className="mt-1 text-sm text-muted-foreground font-body">Informações pessoais</p>
          </div>
          <img src={logoFertile} alt="FÉRTILE" className="h-8 object-contain opacity-60" />
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-5 pt-5">
        {/* Avatar */}
        <div className="flex flex-col items-center animate-fade-in">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 font-display text-3xl font-bold text-primary">
              M
            </div>
            <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 font-display text-xl font-semibold text-foreground">{name}</p>
        </div>

        {/* Form */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-soft animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Nome
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="font-body" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Idade
            </Label>
            <Input value={age} onChange={(e) => setAge(e.target.value)} className="font-body" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Tentando engravidar há...
            </Label>
            <Input
              value={tryingFor}
              onChange={(e) => setTryingFor(e.target.value)}
              placeholder="Ex: 6 meses, 1 ano"
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-body">
              Diagnóstico (opcional)
            </Label>
            <Select value={diagnosis} onValueChange={setDiagnosis}>
              <SelectTrigger className="font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum diagnóstico</SelectItem>
                <SelectItem value="sop">SOP</SelectItem>
                <SelectItem value="endometriose">Endometriose</SelectItem>
                <SelectItem value="fiv">Em tratamento de FIV</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground font-body">Perfil privado</p>
              <p className="text-xs text-muted-foreground font-body">
                Apenas você pode ver suas informações pessoais
              </p>
            </div>
            <Switch checked={privateProfile} onCheckedChange={setPrivateProfile} />
          </div>
        </div>

        <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/5">
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Profile;
