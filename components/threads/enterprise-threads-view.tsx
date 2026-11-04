"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Heart,
  Share2,
  Sparkles,
  Send,
  Hash,
  Users,
  Building2,
  Layers,
  ChevronDown,
  ChevronUp,
  Bookmark,
  CheckCircle2,
  Flame,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { useModal } from "@/hooks/use-modal-store";
import { sounds } from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface ThreadReply {
  id: string;
  author: {
    id: string;
    name: string;
    imageUrl: string;
  };
  body: string;
  depth: number;
  createdAt: string;
}

interface ThreadPost {
  id: string;
  author: {
    id: string;
    name: string;
    imageUrl: string;
    role: string;
  };
  audience: string;
  postType: string;
  body: string;
  likesCount: number;
  repliesCount: number;
  topics: string[];
  hasLiked: boolean;
  replies: ThreadReply[];
  createdAt: string;
}

export function EnterpriseThreadsView() {
  const [posts, setPosts] = useState<ThreadPost[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedAudience, setSelectedAudience] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Composer
  const [newPostBody, setNewPostBody] = useState("");
  const [newPostAudience, setNewPostAudience] = useState("COMPANY");
  const [newPostTopic, setNewPostTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  // Active reply drawers
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({});
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  const { onOpen } = useModal();

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTopic !== "all") params.set("topic", selectedTopic);
      if (selectedAudience !== "ALL") params.set("audience", selectedAudience);

      const res = await fetch(`/api/threads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTopics(data.topics || []);
      }
    } catch (e) {
      console.error("Fetch threads error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [selectedTopic, selectedAudience]);

  const handleToggleLike = async (postId: string) => {
    sounds.playPop();
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    try {
      await fetch(`/api/threads/${postId}/reactions`, {
        method: "POST",
      });
    } catch (e) {
      console.error("Like error:", e);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostBody.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      sounds.playJoinVoice();
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newPostBody,
          audience: newPostAudience,
          topicSlug: newPostTopic,
        }),
      });

      if (res.ok) {
        setNewPostBody("");
        setNewPostTopic("");
        setShowAiSuggestions(false);
        await fetchThreads();
      }
    } catch (e) {
      console.error("Create thread error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (postId: string) => {
    const text = replyInput[postId]?.trim();
    if (!text || submittingReply[postId]) return;

    try {
      setSubmittingReply((prev) => ({ ...prev, [postId]: true }));
      sounds.playPop();

      const res = await fetch(`/api/threads/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text, depth: 0 }),
      });

      if (res.ok) {
        const newReply: ThreadReply = await res.json();
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                repliesCount: p.repliesCount + 1,
                replies: [...p.replies, newReply],
              };
            }
            return p;
          })
        );
        setReplyInput((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (e) {
      console.error("Reply error:", e);
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const toggleRepliesView = (postId: string) => {
    setOpenReplies((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.body.toLowerCase().includes(q) ||
      p.author.name.toLowerCase().includes(q) ||
      p.topics.some((t) => t.toLowerCase().includes(q))
    );
  });

  const aiTemplates = [
    "Chia sẻ kinh nghiệm: Để tối ưu hóa độ trễ cuộc họp trực tuyến, nhóm đã áp dụng bộ mã hóa Opus và giới hạn bitrate thích ứng.",
    "Báo cáo tiến độ: Tuần này tổ chúng ta đã hoàn thành 100% mục tiêu kiểm thử E2EE và bàn giao đúng hạn theo tiêu chuẩn SOP.",
    "Hỏi đáp kỹ thuật: Ai có kinh nghiệm xử lý deadlock khi scale database đa luồng trên cụm Cloud, cho mình xin tài liệu tham khảo với nhé!",
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-200">
      {/* 1. Header Banner & Analytics Overview */}
      <div className="relative rounded-3xl bg-gradient-to-r from-violet-950/60 via-[#1e1f22] to-indigo-950/40 border border-violet-500/30 p-5 md:p-6 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span>Enterprise Threads V3 · Kaggle Dataset Repaired</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Mạng Xã Hội & Sáng Kiến Nội Bộ (Threads)
            </h2>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Không gian chia sẻ kinh nghiệm, thảo luận kỹ thuật, sáng kiến cải tiến và giải đáp chuyên môn giữa các tổ ban theo mô hình Meta Threads Doanh Nghiệp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-black text-white">{posts.length}</div>
              <div className="text-[11px] text-zinc-400 font-medium">Chủ đề thảo luận</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Topic & Audience Filter Bar */}
      <div className="bg-[#1e1f22] p-4 rounded-2xl border border-zinc-800/80 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Audience Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#2b2d31] p-1 rounded-xl border border-white/5 w-fit">
            <button
              type="button"
              onClick={() => setSelectedAudience("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                selectedAudience === "ALL"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tất cả Feed</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedAudience("COMPANY")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                selectedAudience === "COMPANY"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Toàn công ty</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedAudience("TEAM")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
                selectedAudience === "TEAM"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Theo tổ</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung bài viết, hashtag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Topics Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedTopic("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer border",
              selectedTopic === "all"
                ? "bg-white text-zinc-950 border-white shadow"
                : "bg-[#2b2d31] text-zinc-300 border-zinc-700/60 hover:border-zinc-500"
            )}
          >
            # Tất cả chủ đề
          </button>
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTopic(t.slug)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer border",
                selectedTopic === t.slug
                  ? "bg-violet-600 text-white border-violet-500 shadow"
                  : "bg-[#2b2d31] text-zinc-300 border-zinc-700/60 hover:border-zinc-500"
              )}
            >
              #{t.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. New Thread Composer with AI Draft Assist (FR-16-07) */}
      <div className="bg-[#1e1f22] border border-violet-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-600/20 text-violet-400">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Khởi tạo bài viết Threads mới
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAiSuggestions(!showAiSuggestions)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Gợi Ý Soạn Thảo (FR-16-07)</span>
          </button>
        </div>

        {/* AI Templates Dropdown */}
        {showAiSuggestions && (
          <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/20 space-y-2 animate-in fade-in-50">
            <span className="text-[11px] font-bold text-violet-300 block">
              💡 Nhấp vào mẫu bài viết do AI gợi ý từ dữ liệu Kaggle:
            </span>
            <div className="space-y-1.5">
              {aiTemplates.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNewPostBody(t)}
                  className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-violet-900/40 text-xs text-zinc-200 transition border border-white/5"
                >
                  &ldquo;{t}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            rows={3}
            value={newPostBody}
            onChange={(e) => setNewPostBody(e.target.value)}
            placeholder="Bạn muốn chia sẻ điều gì với đồng nghiệp hôm nay? Có thể thêm #CongNghe, #KinhDoanh, #CaiTien..."
            className="w-full p-3 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-violet-500 resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <select
                value={newPostAudience}
                onChange={(e) => setNewPostAudience(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#2b2d31] border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="COMPANY">Phạm vi: Toàn công ty</option>
                <option value="TEAM">Phạm vi: Tổ của tôi</option>
              </select>

              <select
                value={newPostTopic}
                onChange={(e) => setNewPostTopic(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-[#2b2d31] border border-zinc-700 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="">Gắn chủ đề (Topic)...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.slug}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!newPostBody.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Đang đăng..." : "Đăng Threads"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Threads Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-zinc-400 text-xs">
            Đang nạp bài viết Threads từ cơ sở dữ liệu...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-[#1e1f22] rounded-2xl border border-zinc-800 text-zinc-400 text-xs space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto text-zinc-600" />
            <p>Không có bài viết Threads nào khớp với bộ lọc.</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isRepliesOpen = openReplies[post.id];

            return (
              <div
                key={post.id}
                className="bg-[#1e1f22] rounded-2xl border border-zinc-800/90 hover:border-zinc-700/80 transition-all p-4 md:p-5 shadow-lg space-y-3.5"
              >
                {/* Author Info & Audience Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() =>
                        onOpen("userProfile", {
                          member: {
                            id: post.author.id,
                            role: "MEMBER",
                            profile: {
                              name: post.author.name,
                              imageUrl: post.author.imageUrl,
                              email: "dongnghiep@congty.com",
                            },
                          } as any,
                        })
                      }
                      className="cursor-pointer"
                    >
                      <UserAvatar
                        src={post.author.imageUrl}
                        className="h-9 w-9 ring-2 ring-violet-500/40"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white hover:underline cursor-pointer flex items-center gap-1.5">
                        <span>{post.author.name}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">
                          · {post.author.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        post.audience === "COMPANY"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}
                    >
                      {post.audience === "COMPANY" ? "🏢 Toàn công ty" : "👥 Theo tổ"}
                    </span>
                  </div>
                </div>

                {/* Post Body */}
                <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap pl-12">
                  {post.body}
                </div>

                {/* Topics Tag List */}
                {post.topics && post.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-12">
                    {post.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Like, Comment, Share */}
                <div className="flex items-center gap-4 pl-12 pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer",
                      post.hasLiked ? "text-rose-500" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <Heart
                      className={cn("h-4 w-4", post.hasLiked && "fill-rose-500")}
                    />
                    <span>{post.likesCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleRepliesView(post.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.repliesCount} phản hồi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      alert("Đã sao chép liên kết bài viết Threads vào bộ nhớ tạm!");
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer ml-auto"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Chia sẻ</span>
                  </button>
                </div>

                {/* Nested Replies Drawer */}
                {isRepliesOpen && (
                  <div className="pl-12 pt-3 space-y-3 animate-in fade-in-50">
                    {/* Replies list */}
                    <div className="space-y-2 border-l-2 border-zinc-800 pl-3">
                      {post.replies.map((r) => (
                        <div
                          key={r.id}
                          className="bg-[#2b2d31]/60 p-2.5 rounded-xl border border-white/5 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                src={r.author.imageUrl}
                                className="h-5 w-5"
                              />
                              <span className="text-[11px] font-bold text-white">
                                {r.author.name}
                              </span>
                            </div>
                            <span className="text-[9px] text-zinc-500">
                              {new Date(r.createdAt).toLocaleDateString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 leading-relaxed pl-7">
                            {r.body}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Reply input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Viết phản hồi thảo luận cho bài viết này..."
                        value={replyInput[post.id] || ""}
                        onChange={(e) =>
                          setReplyInput((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSendReply(post.id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-violet-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(post.id)}
                        disabled={!replyInput[post.id]?.trim()}
                        className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
