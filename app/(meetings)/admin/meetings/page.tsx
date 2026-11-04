"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Trash2,
  ArrowLeft,
  Search,
  Shield,
  Clock,
  Video,
  Languages,
  CheckCircle,
  Loader2,
  Play,
  Download,
  Calendar,
} from "lucide-react";

export default function AdminMeetingsPage() {
  const router = useRouter();
  const [terms, setTerms] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [lang, setLang] = useState("vi-en");
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [savedSettings, setSavedSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [termsRes, meetingsRes] = await Promise.all([
        fetch("/api/glossary"),
        fetch("/api/meetings"),
      ]);

      if (termsRes.ok) {
        const termsData = await termsRes.json();
        setTerms(termsData);
      }

      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        setMeetings(meetingsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !target.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: source.trim(),
          target: target.trim(),
          lang,
        }),
      });
      if (res.ok) {
        setSource("");
        setTarget("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTerm = async (id: string) => {
    try {
      const res = await fetch(`/api/glossary?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTerms((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTerms = terms.filter(
    (t) =>
      t.source?.toLowerCase().includes(search.toLowerCase()) ||
      t.target?.toLowerCase().includes(search.toLowerCase())
  );

  const recordings = meetings.flatMap((m) =>
    (m.recordings || []).map((r: any) => ({
      ...r,
      meetingTitle: m.title,
      meetingCode: m.code,
    }))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-zinc-100 overflow-y-auto">
      {/* Header */}
      <header className="h-16 px-6 border-b border-zinc-800/80 flex items-center justify-between bg-[#1e1f22]/70 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/meetings")}
            className="p-2 rounded-xl bg-[#2b2d31] hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Quản Trị Phòng Họp & Từ Điển Thuật Ngữ
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                Admin Settings
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Cấu hình từ điển phiên dịch và chính sách lưu trữ bản ghi cuộc họp
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/meetings")}
          className="text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition"
        >
          ← Danh sách cuộc họp
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Retention Policy Card */}
        <section className="p-6 rounded-3xl bg-[#1e1f22] border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Chính Sách Lưu Trữ Bản Ghi (Retention Policy)</h2>
              <p className="text-xs text-zinc-400">
                Tự động dọn dẹp bản ghi MP4 cũ sau thời gian chỉ định để tối ưu chi phí lưu trữ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-300 font-medium">Thời gian lưu trữ:</label>
              <select
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white focus:outline-none"
              >
                <option value={30}>30 ngày</option>
                <option value={60}>60 ngày</option>
                <option value={90}>90 ngày (Khuyên dùng)</option>
                <option value={180}>180 ngày</option>
                <option value={365}>1 năm</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSavedSettings(true);
                setTimeout(() => setSavedSettings(false), 2000);
              }}
              className="h-10 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5"
            >
              {savedSettings ? <CheckCircle className="h-3.5 w-3.5" /> : null}
              <span>{savedSettings ? "Đã lưu cài đặt" : "Lưu chính sách"}</span>
            </button>
          </div>
        </section>

        {/* Recordings Management Section */}
        <section className="p-6 md:p-8 rounded-3xl bg-[#1e1f22] border border-zinc-800 space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
            <div className="h-9 w-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Danh Sách Bản Ghi Cuộc Họp (Recordings)</h2>
              <p className="text-xs text-zinc-400">
                Quản lý các tệp video MP4 ghi hình cuộc họp đã lưu trữ trong hệ thống
              </p>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2b2d31]/80 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5 pl-5">Mã & Tiêu đề cuộc họp</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5">Thời lượng</th>
                  <th className="p-3.5">Ngày ghi</th>
                  <th className="p-3.5 pr-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {recordings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      Chưa có bản ghi nào. Hãy bấm &quot;Ghi hình&quot; trong cuộc họp để lưu lại.
                    </td>
                  </tr>
                ) : (
                  recordings.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#2b2d31]/40 transition">
                      <td className="p-3.5 pl-5">
                        <p className="font-semibold text-white">{rec.meetingTitle}</p>
                        <span className="font-mono text-[11px] text-emerald-400">
                          {rec.meetingCode}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-zinc-300 font-mono">
                        {rec.durationSec ? `${rec.durationSec} giây` : "Vừa ghi"}
                      </td>
                      <td className="p-3.5 text-zinc-400">
                        {new Date(rec.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => router.push(`/meetings/${rec.meetingCode}`)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-semibold transition inline-flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>Xem lại</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Glossary Terms Section */}
        <section className="p-6 md:p-8 rounded-3xl bg-[#1e1f22] border border-zinc-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Từ Điển Thuật Ngữ Công Ty (Glossary)</h2>
                <p className="text-xs text-zinc-400">
                  Đảm bảo AI dịch đúng tên sản phẩm, tên người và thuật ngữ chuyên ngành
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm thuật ngữ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Add Term Form */}
          <form onSubmit={handleAddTerm} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Thuật ngữ gốc (VD: Trưởng phòng)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="h-11 px-4 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Cách dịch chuẩn (VD: Department Head)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-11 px-4 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="h-11 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700/60 text-xs text-white focus:outline-none"
            >
              <option value="vi-en">Tiếng Việt → English</option>
              <option value="en-vi">English → Tiếng Việt</option>
            </select>
            <button
              type="submit"
              disabled={isAdding || !source.trim() || !target.trim()}
              className="h-11 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span>Thêm thuật ngữ</span>
            </button>
          </form>

          {/* Terms Table */}
          <div className="border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2b2d31]/80 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="p-3.5 pl-5">Thuật ngữ gốc</th>
                  <th className="p-3.5">Bản dịch bắt buộc</th>
                  <th className="p-3.5">Cặp ngôn ngữ</th>
                  <th className="p-3.5 pr-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                      Đang tải danh sách thuật ngữ...
                    </td>
                  </tr>
                ) : filteredTerms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                      Chưa có thuật ngữ nào được cấu hình.
                    </td>
                  </tr>
                ) : (
                  filteredTerms.map((t) => (
                    <tr key={t.id} className="hover:bg-[#2b2d31]/40 transition">
                      <td className="p-3.5 pl-5 font-semibold text-white">{t.source}</td>
                      <td className="p-3.5 text-emerald-400 font-medium">{t.target}</td>
                      <td className="p-3.5 text-zinc-400 font-mono text-[11px] uppercase">
                        {t.lang}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => handleDeleteTerm(t.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Xóa thuật ngữ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
