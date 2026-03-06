import { useState } from "react";
import { Heart, MessageCircle, MoreVertical, Send, Shield, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Comment {
  id: string;
  user_id: string;
  author_name: string;
  anonymous: boolean;
  content: string;
  created_at: string;
}

interface CommunityPostProps {
  id: string;
  author: string;
  anonymous?: boolean;
  category: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  liked?: boolean;
  user_id: string;
  isOwner?: boolean;
  onLike?: () => void;
  onDelete?: () => void;
}

const categoryColors: Record<string, string> = {
  Tentativas: "bg-phase-follicular/15 text-phase-follicular",
  Sintomas: "bg-phase-ovulatory/15 text-phase-ovulatory",
  FIV: "bg-primary/10 text-primary",
  Dúvidas: "bg-phase-luteal/15 text-phase-luteal",
  Vitórias: "bg-fertile-pink/20 text-secondary",
  Emocional: "bg-phase-menstrual/10 text-phase-menstrual",
  "Meu Positivo": "bg-secondary/15 text-secondary",
};

const CommunityPost = ({
  id,
  author,
  anonymous,
  category,
  content,
  likes,
  comments: commentCount,
  time,
  liked,
  user_id: postUserId,
  isOwner: viewerIsOwner,
  onLike,
  onDelete,
}: CommunityPostProps) => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id;
  const isOwnPost = currentUserId === postUserId;
  const canModerate = viewerIsOwner && !isOwnPost;

  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "post" | "comment";
    id: string;
    reason?: string;
  } | null>(null);

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("id, user_id, author_name, anonymous, content, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setCommentsList((data as Comment[]) || []);
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !currentUserId) return;
    setSending(true);
    const authorName = profile?.name || "Usuária";
    const { error } = await supabase.from("comments").insert({
      user_id: currentUserId,
      post_id: id,
      content: newComment.trim(),
      author_name: authorName,
      anonymous: false,
    });
    if (error) {
      toast.error("Erro ao enviar comentário.");
    } else {
      setNewComment("");
      setLocalCommentCount((c) => c + 1);
      fetchComments();
    }
    setSending(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !currentUserId) return;

    if (deleteTarget.type === "post") {
      // Delete post reactions, comments, then post
      await supabase.from("reactions").delete().eq("post_id", id);
      await supabase.from("comments").delete().eq("post_id", id);
      const { error } = await supabase.from("community_posts").delete().eq("id", id);
      if (error) {
        toast.error("Erro ao excluir post.");
      } else {
        if (deleteTarget.reason) {
          await supabase.from("moderation_log").insert({
            moderator_id: currentUserId,
            content_type: "post",
            content_id: id,
            reason: deleteTarget.reason,
          });
        }
        toast.success("Post excluído.");
        onDelete?.();
      }
    } else {
      const { error } = await supabase.from("comments").delete().eq("id", deleteTarget.id);
      if (error) {
        toast.error("Erro ao excluir comentário.");
      } else {
        if (deleteTarget.reason) {
          await supabase.from("moderation_log").insert({
            moderator_id: currentUserId,
            content_type: "comment",
            content_id: deleteTarget.id,
            reason: deleteTarget.reason,
          });
        }
        setLocalCommentCount((c) => Math.max(0, c - 1));
        setCommentsList((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        toast.success("Comentário excluído.");
      }
    }
    setDeleteTarget(null);
  };

  const showMenu = isOwnPost || viewerIsOwner;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft animate-fade-in">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
              {anonymous ? "?" : author[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground font-body">
                  {anonymous ? "Anônima" : author}
                </p>
                {/* Show moderator badge if the post author is an owner — we check postUserId vs viewer, but we can't know if post author is owner. So we show badge for the viewer if they are owner and it's their post */}
              </div>
              <p className="text-[11px] text-muted-foreground">{time}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                categoryColors[category] || "bg-muted text-muted-foreground"
              }`}
            >
              {category}
            </span>
            {showMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  {isOwnPost && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteTarget({ type: "post", id })}
                    >
                      Excluir post
                    </DropdownMenuItem>
                  )}
                  {canModerate && (
                    <>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget({ type: "post", id, reason: "Removido pelo moderador" })}
                      >
                        <Shield className="mr-2 h-3.5 w-3.5" />
                        Excluir post
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          setDeleteTarget({ type: "post", id, reason: "Violação de privacidade" })
                        }
                      >
                        Excluir — violação de privacidade
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          setDeleteTarget({ type: "post", id, reason: "Conteúdo inadequado" })
                        }
                      >
                        Excluir — conteúdo inadequado
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="mb-3 text-sm leading-relaxed text-foreground/90 font-body">{content}</p>

        {/* Actions */}
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
          <button
            onClick={toggleComments}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              showComments ? "text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            <MessageCircle className={`h-4 w-4 ${showComments ? "fill-primary/20" : ""}`} />
            {localCommentCount}
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 space-y-3 border-t border-border pt-3 animate-fade-in">
            {loadingComments ? (
              <p className="text-xs text-muted-foreground font-body text-center py-2">
                Carregando...
              </p>
            ) : commentsList.length === 0 ? (
              <p className="text-xs text-muted-foreground font-body text-center py-2">
                Nenhum comentário ainda. Seja a primeira! 🌸
              </p>
            ) : (
              commentsList.map((c) => {
                const isOwnComment = currentUserId === c.user_id;
                const canModerateComment = viewerIsOwner && !isOwnComment;
                const showCommentMenu = isOwnComment || canModerateComment;

                return (
                  <div key={c.id} className="flex gap-2 group">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted font-body text-[10px] font-semibold text-muted-foreground">
                      {c.anonymous ? "?" : c.author_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground font-body">
                          {c.anonymous ? "Anônima" : c.author_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </span>
                        {showCommentMenu && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="ml-auto rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                                <MoreVertical className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px]">
                              {isOwnComment && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget({ type: "comment", id: c.id })}
                                >
                                  Excluir comentário
                                </DropdownMenuItem>
                              )}
                              {canModerateComment && (
                                <>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "comment",
                                        id: c.id,
                                        reason: "Removido pelo moderador",
                                      })
                                    }
                                  >
                                    <Shield className="mr-2 h-3.5 w-3.5" />
                                    Excluir comentário
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "comment",
                                        id: c.id,
                                        reason: "Violação de privacidade",
                                      })
                                    }
                                  >
                                    Excluir — violação de privacidade
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        type: "comment",
                                        id: c.id,
                                        reason: "Conteúdo inadequado",
                                      })
                                    }
                                  >
                                    Excluir — conteúdo inadequado
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      <p className="text-xs text-foreground/80 font-body">{c.content}</p>
                    </div>
                  </div>
                );
              })
            )}

            {/* New comment input */}
            <div className="flex gap-2 items-end">
              <Textarea
                placeholder="Escreva um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[36px] h-9 py-2 text-xs font-body resize-none flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <Button
                size="sm"
                className="h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSendComment}
                disabled={sending || !newComment.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Tem certeza que deseja excluir{" "}
              {deleteTarget?.type === "post" ? "esta mensagem" : "este comentário"}? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CommunityPost;
