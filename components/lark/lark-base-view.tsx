"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  Kanban,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Eye,
  FileText,
  Pin,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  Layers,
  Calendar,
  UserCheck,
  Check,
  Loader2,
  X,
  MessageSquare,
  Shield,
  Briefcase,
  Share2,
  User,
  Flame,
  Lock,
  Image as ImageIcon,
  Bot,
  ArrowLeft,
  LogOut,
  Video,
  Download,
  Smartphone,
  Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/user-profile-card";
import { LeavePortal } from "@/components/hr/leave-portal";
import { EmployeeDirectory } from "@/components/hr/employee-directory";
import { AuditLogsView } from "@/components/hr/audit-logs-view";
import { MyPersonalBase } from "@/components/lark/my-personal-base";
import { EnterpriseThreadsView } from "@/components/threads/enterprise-threads-view";
import { AiHrAdminView } from "@/components/hr/ai-hr-admin-view";
import { PersonalWorkspaceView } from "@/components/personal/personal-workspace-view";

export type ViewMode = "grid" | "kanban";
export type MainTab = "today" | "tasks" | "org" | "me" | "bulletin" | "leave" | "directory" | "audit" | "threads" | "ai-admin";
export type DemoRole = "MEMBER" | "LEAD" | "HEAD" | "HR";

interface LarkBaseViewProps {
  serverId?: string;
  defaultUnitId?: string;
  initialTab?: MainTab;
  hideHeader?: boolean;
}

