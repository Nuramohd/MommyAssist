import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Navigation from "@/components/navigation";
import { Users, Heart, MessageCircle, Plus, User, Send } from "lucide-react";
import type { CommunityPost, CommunityComment } from "@shared/schema";

export default function Community() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch community posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/community/posts"],
    enabled: isAuthenticated,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  // Fetch comments for selected post
  const { data: comments } = useQuery({
    queryKey: ["/api/community/posts", selectedPost, "comments"],
    enabled: !!selectedPost,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: {
      title?: string;
      content: string;
      category?: string;
    }) => {
      const response = await apiRequest("POST", "/api/community/posts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setIsPostDialogOpen(false);
      toast({
        title: "Success",
        description: "Post shared successfully!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("POST", `/api/community/posts/${postId}/like`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await apiRequest("POST", `/api/community/posts/${postId}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", selectedPost, "comments"] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const postData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
    };

    createPostMutation.mutate(postData);
  };

  const handleAddComment = (postId: string) => {
    if (newComment.trim()) {
      createCommentMutation.mutate({ postId, content: newComment });
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return postDate.toLocaleDateString();
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="bg-card shadow-sm p-4">
        <h1 className="text-xl font-semibold text-foreground flex items-center space-x-2">
          <Users className="w-6 h-6 text-secondary" />
          <span>Community</span>
        </h1>
        <p className="text-sm text-muted-foreground">Connect with other mothers</p>
      </header>

      {/* Main Content */}
      <main className="pb-20 px-4 space-y-6">
        {/* Share New Post */}
        <section className="mt-6">
          <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" data-testid="button-new-post">
                <Plus className="w-4 h-4 mr-2" />
                Share Your Experience
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share with Community</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="What would you like to share?"
                    data-testid="input-post-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Your Message</Label>
                  <Textarea 
                    id="content" 
                    name="content" 
                    required
                    placeholder="Share your thoughts, questions, or experiences..."
                    rows={4}
                    data-testid="textarea-post-content"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category">
                    <SelectTrigger data-testid="select-post-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Discussion</SelectItem>
                      <SelectItem value="pregnancy">Pregnancy</SelectItem>
                      <SelectItem value="postpartum">Postpartum</SelectItem>
                      <SelectItem value="childcare">Childcare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPostDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-post"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createPostMutation.isPending}
                    data-testid="button-share-post"
                  >
                    {createPostMutation.isPending ? "Sharing..." : "Share"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </section>

        {/* Community Posts */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Posts</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: any, index: number) => (
                <Card key={post.id} data-testid={`card-post-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-secondary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground" data-testid={`text-post-author-${index}`}>
                            {post.user.firstName || 'Anonymous Mother'}
                          </span>
                          <span className="text-muted-foreground text-sm" data-testid={`text-post-time-${index}`}>
                            {formatTimeAgo(post.createdAt)}
                          </span>
                        </div>
                        
                        {post.title && (
                          <h3 className="font-medium text-foreground mb-1" data-testid={`text-post-title-${index}`}>
                            {post.title}
                          </h3>
                        )}
                        
                        <p className="text-foreground text-sm mb-3" data-testid={`text-post-content-${index}`}>
                          {post.content}
                        </p>
                        
                        {post.category && (
                          <span className="inline-block bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full mb-3">
                            {post.category}
                          </span>
                        )}
                        
                        <div className="flex items-center space-x-4">
                          <button 
                            className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => likePostMutation.mutate(post.id)}
                            disabled={likePostMutation.isPending}
                            data-testid={`button-like-${index}`}
                          >
                            <Heart className="w-4 h-4" />
                            <span data-testid={`text-likes-${index}`}>{post.likes || 0}</span>
                          </button>
                          
                          <button 
                            className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                            data-testid={`button-comments-${index}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span data-testid={`text-comments-count-${index}`}>{post.commentCount || 0}</span>
                          </button>
                        </div>

                        {/* Comments Section */}
                        {selectedPost === post.id && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="space-y-3 mb-4">
                              {comments && comments.length > 0 ? (
                                comments.map((comment: any, commentIndex: number) => (
                                  <div key={comment.id} className="flex items-start space-x-2" data-testid={`comment-${index}-${commentIndex}`}>
                                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-accent" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-medium text-sm" data-testid={`text-comment-author-${index}-${commentIndex}`}>
                                          {comment.user.firstName || 'Anonymous'}
                                        </span>
                                        <span className="text-muted-foreground text-xs" data-testid={`text-comment-time-${index}-${commentIndex}`}>
                                          {formatTimeAgo(comment.createdAt)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-foreground" data-testid={`text-comment-content-${index}-${commentIndex}`}>
                                        {comment.content}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground text-sm text-center" data-testid={`text-no-comments-${index}`}>
                                  No comments yet. Be the first to comment!
                                </p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1"
                                data-testid={`input-comment-${index}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment.trim() || createCommentMutation.isPending}
                                data-testid={`button-send-comment-${index}`}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to the Community!</h3>
                <p className="text-muted-foreground mb-4" data-testid="text-no-posts">
                  No posts yet. Be the first to share your experience and connect with other mothers.
                </p>
                <Button 
                  onClick={() => setIsPostDialogOpen(true)}
                  data-testid="button-first-post"
                >
                  Share Your First Post
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Community Guidelines */}
        <section>
          <Card className="bg-accent/10">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                <Heart className="w-4 h-4 text-accent" />
                <span>Community Guidelines</span>
              </h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Be kind and supportive to fellow mothers</p>
                <p>• Share experiences, not medical advice</p>
                <p>• Respect privacy and confidentiality</p>
                <p>• Report inappropriate content</p>
                <p>• Celebrate each other's journeys</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
}
