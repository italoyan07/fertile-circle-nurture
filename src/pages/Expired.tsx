import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoFertile from "@/assets/logo-fertile.png";

const WHATSAPP_SUPPORT = "https://wa.me/5500000000000";

const Expired = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6 text-center animate-fade-in">
        <img src={logoFertile} alt="Programa FÉRTILE" className="mx-auto h-14 object-contain" />
        <h1 className="font-display text-2xl font-semibold text-foreground">Seu acesso foi encerrado</h1>
        <p className="text-sm text-muted-foreground font-body">
          Renove seu plano para voltar a acessar a Comunidade Fertile e continuar sua jornada. 🌸
        </p>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg" onClick={() => navigate("/planos")}>
          Ver planos
        </Button>
        <a href={WHATSAPP_SUPPORT} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5" size="lg">
            Falar com suporte
          </Button>
        </a>
      </div>
    </div>
  );
};

export default Expired;
