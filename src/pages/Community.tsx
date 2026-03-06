import { useState, useEffect } from "react";
import { Plus, Heart } from "lucide-react";
import logoFertile from "@/assets/logo-fertile.png";
import { Button } from "@/components/ui/button";
import CommunityPost from "@/components/CommunityPost";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = ["Todas", "Tentativas", "Sintomas", "FIV", "Dúvidas", "Vitórias", "Emocional", "Meu Positivo"];

interface Post {
  id: string;
  author: string;
  anonymous: boolean;
  category: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  liked: boolean;
  user_id: string;
}

const Community = () => {
  const { user, profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [newCategory, setNewCategory] = useState("Dúvidas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!user) return;
    const { data: postsData } = await supabase.from("community_posts").select("*").order("created_at", { ascending: false });
    if (!postsData) return;

    const postIds = postsData.map((p) => p.id);
    const { data: reactionsData } = await supabase.from("reactions").select("post_id, user_id").in("post_id", postIds.length ? postIds : ["none"]);
    const { data: commentsData } = await supabase.from("comments").select("post_id").in("post_id", postIds.length ? postIds : ["none"]);

    const mapped: Post[] = postsData.map((p) => {
      const postReactions = reactionsData?.filter((r) => r.post_id === p.id) || [];
      const postComments = commentsData?.filter((c) => c.post_id === p.id) || [];
      const timeDiff = Date.now() - new Date(p.created_at).getTime();
      const hours = Math.floor(timeDiff / 3600000);
      const timeStr = hours < 1 ? "agora" : hours < 24 ? `${hours}h atrás` : `${Math.floor(hours / 24)}d atrás`;

      return {
        id: p.id,
        author: p.anonymous ? "Anônima" : p.author_name,
        anonymous: p.anonymous,
        category: p.category,
        content: p.content,
        likes: postReactions.length,
        comments: postComments.length,
        time: timeStr,
        liked: postReactions.some((r) => r.user_id === user.id),
        user_id: p.user_id
      };
    });
    setPosts(mapped);
    setLoading(false);
  };

  useEffect(() => {fetchPosts();}, [user]);

  // Realtime subscriptions for instant updates
  useEffect(() => {
    const postsChannel = supabase
      .channel('community-posts-changes')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'community_posts' }, (payload) => {
        setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
      })
      .subscribe();

    const commentsChannel = supabase
      .channel('community-comments-changes')
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, (payload) => {
        // Update comment count for the affected post
        if (payload.old.post_id) {
          setPosts((prev) => prev.map((p) => p.id === payload.old.post_id ? { ...p, comments: Math.max(0, p.comments - 1) } : p));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const filteredPosts = activeCategory === "Todas" ? posts : posts.filter((p) => p.category === activeCategory);

  const handleLike = async (id: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === id);
    if (!post) return;

    if (post.liked) {
      await supabase.from("reactions").delete().eq("user_id", user.id).eq("post_id", id);
    } else {
      await supabase.from("reactions").insert({ user_id: user.id, post_id: id });
    }
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    const authorName = isAnonymous ? "Anônima" : profile?.name || "Usuária";
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      author_name: authorName,
      anonymous: isAnonymous,
      category: newCategory,
      content: newPost
    });
    if (error) {toast.error("Erro ao publicar.");return;}
    setNewPost("");
    setDialogOpen(false);
    toast.success("Post publicado! 🌸");
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-background px-5 pt-12 pb-4">
        <div className="mx-auto max-w-lg text-center">
          <img alt="Programa FÉRTILE" className="mx-auto mb-4 h-10 object-contain" src="/lovable-uploads/9fc0e6b8-64d9-4398-996f-ccdd9dc83da9.png" />
          <h1 className="font-display text-2xl font-semibold text-foreground">Comunidade</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">Espaço seguro e acolhedor</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) =>
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-body font-semibold transition-all ${activeCategory === cat ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                {cat === "Meu Positivo" && <Heart className="mr-1 inline h-3 w-3" />}{cat}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-5 pt-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-card" size="lg">
              <Plus className="mr-2 h-5 w-5" />Escreva uma dúvida ou relato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md bg-card">
            <DialogHeader><DialogTitle className="font-display text-xl">Novo Post</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {categories.filter((c) => c !== "Todas").map((cat) =>
                <button key={cat} onClick={() => setNewCategory(cat)} className={`rounded-full border px-2.5 py-1 text-[11px] font-body font-semibold transition-all ${newCategory === cat ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{cat}</button>
                )}
              </div>
              <Textarea placeholder="Compartilhe sua experiência, dúvida ou conquista..." value={newPost} onChange={(e) => setNewPost(e.target.value)} className="min-h-[100px] font-body" />
              <div className="flex items-center gap-2">
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <Label className="text-sm font-body text-muted-foreground">Postar anonimamente</Label>
              </div>
              <Button onClick={handlePost} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Publicar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ?
        <p className="text-center text-sm text-muted-foreground font-body py-8">Carregando...</p> :
        filteredPosts.length === 0 ?
        <p className="text-center text-sm text-muted-foreground font-body py-8">Nenhum post ainda. Seja a primeira! 🌸</p> :

        filteredPosts.map((post) =>
        <CommunityPost
          key={post.id}
          {...post}
          isOwner={profile?.is_owner || false}
          onLike={() => handleLike(post.id)}
          onDelete={() => handlePostDeleted(post.id)} />

        )
        }

        <div className="py-4 text-center">
          <p className="text-xs text-muted-foreground font-body">© Nutricionista Laiane Paula · Todos os direitos reservados</p>
        </div>
      </div>
    </div>);

};

export default Community;