import { useState } from "react";
import { Plus, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommunityPost from "@/components/CommunityPost";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const categories = ["Todas", "Tentativas", "Sintomas", "FIV", "Dúvidas", "Vitórias", "Emocional", "Meu Positivo"];

const mockPosts = [
  {
    id: 1, author: "Carolina", anonymous: false, category: "Vitórias",
    content: "Meninas, hoje recebi meu beta positivo depois de 2 anos tentando! Nunca desistam! 💕",
    likes: 42, comments: 18, time: "2h atrás", liked: true,
  },
  {
    id: 2, author: "Anônima", anonymous: true, category: "Emocional",
    content: "Hoje foi um dia difícil. O resultado negativo dói muito, mas vou continuar tentando. Obrigada por esse espaço seguro.",
    likes: 28, comments: 12, time: "4h atrás", liked: false,
  },
  {
    id: 3, author: "Fernanda", anonymous: false, category: "FIV",
    content: "Alguém mais na fase de estimulação? Compartilhem como estão se sentindo!",
    likes: 15, comments: 8, time: "6h atrás", liked: false,
  },
  {
    id: 4, author: "Juliana", anonymous: false, category: "Tentativas",
    content: "Comecei a seguir o protocolo de suplementação e estou me sentindo com mais energia. Alguém notou diferença também?",
    likes: 20, comments: 5, time: "8h atrás", liked: false,
  },
  {
    id: 5, author: "Patrícia", anonymous: false, category: "Meu Positivo",
    content: "MEU BETA DEU POSITIVO! 🤰 Depois de 3 ciclos de FIV, finalmente! Esse programa mudou minha vida!",
    likes: 67, comments: 34, time: "1d atrás", liked: true,
  },
];

const Community = () => {
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [posts, setPosts] = useState(mockPosts);
  const [newPost, setNewPost] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [newCategory, setNewCategory] = useState("Dúvidas");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredPosts = activeCategory === "Todas" ? posts : posts.filter((p) => p.category === activeCategory);

  const handleLike = (id: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post = {
      id: Date.now(),
      author: isAnonymous ? "Anônima" : "Maria",
      anonymous: isAnonymous,
      category: newCategory,
      content: newPost,
      likes: 0,
      comments: 0,
      time: "agora",
      liked: false,
    };
    setPosts([post, ...posts]);
    setNewPost("");
    setDialogOpen(false);
    toast.success("Post publicado! 🌸");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b border-border bg-card px-5 pt-12 pb-4">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-2xl font-semibold text-foreground">Comunidade</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Espaço seguro e acolhedor</p>

          {/* Categories */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-body font-semibold transition-all ${
                  activeCategory === cat
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {cat === "Meu Positivo" && <Heart className="mr-1 inline h-3 w-3" />}
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-5 pt-4">
        {/* New Post CTA */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-card" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Escreva uma dúvida ou relato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Novo Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Category Select */}
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => c !== "Todas").map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewCategory(cat)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-body font-semibold transition-all ${
                      newCategory === cat
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Compartilhe sua experiência, dúvida ou conquista..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px] font-body"
              />
              <div className="flex items-center gap-2">
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <Label className="text-sm font-body text-muted-foreground">Postar anonimamente</Label>
              </div>
              <Button onClick={handlePost} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Publicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Posts */}
        {filteredPosts.map((post) => (
          <CommunityPost key={post.id} {...post} onLike={() => handleLike(post.id)} />
        ))}
      </div>
    </div>
  );
};

export default Community;