export function LarkBaseView({
  serverId,
  defaultUnitId = "all",
  initialTab = "tasks",
  hideHeader = false,
}: LarkBaseViewProps) {
  const router = useRouter();

  // Tab & View
  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedUnitId, setSelectedUnitId] = useState<string>(defaultUnitId);
  const [demoRole, setDemoRole] = useState<DemoRole>("LEAD");
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);

  // Sync initialTab if prop changes or URL query param
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    try {
      const sp = new URLSearchParams(window.location.search);
      const tab = sp.get("tab") as MainTab;
      if (tab) {
        setActiveTab(tab);
      }
    } catch (e) {}
  }, [initialTab]);

  const handleTabChange = (newTab: MainTab) => {
    setActiveTab(newTab);
    try {
      const targetServerId =
        serverId ||
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("serverId")
          : "");
      const url = targetServerId
        ? `/base?tab=${newTab}&serverId=${targetServerId}`
        : `/base?tab=${newTab}`;
      window.history.replaceState(null, "", url);
    } catch (e) {}
  };

  useEffect(() => {
    if (defaultUnitId) {
      setSelectedUnitId(defaultUnitId);
    }
  }, [defaultUnitId]);

  // Data states
  const [loading, setLoading] = useState(true);
  const [orgTree, setOrgTree] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  // Modal states
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskOrgId, setNewTaskOrgId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskDeadline, setNewTaskDeadline] = useState("Trong tuần này");
  const [selectedProfileModal, setSelectedProfileModal] = useState<string | null>(null);

  // Bulletin Modal & Reactions states
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Công ty");
  const [newPostImageUrl, setNewPostImageUrl] = useState("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80");
  const [newPostBody, setNewPostBody] = useState("");
  const [newPostIsPinned, setNewPostIsPinned] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Reactions state for bulletin posts
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [userReactions, setUserReactions] = useState<Record<string, Set<string>>>({});

  // Reactions state for task cards
  const [taskReactions, setTaskReactions] = useState<Record<string, Record<string, number>>>({});
  const [userTaskReactions, setUserTaskReactions] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    fetchAllData();
  }, [selectedUnitId, demoRole, onlyOverdue]);

  const fetchAllData = async () => {
    try {
      const [treeRes, tasksRes, postsRes] = await Promise.all([
        fetch("/api/org-units/tree"),
        fetch(`/api/org-units/${selectedUnitId}/tasks?asRole=${demoRole}&onlyOverdue=${onlyOverdue}`),
        fetch("/api/posts"),
      ]);

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        setOrgTree(treeData);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
        setTaskError(null);
      } else if (tasksRes.status === 403) {
        const err = await tasksRes.json();
        setTasks([]);
        setTaskError(err.message || "Bạn không có quyền truy cập vào bảng việc này theo phân quyền Lark Base.");
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error(e);
      fetchAllData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const targetUnit = newTaskOrgId || allTeams[0]?.id;
      const res = await fetch(`/api/org-units/${targetUnit}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          deadlineText: newTaskDeadline,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTasks((prev) => [created, ...prev]);
        setIsCreateTaskOpen(false);
        setNewTaskTitle("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkPostRead = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isRead: true } : p))
    );
    try {
      await fetch(`/api/posts/${postId}/read`, { method: "POST" });
    } catch (e) {}
  };

  const handleToggleReaction = (postId: string, emoji: string, defaultCount: number) => {
    setUserReactions((prev) => {
      const currentSet = new Set(prev[postId] || []);
      if (currentSet.has(emoji)) {
        currentSet.delete(emoji);
      } else {
        currentSet.add(emoji);
      }
      return { ...prev, [postId]: currentSet };
    });

    setReactions((prev) => {
      const postRx = prev[postId] || {};
      const count = postRx[emoji] !== undefined ? postRx[emoji] : defaultCount;
      const hasReacted = userReactions[postId]?.has(emoji);
      return {
        ...prev,
        [postId]: {
          ...postRx,
          [emoji]: hasReacted ? Math.max(0, count - 1) : count + 1,
        },
      };
    });
  };

  const handleToggleTaskReaction = (taskId: string, emoji: string, defaultCount: number) => {
    setUserTaskReactions((prev) => {
      const currentSet = new Set(prev[taskId] || []);
      if (currentSet.has(emoji)) {
        currentSet.delete(emoji);
      } else {
        currentSet.add(emoji);
      }
      return { ...prev, [taskId]: currentSet };
    });

    setTaskReactions((prev) => {
      const tRx = prev[taskId] || {};
      const count = tRx[emoji] !== undefined ? tRx[emoji] : defaultCount;
      const hasReacted = userTaskReactions[taskId]?.has(emoji);
      return {
        ...prev,
        [taskId]: {
          ...tRx,
          [emoji]: hasReacted ? Math.max(0, count - 1) : count + 1,
        },
      };
    });
  };

  const extractPostImageAndText = (rawBody: string) => {
    if (!rawBody) return { imageUrl: null, cleanText: "" };
    const imgRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/;
    const match = rawBody.match(imgRegex);
    const imageUrl = match ? match[1] : null;
    const cleanText = rawBody.replace(imgRegex, "").trim();
    return { imageUrl, cleanText };
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostBody.trim() || isSubmittingPost) return;

    try {
      setIsSubmittingPost(true);
      const fullBody = newPostImageUrl
        ? `![Banner](${newPostImageUrl.trim()})\n\n${newPostBody.trim()}`
        : newPostBody.trim();

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPostTitle.trim(),
          body: fullBody,
          isPinned: newPostIsPinned,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setPosts((prev) => [{ ...created, isRead: false }, ...prev]);
        setIsCreatePostOpen(false);
        setNewPostTitle("");
        setNewPostBody("");
      }
    } catch (err) {
      console.error("Create post error:", err);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Flatten teams for selector
  const allTeams = orgTree.flatMap((dept) => dept.children || []);

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assigneeName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchQuery;
  });

  // Kanban Columns
  const columns = [
    { id: "TODO", label: "Cần Làm (To Do)", color: "text-zinc-300", badge: "bg-zinc-800" },
    { id: "IN_PROGRESS", label: "Đang Thực Hiện (In Progress)", color: "text-indigo-400", badge: "bg-indigo-900/30 text-indigo-300" },
    { id: "DONE", label: "Hoàn Thành (Done)", color: "text-emerald-400", badge: "bg-emerald-900/30 text-emerald-300" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-zinc-100 overflow-y-auto select-none">
      {/* Top Header */}
      {!hideHeader && (
        <header className="h-12 px-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#1e1f22]/90 backdrop-blur-md sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Quick exit back to Discord chat */}
            <button
              type="button"
              onClick={() => {
                const targetServerId =
                  serverId ||
                  (typeof window !== "undefined"
                    ? new URLSearchParams(window.location.search).get("serverId")
                    : "");
                router.push(targetServerId ? `/servers/${targetServerId}` : "/");
              }}
              className="h-7 px-2.5 rounded-lg bg-[#2b2d31] hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold border border-white/5"
              title="Quay lại Workspace chính (Discord Chat)"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Về Chat</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/meetings")}
              className="h-7 px-2.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold border border-emerald-500/20"
              title="Đi tới Phòng Họp & Hội Nghị Video"
            >
              <Video className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Phòng họp</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/download")}
              className="h-7 px-2.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold border border-indigo-500/30"
              title="Tải ứng dụng Deku cho Windows và Điện thoại"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden md:inline">Tải ứng dụng</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/test-bot")}
              className="h-7 px-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold border border-purple-500/30"
              title="Khởi chạy Bot tự động full test toàn bộ tính năng demo"
            >
              <Bot className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden lg:inline">Bot Auto-Test</span>
            </button>

            <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block" />

            <div className="h-7 w-7 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">Lark Base Doanh Nghiệp</h1>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.2 rounded font-mono hidden md:inline">
                Bảo mật 3 tầng
              </span>
            </div>
          </div>

          {/* Demo Role Switcher Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#2b2d31] border border-white/5 px-2 py-0.5 rounded-lg text-xs">
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-zinc-400 text-[11px] font-medium">Vai trò:</span>
              <select
                value={demoRole}
                onChange={(e) => setDemoRole(e.target.value as DemoRole)}
                className="bg-black/40 border border-zinc-700 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-amber-300 focus:outline-none cursor-pointer"
              >
                <option value="MEMBER">1. Tổ viên (Member)</option>
                <option value="LEAD">2. Tổ trưởng (Lead)</option>
                <option value="HEAD">3. Trưởng phòng (Head)</option>
                <option value="HR">4. Nhân sự (HR)</option>
              </select>
            </div>
          </div>
        </header>
      )}

      {/* Main Tabs Navigation Bar */}
      <div className="px-5 border-b border-zinc-800/80 bg-[#1e1f22]/40 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => handleTabChange("today")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "today"
                ? "border-emerald-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Hôm nay & AI Trợ lý</span>
          </button>

          <button
            onClick={() => handleTabChange("tasks")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "tasks"
                ? "border-indigo-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Kanban className="h-3.5 w-3.5 text-indigo-400" />
            <span>Bảng việc tổ</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded-full font-mono">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("me")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "me"
                ? "border-sky-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <User className="h-3.5 w-3.5 text-sky-400" />
            <span>Hồ sơ của tôi</span>
          </button>

          <button
            onClick={() => handleTabChange("org")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "org"
                ? "border-emerald-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Cơ cấu tổ chức</span>
          </button>

          <button
            onClick={() => handleTabChange("bulletin")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "bulletin"
                ? "border-amber-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <FileText className="h-3.5 w-3.5 text-amber-400" />
            <span>Bảng tin</span>
            {posts.filter((p) => !p.isRead).length > 0 && (
              <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 rounded-full">
                {posts.filter((p) => !p.isRead).length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange("leave")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "leave"
                ? "border-indigo-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
            <span>Nghỉ phép</span>
          </button>

          <button
            onClick={() => handleTabChange("directory")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "directory"
                ? "border-purple-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Users className="h-3.5 w-3.5 text-purple-400" />
            <span>Danh bạ</span>
          </button>

          <button
            onClick={() => handleTabChange("audit")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "audit"
                ? "border-emerald-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Kiểm toán</span>
          </button>

          <button
            onClick={() => handleTabChange("threads")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "threads"
                ? "border-violet-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Flame className="h-3.5 w-3.5 text-violet-400" />
            <span>Threads Nội Bộ</span>
            <span className="text-[9px] bg-violet-500/20 text-violet-300 font-bold px-1.5 py-0.2 rounded-full border border-violet-500/30">
              V3
            </span>
          </button>

          <button
            onClick={() => handleTabChange("ai-admin")}
            className={cn(
              "h-10 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition shrink-0 rounded-t-md",
              activeTab === "ai-admin"
                ? "border-emerald-500 text-white bg-white/5 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI Quản Trị Nhân Sự</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
              AI-HR
            </span>
          </button>
        </div>

        {/* View mode toggle (Grid vs Kanban) - Only active in Tasks tab */}
        {activeTab === "tasks" && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-[#2b2d31] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition",
                  viewMode === "kanban"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>Kanban</span>
              </button>

              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition",
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Bảng (Grid)</span>
              </button>
            </div>

            {demoRole !== "MEMBER" ? (
              <button
                onClick={() => setIsCreateTaskOpen(true)}
                className="h-9 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Giao việc (Tạo task)</span>
              </button>
            ) : (
              <div className="h-9 px-3 rounded-xl text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Chế độ nhân sự: Xem việc & cập nhật tiến độ</span>
              </div>
            )}
          </div>
        )}

        {/* Action bar for Bulletin tab */}
        {activeTab === "bulletin" && (
          <div className="flex items-center gap-2 shrink-0">
            {demoRole !== "MEMBER" ? (
              <button
                onClick={() => setIsCreatePostOpen(true)}
                className="h-9 px-3.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 transition flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Đăng bản tin (Kèm ảnh)</span>
              </button>
            ) : (
              <div className="h-9 px-3 rounded-xl text-[11px] font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span>Chế độ nhân sự: Xem & thả icon</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 w-full max-w-[1920px] mx-auto space-y-6">
        {/* TAB 1: TASKS BOARD */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1e1f22] p-3.5 rounded-2xl border border-zinc-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-400 font-medium">Lọc theo Tổ:</span>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white focus:outline-none"
                >
                  <option value="all">🏢 Tất cả các tổ ({allTeams.length} tổ)</option>
                  <option value="my_tasks">⭐ Việc của tôi (Được giao cho tôi - M9)</option>
                  {allTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      📁 {team.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setOnlyOverdue(!onlyOverdue)}
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border",
                    onlyOverdue
                      ? "bg-rose-600/30 text-rose-300 border-rose-500/50 shadow-sm"
                      : "bg-[#2b2d31] text-zinc-400 hover:text-white border-zinc-700"
                  )}
                >
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Quá hạn (M3)</span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm công việc, người làm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Lark Base B6 Record-Level Permission Warning */}
            {taskError ? (
              <div className="p-8 rounded-3xl bg-amber-950/40 border border-amber-500/30 text-center max-w-xl mx-auto my-8 space-y-3">
                <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto" />
                <h3 className="text-base font-bold text-amber-200">
                  Phân Quyền Theo Bản Ghi (Lark Base Record-Level Permission - B6)
                </h3>
                <p className="text-xs text-amber-100/90 leading-relaxed">
                  {taskError}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setDemoRole("LEAD")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow"
                  >
                    Chuyển sang vai trò Tổ trưởng (Team Lead) để xem việc
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* View Mode 1: KANBAN BOARD */}
                {viewMode === "kanban" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                    {columns.map((col) => {
                      const colTasks = filteredTasks.filter(
                        (t) =>
                          t.status === col.id ||
                          (col.id === "TODO" && t.status === "OVERDUE")
                      );

                      return (
                        <div
                          key={col.id}
                          className="bg-[#1e1f22] rounded-3xl border border-zinc-800 p-4 space-y-3 shadow-xl min-h-[450px]"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <span className={cn("text-xs font-bold flex items-center gap-2", col.color)}>
                              <span className="h-2 w-2 rounded-full bg-current" />
                              {col.label}
                            </span>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", col.badge)}>
                              {colTasks.length}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {colTasks.length === 0 ? (
                              <div className="py-12 text-center text-xs text-zinc-500">
                                Không có nhiệm vụ nào
                              </div>
                            ) : (
                              colTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="p-4 rounded-2xl bg-[#2b2d31]/70 border border-white/5 hover:border-zinc-600 transition shadow-sm space-y-2.5 group"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition leading-snug">
                                      {task.title}
                                    </h4>
                                    {task.status === "OVERDUE" && (
                                      <span className="text-[10px] font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded shrink-0">
                                        OVERDUE
                                      </span>
                                    )}
                                  </div>

                                  {/* Evidence Text from Meeting if present */}
                                  {task.evidenceText && (
                                    <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-zinc-300 italic flex items-start gap-1.5">
                                      <Sparkles className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                                      <span>{task.evidenceText}</span>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400 border-t border-zinc-800">
                                    <span className="font-semibold text-emerald-400 truncate max-w-[120px]">
                                      {task.orgUnit?.name || "Tổ"}
                                    </span>
                                    <span className="flex items-center gap-1 font-medium">
                                      <Clock className="h-3 w-3 text-amber-400" />
                                      {task.deadlineText || "Tuần này"}
                                    </span>
                                  </div>

                                  {/* Task Quick Reactions (Staff and members can interact) */}
                                  <div className="flex items-center gap-1 pt-1 border-t border-zinc-800/60">
                                    {[
                                      { emoji: "👍", defaultCount: 4 },
                                      { emoji: "🎯", defaultCount: 2 },
                                      { emoji: "🔥", defaultCount: 3 },
                                      { emoji: "✅", defaultCount: 5 },
                                    ].map((rx) => {
                                      const tRx = taskReactions[task.id] || {};
                                      const count = tRx[rx.emoji] !== undefined ? tRx[rx.emoji] : rx.defaultCount;
                                      const hasReacted = userTaskReactions[task.id]?.has(rx.emoji);

                                      return (
                                        <button
                                          key={rx.emoji}
                                          type="button"
                                          onClick={() => handleToggleTaskReaction(task.id, rx.emoji, rx.defaultCount)}
                                          className={cn(
                                            "px-1.5 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 transition border cursor-pointer select-none",
                                            hasReacted
                                              ? "bg-indigo-600/30 border-indigo-500/60 text-indigo-300 shadow-sm"
                                              : "bg-black/30 hover:bg-black/50 border-white/5 text-zinc-400 hover:text-zinc-200"
                                          )}
                                        >
                                          <span>{rx.emoji}</span>
                                          <span className="font-mono text-[9px]">{count}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Task Card Footer Actions */}
                                  <div className="flex items-center justify-between pt-1">
                                    {task.assigneeId ? (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedProfileModal(task.assigneeId)}
                                        className="text-[11px] text-zinc-300 font-semibold bg-black/30 hover:bg-zinc-800 px-2 py-0.5 rounded transition cursor-pointer"
                                      >
                                        👤 {task.assigneeName || task.assignee?.name}
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-zinc-400 bg-black/20 px-2 py-0.5 rounded">
                                        👤 {task.assigneeName || task.assignee?.name || "Chưa gán"}
                                      </span>
                                    )}

                                    <div className="flex items-center gap-1">
                                      {col.id !== "TODO" && (
                                        <button
                                          onClick={() => handleUpdateTaskStatus(task.id, "TODO")}
                                          className="text-[10px] px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                                        >
                                          ← To Do
                                        </button>
                                      )}
                                      {col.id !== "IN_PROGRESS" && (
                                        <button
                                          onClick={() => handleUpdateTaskStatus(task.id, "IN_PROGRESS")}
                                          className="text-[10px] px-2 py-1 rounded bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300"
                                        >
                                          Đang làm
                                        </button>
                                      )}
                                      {col.id !== "DONE" && (
                                        <button
                                          onClick={() => handleUpdateTaskStatus(task.id, "DONE")}
                                          className="text-[10px] px-2 py-1 rounded bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300"
                                        >
                                          Xong ✓
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* View Mode 2: GRID / TABLE VIEW */}
                {viewMode === "grid" && (
                  <div className="bg-[#1e1f22] rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#2b2d31] text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Tên Nhiệm Vụ</th>
                            <th className="py-3 px-4 font-semibold">Tổ Chuyên Môn</th>
                            <th className="py-3 px-4 font-semibold">Người Phụ Trách</th>
                            <th className="py-3 px-4 font-semibold">Thời Hạn</th>
                            <th className="py-3 px-4 font-semibold">Trạng Thái</th>
                            <th className="py-3 px-4 font-semibold">Độ Ưu Tiên</th>
                            <th className="py-3 px-4 font-semibold">Căn Cứ Cuộc Họp (Evidence)</th>
                            <th className="py-3 px-4 font-semibold text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {filteredTasks.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-zinc-500">
                                Không có nhiệm vụ nào
                              </td>
                            </tr>
                          ) : (
                            filteredTasks.map((task) => (
                              <tr key={task.id} className="hover:bg-[#2b2d31]/50 transition">
                                <td className="py-3.5 px-4 font-bold text-white max-w-xs truncate">
                                  {task.title}
                                </td>
                                <td className="py-3.5 px-4 text-emerald-400 font-semibold">
                                  {task.orgUnit?.name || "Tổ"}
                                </td>
                                <td className="py-3.5 px-4">
                                  {task.assigneeId ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedProfileModal(task.assigneeId)}
                                      className="font-medium text-indigo-300 hover:underline cursor-pointer"
                                    >
                                      {task.assigneeName || task.assignee?.name}
                                    </button>
                                  ) : (
                                    <span className="text-zinc-500">
                                      {task.assigneeName || "Chưa gán"}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-zinc-300 font-mono text-[11px]">
                                  {task.deadlineText || "Trong tuần"}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                                      task.status === "DONE"
                                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                                        : task.status === "IN_PROGRESS"
                                        ? "bg-indigo-950/60 text-indigo-300 border border-indigo-500/30"
                                        : task.status === "OVERDUE"
                                        ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                                        : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                                    )}
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {task.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-semibold",
                                      task.priority === "HIGH"
                                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                        : task.priority === "MEDIUM"
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        : "bg-zinc-800 text-zinc-400"
                                    )}
                                  >
                                    {task.priority}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-zinc-400 italic text-[11px] max-w-xs truncate">
                                  {task.evidenceText || "—"}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <select
                                    value={task.status}
                                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                    className="bg-black/50 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                                  >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                  </select>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: ORG STRUCTURE */}
        {activeTab === "org" && (
          <div className="space-y-6">
            <div className="bg-[#1e1f22] p-6 rounded-3xl border border-zinc-800 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  Cơ Cấu Tổ Chức Doanh Nghiệp (Phòng Ban & Tổ Chuyên Môn)
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                Mô hình tổ chức 2 cấp: Trưởng phòng (Head) điều hành các phòng ban; Tổ trưởng (Lead) quản trị tổ nghiệp vụ.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {orgTree.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-5 rounded-2xl bg-[#2b2d31]/60 border border-white/5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-indigo-400" />
                          {dept.name}
                        </h4>
                        <span className="text-[11px] text-zinc-400">
                          {dept.children?.length || 0} tổ chuyên môn trực thuộc
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                        DEPARTMENT
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(dept.children || []).map((team: any) => (
                        <div
                          key={team.id}
                          className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-zinc-200">{team.name}</p>
                            <p className="text-[11px] text-zinc-400">
                              {team.members?.length || 0} nhân sự chính thức
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedUnitId(team.id);
                              setActiveTab("tasks");
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-semibold transition"
                          >
                            Xem việc tổ →
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BULLETIN POSTS */}
        {activeTab === "bulletin" && (
          <div className="space-y-4">
            <div className="bg-[#1e1f22] p-6 rounded-3xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-400" />
                  Cổng Thông Tin & Bảng Tin Nội Bộ Doanh Nghiệp
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Thông báo chính thức từ Ban Lãnh đạo, Phòng Nhân sự & Pháp luật công ty
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {demoRole !== "MEMBER" ? (
                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="h-10 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Đăng thông báo mới (Kèm ảnh)</span>
                  </button>
                ) : (
                  <div className="h-10 px-3.5 rounded-xl text-xs font-medium bg-zinc-800/90 text-zinc-400 border border-zinc-700/60 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-amber-400" />
                    <span>Phân quyền Cán bộ nhân viên: Xem & thả icon</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-500 bg-[#1e1f22] rounded-3xl border border-zinc-800">
                  Chưa có thông báo nào được đăng tải.
                </div>
              ) : (
                posts.map((post) => {
                  const { imageUrl, cleanText } = extractPostImageAndText(post.body);

                  return (
                    <article
                      key={post.id}
                      className={cn(
                        "p-6 rounded-3xl border transition space-y-4 shadow-xl",
                        post.isPinned
                          ? "bg-gradient-to-r from-amber-950/20 via-[#1e1f22] to-[#1e1f22] border-amber-500/30 shadow-amber-500/5"
                          : "bg-[#1e1f22] border-zinc-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {post.isPinned && (
                              <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                <Pin className="h-3 w-3" />
                                GHIM BỞI LÃNH ĐẠO / HR
                              </span>
                            )}
                            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full font-semibold">
                              {post.category?.name || "Thông báo chung"}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-white leading-snug">{post.title}</h4>
                        </div>

                        <div className="text-right text-[11px] text-zinc-400 font-mono">
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>

                      {/* High-res Image Banner */}
                      {imageUrl && (
                        <div className="relative w-full h-52 sm:h-72 rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                          <img
                            src={imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        </div>
                      )}

                      {/* Clean Text Content */}
                      <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-2xl border border-white/5 font-normal">
                        {cleanText || post.body}
                      </div>

                      {/* Interactive Reactions Bar */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {[
                          { emoji: "👍", label: "Hữu ích", defaultCount: 16 },
                          { emoji: "❤️", label: "Yêu thích", defaultCount: 11 },
                          { emoji: "🎉", label: "Chúc mừng", defaultCount: 9 },
                          { emoji: "🚀", label: "Bứt phá", defaultCount: 6 },
                          { emoji: "👏", label: "Hoan hô", defaultCount: 12 },
                          { emoji: "👀", label: "Đã xem", defaultCount: 35 },
                        ].map((rx) => {
                          const postRx = reactions[post.id] || {};
                          const count = postRx[rx.emoji] !== undefined ? postRx[rx.emoji] : rx.defaultCount;
                          const hasReacted = userReactions[post.id]?.has(rx.emoji);

                          return (
                            <button
                              key={rx.emoji}
                              type="button"
                              onClick={() => handleToggleReaction(post.id, rx.emoji, rx.defaultCount)}
                              className={cn(
                                "px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer select-none",
                                hasReacted
                                  ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm"
                                  : "bg-[#2b2d31]/80 hover:bg-[#2b2d31] border-white/5 text-zinc-400 hover:text-zinc-200"
                              )}
                              title={rx.label}
                            >
                              <span>{rx.emoji}</span>
                              <span className="text-[11px] font-mono">{count}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          ✍️ Đăng bởi: <strong className="text-white">{post.author?.name || "Ban Giám Đốc"}</strong>
                        </span>

                        <button
                          onClick={() => handleMarkPostRead(post.id)}
                          disabled={post.isRead}
                          className={cn(
                            "px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition",
                            post.isRead
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 cursor-default"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{post.isRead ? "Đã đọc ✓" : "Đánh dấu đã đọc"}</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 0: PERSONAL WORKSPACE & AI ASSISTANT (DEKU AI CA NHAN V1) */}
        {activeTab === "today" && <PersonalWorkspaceView />}

        {/* TAB 3: MY PERSONAL BASE */}
        {activeTab === "me" && (
          <MyPersonalBase
            demoRole={demoRole}
            onOpenLeavePortal={() => setActiveTab("leave")}
          />
        )}

        {/* TAB 4: LEAVE PORTAL */}
        {activeTab === "leave" && <LeavePortal demoRole={demoRole} />}

        {/* TAB 5: EMPLOYEE DIRECTORY */}
        {activeTab === "directory" && (
          <EmployeeDirectory
            demoRole={demoRole}
            onSelectProfile={(profileId) => setSelectedProfileModal(profileId)}
          />
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === "audit" && <AuditLogsView />}

        {/* TAB 7: ENTERPRISE THREADS (KAGGLE V3) */}
        {activeTab === "threads" && <EnterpriseThreadsView />}

        {/* TAB 8: AI HR ADMINISTRATOR (AIHR-01 - AIHR-20) */}
        {activeTab === "ai-admin" && <AiHrAdminView />}
      </main>

      {/* Task Creation Modal */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Tạo Công Việc Mới Trong Base
              </h3>
              <button
                onClick={() => setIsCreateTaskOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Tên công việc</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Rà soát phụ đề phiên dịch Việt - Anh"
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Tổ chuyên môn phụ trách</label>
                <select
                  value={newTaskOrgId}
                  onChange={(e) => setNewTaskOrgId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                >
                  {allTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Độ ưu tiên</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Vừa (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Thời hạn</label>
                  <input
                    type="text"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition"
                >
                  Lưu công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulletin Post Creation Modal (With Image Banner Support) */}
      {isCreatePostOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                Đăng Thông Báo Mới (Kèm Banner Hình Ảnh)
              </h3>
              <button
                onClick={() => setIsCreatePostOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Tiêu đề thông báo / bản tin</label>
                <input
                  type="text"
                  required
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch triển khai hệ thống làm việc số quý mới..."
                  className="w-full h-10 px-3.5 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Chuyên mục</label>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  >
                    <option value="Công ty">Công ty (Chung)</option>
                    <option value="Nhân sự">Nhân sự & Đãi ngộ</option>
                    <option value="Quy trình">Quy trình vận hành</option>
                    <option value="Pháp luật">Pháp chế & Bảo mật</option>
                    <option value="Tuyên dương">Tuyên dương & Khen thưởng</option>
                    <option value="Marketing">Marketing & Truyền thông</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-zinc-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPostIsPinned}
                      onChange={(e) => setNewPostIsPinned(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-0 h-4 w-4"
                    />
                    <span>Ghim lên đầu bảng tin</span>
                  </label>
                </div>
              </div>

              {/* Banner Image URL & Quick Preset selector */}
              <div className="space-y-2">
                <label className="text-zinc-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                    Hình ảnh banner (URL hoặc chọn mẫu có sẵn)
                  </span>
                </label>

                {/* Preset quick picks */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "🏢 Văn phòng", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" },
                    { label: "👥 Nhân sự", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" },
                    { label: "🏆 Tuyên dương", url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80" },
                    { label: "📋 Quy trình", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" },
                    { label: "⚖️ Pháp chế", url: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80" },
                    { label: "🚀 Công nghệ", url: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewPostImageUrl(preset.url)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border",
                        newPostImageUrl === preset.url
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-[#2b2d31] text-zinc-400 hover:text-white border-zinc-700"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  value={newPostImageUrl}
                  onChange={(e) => setNewPostImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-9 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-xs font-mono"
                />

                {/* Banner Image Preview */}
                {newPostImageUrl && (
                  <div className="relative h-28 w-full rounded-xl overflow-hidden border border-white/10 mt-1">
                    <img
                      src={newPostImageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-1 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-zinc-300">
                      Xem trước ảnh banner
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Nội dung chi tiết thông báo</label>
                <textarea
                  required
                  rows={6}
                  value={newPostBody}
                  onChange={(e) => setNewPostBody(e.target.value)}
                  placeholder="Kính gửi toàn thể Cán bộ Nhân viên,&#10;&#10;Nhằm tối ưu hóa hiệu suất và nâng cao tinh thần phối hợp..."
                  className="w-full p-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatePostOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingPost && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Đăng thông báo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile 3-Tier Security Matrix Modal */}
      {selectedProfileModal && (
        <UserProfileCard
          profileId={selectedProfileModal}
          isOpen={true}
          asRole={demoRole}
          onClose={() => setSelectedProfileModal(null)}
        />
      )}
    </div>
  );
}
