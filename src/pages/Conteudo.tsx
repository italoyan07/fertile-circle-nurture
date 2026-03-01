import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  PlayCircle,
  ShoppingCart,
  BookOpen,
  Tag,
  Plane,
  Lock,
  ExternalLink,
  X,
} from "lucide-react";
import Hls from "hls.js";
import logoFertile from "@/assets/logo-fertile.png";

const materialIcons: Record<string, React.ElementType> = {
  "Lista de compras": ShoppingCart,
  "E-book de receitas para fertilidade": BookOpen,
  "Cupons de desconto em marcas de suplementos": Tag,
  "Como adaptar a alimentação em viagens e fins de semana": Plane,
};

const MODULE_ORDER = [
  "Boas-vindas e orientações iniciais",
  "Pilares da Fertilidade",
  "Ciclo menstrual e fertilidade",
  "Materiais de Apoio",
];

interface Lesson {
  id: string;
  module_name: string;
  title: string;
  hls_url: string;
  order_index: number;
  plan_required: string;
  pdf_url: string | null;
}

const VideoPlayer = ({ url, onClose }: { url: string; onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("loadedmetadata", () => video.play());
    }
  }, [url]);

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-border shadow-card bg-card">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
        <span className="text-xs text-muted-foreground font-body">Reproduzindo aula</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <video
        ref={videoRef}
        controls
        controlsList="nodownload"
        className="w-full aspect-video bg-foreground/5"
      />
    </div>
  );
};

const Conteudo = () => {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Lesson[];
    },
  });

  const grouped = MODULE_ORDER.reduce<Record<string, Lesson[]>>((acc, mod) => {
    acc[mod] = lessons.filter((l) => l.module_name === mod);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-lg flex items-center justify-center gap-3 px-4 py-3">
          <img src={logoFertile} alt="FÉRTILE" className="h-8 w-8 rounded-full object-cover" />
          <h1 className="font-display text-xl font-semibold text-foreground">
            Conteúdo do Programa
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground font-body text-sm">Carregando conteúdo...</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {MODULE_ORDER.map((moduleName, idx) => {
              const moduleLessons = grouped[moduleName] || [];
              const moduleNumber = idx + 1;
              const isMaterials = moduleName === "Materiais de Apoio";

              return (
                <AccordionItem
                  key={moduleName}
                  value={moduleName}
                  className="border border-border rounded-xl overflow-hidden shadow-soft bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-body text-sm font-bold">
                        {moduleNumber}
                      </span>
                      <span className="font-display text-base font-semibold text-foreground">
                        {moduleName}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {moduleLessons.map((lesson) => {
                        const isPlaying = activeVideo === lesson.id;

                        if (isMaterials && lesson.pdf_url) {
                          const IconComp = materialIcons[lesson.title] || BookOpen;
                          return (
                            <div key={lesson.id}>
                              <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                                <div className="flex items-center gap-3">
                                  <IconComp className="h-5 w-5 text-primary shrink-0" />
                                  <span className="font-body text-sm text-foreground">
                                    {lesson.title}
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-xs"
                                  onClick={() => window.open(lesson.pdf_url!, "_blank")}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Acessar
                                </Button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={lesson.id}>
                            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                              <div className="flex items-center gap-3">
                                <PlayCircle className="h-5 w-5 text-primary shrink-0" />
                                <span className="font-body text-sm text-foreground">
                                  {lesson.title}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant={isPlaying ? "secondary" : "outline"}
                                className="gap-1.5 text-xs"
                                onClick={() => setActiveVideo(isPlaying ? null : lesson.id)}
                              >
                                <PlayCircle className="h-3.5 w-3.5" />
                                {isPlaying ? "Fechar" : "Assistir"}
                              </Button>
                            </div>
                            {isPlaying && lesson.hls_url && (
                              <VideoPlayer
                                url={lesson.hls_url}
                                onClose={() => setActiveVideo(null)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}

            {/* Módulo 5 — Bônus (bloqueado) */}
            <div className="border border-border rounded-xl overflow-hidden shadow-soft bg-card opacity-60">
              <div className="px-4 py-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-body text-sm font-bold">
                  5
                </span>
                <div className="flex-1">
                  <p className="font-display text-base font-semibold text-foreground">
                    Aulas bônus e atualizações
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-body text-xs text-muted-foreground">
                      Em breve — novos conteúdos chegando! 🌸
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Accordion>
        )}

        {/* Footer */}
        <div className="pt-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground font-body">
            © Nutricionista Laiane Paula · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Conteudo;
