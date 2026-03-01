import { Heart, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommunityPostProps {
  author: string;
  anonymous?: boolean;
  category: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  liked?: boolean;
  onLike?: () => void;
}

const categoryColors: Record<string, string> = {
  "Tentativas": "bg-phase-follicular/15 text-phase-follicular",
  "Sintomas": "bg-phase-ovulatory/15 text-phase-ovulatory",
  "FIV": "bg-primary/10 text-primary",
  "Dúvidas": "bg-phase-luteal/15 text-phase-luteal",
  "Vitórias": "bg-fertile-pink/20 text-secondary",
  "Emocional": "bg-phase-menstrual/10 text-phase-menstrual",
  "Meu Positivo": "bg-secondary/15 text-secondary",
};

const CommunityPost = ({
  author,
  anonymous,
  category,
  content,
  likes,
  comments,
  time,
  liked,
  onLike,
}: CommunityPostProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
            {anonymous ? "?" : author[0]}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground font-body">
              {anonymous ? "Anônima" : author}
            </p>
            <p className="text-[11px] text-muted-foreground">{time}</p>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[category] || "bg-muted text-muted-foreground"}`}>
          {category}
        </span>
      </div>
      <p className="mb-3 text-sm leading-relaxed text-foreground/90 font-body">{content}</p>
      <div className="flex items-center gap-4 border-t border-border pt-2">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            liked ? "text-secondary" : "text-muted-foreground hover:text-secondary"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likes}
        </button>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
          <MessageCircle className="h-4 w-4" />
          {comments}
        </button>
      </div>
    </div>
  );
};

export default CommunityPost;
