import { useState } from "react";
import { Heart, MessageCircle, MoreVertical, Send, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  content: string;
  author_name: string;
  anonymous: boolean;
  user_id: string;
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
  onLike?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
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
  id,
  author,
  anonymous,
  category,
  content,
  likes,
  comments: initialCommentCount,
  time,
  liked,
  user_id,
  onLike,
  onDelete,
  isOwner = false,
}: CommunityPostProps) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [moderationReason, setModerationReason] = useState<string | null>(null);

  const isOwnPost = user?.id === user_id;
  const canModerate = isOwner;
  const showMenu = isOwnPost || canModerate;

  const fetchComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    if (data) setCommentsList(data as Comment[]);
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !user) return;
    setSendingComment(true);
    const { error } = await supabase.from("comments").insert({
      post_id: id,
      user_id: user.id,
      content: newComment.trim(),
      author_name: "Usuária",
      anonymous: false,
    });
    if (error) {
      toast.error("Erro ao comentar.");
    } else {
      setNewComment("");
      setCommentCount((c) => c + 1);
      fetchComments();
    }
    setSendingComment(false);
  };

  const handleDeletePost = async (reason?: string) => {
    if (!user) return;
    if (reason && canModerate) {
      await supabase.from("moderation_log").insert({
        moderator_id: user.id,
        content_type: "post",
        content_id: id,
        reason,
      });
    }
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir post.");
    } else {
      toast.success("Post excluído.");
      onDelete?.();
    }
    setDeleteDialogOpen(false);
    setModerationReason(null);
  };

  const handleDeleteComment = async (commentId: string, reason?: string) => {
    if (!user) return;
    if (reason && canModerate) {
      await supabase.from("moderation_log").insert({
        moderator_id: user.id,
        content_type: "comment",
        content_id: commentId,
        reason,
      });
    }
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) {
      toast.error("Erro ao excluir comentário.");
    } else {
      toast.success("Comentário excluído.");
      setCommentCount((c) => Math.max(0, c - 1));
      setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
    }
    setDeleteCommentId(null);
    setModerationReason(null);
  };

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
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${categoryColors[category] || "bg-muted text-muted-foreground"}`}>
            {category}
          </span>
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card">
                {isOwnPost && (
                  <DropdownMenuItem
                    onClick={() => { setModerationReason(null); setDeleteDialogOpen(true); }}
                    className="text-destructive focus:text-destructive"
                  >
                    Excluir post
                  </DropdownMenuItem>
                )}
                {canModerate && !isOwnPost && (
                  <>
                    <DropdownMenuItem
                      onClick={() => { setModerationReason("Excluído pelo moderador"); setDeleteDialogOpen(true); }}
                      className="text-destructive focus:text-destructive"
                    >
                      Excluir post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => { setModerationReason("Violação de privacidade"); setDeleteDialogOpen(true); }}
                      className="text-destructive focus:text-destructive"
                    >
                      Excluir — violação de privacidade
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => { setModerationReason("Conteúdo inadequado"); setDeleteDialogOpen(true); }}
                      className="text-destructive focus:text-destructive"
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

      <p className="mb-3 text-sm leading-relaxed text-foreground/90 font-body">{content}</p>

      <div className="flex items-center gap-4 border-t border-border pt-2">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? "text-secondary" : "text-muted-foreground hover:text-secondary"}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {likes}
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {commentCount}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 border-t border-border pt-3 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-muted-foreground font-body text-center py-2">Carregando...</p>
          ) : commentsList.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body text-center py-2">Nenhum comentário ainda.</p>
          ) : (
            commentsList.map((comment) => {
              const isOwnComment = user?.id === comment.user_id;
              const showCommentMenu = isOwnComment || canModerate;

              return (
                <div key={comment.id} className="flex gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary font-display">
                    {comment.anonymous ? "?" : comment.author_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground font-body">
                        {comment.anonymous ? "Anônima" : comment.author_name}
                      </p>
                      {showCommentMenu && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground p-0.5">
                              <MoreVertical className="h-3 w-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            {isOwnComment && (
                              <DropdownMenuItem
                                onClick={() => { setModerationReason(null); setDeleteCommentId(comment.id); }}
                                className="text-destructive focus:text-destructive text-xs"
                              >
                                Excluir comentário
                              </DropdownMenuItem>
                            )}
                            {canModerate && !isOwnComment && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => { setModerationReason("Excluído pelo moderador"); setDeleteCommentId(comment.id); }}
                                  className="text-destructive focus:text-destructive text-xs"
                                >
                                  Excluir comentário
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setModerationReason("Violação de privacidade"); setDeleteCommentId(comment.id); }}
                                  className="text-destructive focus:text-destructive text-xs"
                                >
                                  Excluir — violação de privacidade
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setModerationReason("Conteúdo inadequado"); setDeleteCommentId(comment.id); }}
                                  className="text-destructive focus:text-destructive text-xs"
                                >
                                  Excluir — conteúdo inadequado
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <p className="text-xs text-foreground/80 font-body">{comment.content}</p>
                  </div>
                </div>
              );
            })
          )}

          {/* New comment input */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="font-body text-xs h-8"
              onKeyDown={(e) => e.key === "Enter" && handleSendComment()}
            />
            <Button
              size="sm"
              className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSendComment}
              disabled={sendingComment || !newComment.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Post Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Excluir post</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
              onClick={() => handleDeletePost(moderationReason || undefined)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Dialog */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Excluir comentário</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Tem certeza que deseja excluir esta mensagem? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-body"
              onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId, moderationReason || undefined)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommunityPost;
