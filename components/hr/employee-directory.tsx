"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Clock,
  Briefcase,
  Mail,
  Shield,
  Loader2,
  X,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeDirectoryProps {
  demoRole: string;
  onSelectProfile: (profileId: string) => void;
}

export function EmployeeDirectory({ demoRole, onSelectProfile }: EmployeeDirectoryProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [teams, setTeams] = useState<any[]>([]);

  // Onboarding Modal
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newOrgUnitId, setNewOrgUnitId] = useState("");
  const [newRole, setNewRole] = useState("MEMBER");
  const [onboardLoading, setOnboardLoading] = useState(false);

  // Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState<any>(null);
  const [targetOrgUnitId, setTargetOrgUnitId] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  // CSV Import Modal (Mục 10.5)
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvMessage, setCsvMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const sampleCsvData = `employee_code,full_name,email,job_title,team,hired_on,worked_days,month
EMP026,Hoàng Gia Bảo,bao.hoang@congty.com,Kỹ sư DevOps,Tổ Nền Tảng & Cloud,2023-09-01,22.0,2026-10-01
EMP027,Nguyễn Thùy Dung,dung.nguyen@congty.com,Chuyên viên Kiểm thử,Tổ Đảm Bảo Chất Lượng (QA),2023-10-15,21.5,2026-10-01`;

  const handleLoadSampleCsv = () => {
    setCsvContent(sampleCsvData);
    setCsvPreview(null);
    setCsvMessage(null);
  };

  const handleCsvPreview = async () => {
    if (!csvContent.trim()) {
      setCsvMessage({ type: "error", text: "Vui lòng nhập hoặc dán nội dung CSV." });
      return;
    }
    setCsvLoading(true);
    setCsvMessage(null);
    try {
      const res = await fetch("/api/hr/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent, dryRun: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setCsvPreview(data);
      } else {
        setCsvMessage({ type: "error", text: data.error || "Lỗi khi kiểm tra dữ liệu CSV" });
      }
    } catch (e: any) {
      setCsvMessage({ type: "error", text: e.message || "Không thể kết nối đến máy chủ" });
    } finally {
      setCsvLoading(false);
    }
  };

  const handleCsvCommit = async () => {
    setCsvLoading(true);
    setCsvMessage(null);
    try {
      const res = await fetch("/api/hr/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent, dryRun: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setCsvMessage({
          type: "success",
          text: `Nhập thành công! Đã thêm ${data.createdCount || 0} nhân sự mới, cập nhật ${data.updatedCount || 0} bản ghi.`,
        });
        setCsvPreview(null);
        fetchEmployees();
      } else {
        setCsvMessage({ type: "error", text: data.error || "Lỗi khi nhập dữ liệu CSV" });
      }
    } catch (e: any) {
      setCsvMessage({ type: "error", text: e.message || "Không thể lưu dữ liệu vào hệ thống" });
    } finally {
      setCsvLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchEmployees();
  }, [selectedTeamId, search]);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/org-units/tree");
      if (res.ok) {
        const depts = await res.json();
        const allTeams: any[] = [];
        depts.forEach((d: any) => {
          if (d.children) {
            allTeams.push(...d.children);
          }
        });
        setTeams(allTeams);
        if (allTeams.length > 0 && !newOrgUnitId) {
          setNewOrgUnitId(allTeams[0].id);
          setTargetOrgUnitId(allTeams[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const url = `/api/employees?teamId=${selectedTeamId}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          jobTitle: newJobTitle,
          orgUnitId: newOrgUnitId,
          role: newRole,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể tạo nhân sự mới");
      }

      setIsOnboardOpen(false);
      setNewName("");
      setNewEmail("");
      setNewJobTitle("");
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmployee) return;
    setTransferLoading(true);

    try {
      const res = await fetch(`/api/employees/${transferEmployee.id}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetOrgUnitId,
          note: transferNote,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể điều chuyển nhân sự");
      }

      setIsTransferOpen(false);
      setTransferEmployee(null);
      setTransferNote("");
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  const isHrOrAdmin = demoRole === "HR" || demoRole === "HEAD";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header & Actions */}
      <div className="bg-[#1e1f22] p-6 rounded-3xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-600/20 text-purple-400">
              <Users className="h-5 w-5" />
            </span>
            <h3 className="text-base font-bold text-white">
              Danh Bạ Doanh Nghiệp & Quản Lý Vòng Đời Nhân Sự (HR Lifecycle)
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Hệ thống danh bạ nhân sự toàn công ty, tiếp nhận onboarding và điều chuyển phòng ban - tổ chuyên môn có lưu vết kiểm toán
          </p>
        </div>

        {isHrOrAdmin && (
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                setIsCsvOpen(true);
                setCsvMessage(null);
                setCsvPreview(null);
              }}
              className="h-10 px-3.5 rounded-xl text-xs font-bold bg-[#2b2d31] hover:bg-zinc-700 text-indigo-300 hover:text-white border border-indigo-500/30 transition flex items-center gap-1.5"
            >
              <Upload className="h-4 w-4 text-indigo-400" />
              <span>Nhập CSV (Mục 10.5)</span>
            </button>

            <button
              onClick={() => setIsOnboardOpen(true)}
              className="h-10 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Tiếp Nhận Nhân Sự Mới (Onboard)</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Tìm theo tên nhân sự, mã nhân viên (EMPxxx) hoặc chức danh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-2xl bg-[#1e1f22] border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          className="h-10 px-3.5 rounded-2xl bg-[#1e1f22] border border-zinc-800 text-white text-xs focus:outline-none w-full sm:w-auto"
        >
          <option value="all">Tất cả các tổ trong công ty</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="text-xs">Đang tải danh bạ nhân sự...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#1e1f22] border border-zinc-800 text-center text-xs text-zinc-500">
          Không tìm thấy nhân viên nào phù hợp với bộ lọc tìm kiếm.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const orgMembership = emp.profile?.orgUnitMembers?.[0];
            const orgUnit = orgMembership?.orgUnit;
            const deptName = orgUnit?.parent?.name || "Khối Công Ty";
            const teamName = orgUnit?.name || "Chưa phân tổ";

            return (
              <div
                key={emp.id}
                className="p-5 rounded-3xl bg-[#1e1f22] border border-zinc-800 space-y-4 hover:border-zinc-700 transition shadow-xl group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.profile?.imageUrl}
                      alt={emp.profile?.name}
                      className="h-12 w-12 rounded-2xl bg-zinc-800 object-cover border border-white/10"
                    />
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectProfile(emp.profileId)}
                        className="font-bold text-sm text-white hover:text-indigo-400 transition text-left block"
                      >
                        {emp.profile?.name}
                      </button>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {emp.employeeCode} • {emp.jobTitle}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono",
                      emp.employmentStatus === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    )}
                  >
                    {emp.employmentStatus}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span>Khối:</span>
                    <strong className="text-zinc-300">{deptName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tổ trực thuộc:</span>
                    <strong className="text-indigo-300">{teamName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Vai trò:</span>
                    <span className="text-amber-400 font-semibold">{orgMembership?.role || "MEMBER"}</span>
                  </div>
                  {emp.hiredOn && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Tiếp nhận:</span>
                      <span className="text-zinc-300 font-medium">
                        {new Date(emp.hiredOn).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Onboarding Checklist Status (if any) */}
                {emp.onboardingTasks && emp.onboardingTasks.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      Hội nhập: {emp.onboardingTasks.filter((t: any) => t.isCompleted).length}/
                      {emp.onboardingTasks.length} hoàn thành
                    </span>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${
                            (emp.onboardingTasks.filter((t: any) => t.isCompleted).length /
                              emp.onboardingTasks.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                  <button
                    onClick={() => onSelectProfile(emp.profileId)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1"
                  >
                    <span>Xem Hồ Sơ 3 Tầng</span>
                  </button>

                  {isHrOrAdmin && (
                    <button
                      onClick={() => {
                        setTransferEmployee(emp);
                        setIsTransferOpen(true);
                      }}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-xl font-medium transition flex items-center gap-1"
                      title="Điều chuyển sang tổ khác"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 text-amber-400" />
                      <span>Điều chuyển</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Onboarding New Employee */}
      {isOnboardOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
          <div className="max-w-md w-full bg-[#1e1f22] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-purple-400" />
                Tiếp Nhận Nhân Sự Mới (Onboard)
              </h4>
              <button onClick={() => setIsOnboardOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleOnboard} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Họ và tên nhân viên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Minh Đức..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Email doanh nghiệp</label>
                <input
                  type="email"
                  required
                  placeholder="duc.hoang@enterprise.local"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Chức danh công việc</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Kỹ sư Phần mềm / Chuyên viên QA..."
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Tổ tiếp nhận</label>
                  <select
                    value={newOrgUnitId}
                    onChange={(e) => setNewOrgUnitId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Vai trò</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                  >
                    <option value="MEMBER">Thành viên (MEMBER)</option>
                    <option value="LEAD">Trưởng tổ (LEAD)</option>
                    <option value="HEAD">Trưởng phòng (HEAD)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Tự động hóa tiếp nhận:
                </span>
                <p>
                  Hệ thống sẽ tự động gán mã nhân viên tiếp theo, khởi tạo bộ checklist hội nhập 3 bước, và ghi nhật ký vòng đời (EmploymentEvent).
                </p>
              </div>

              <button
                type="submit"
                disabled={onboardLoading}
                className="w-full h-11 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
              >
                {onboardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>Hoàn Tất Tiếp Nhận Nhân Sự</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Employee */}
      {isTransferOpen && transferEmployee && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
          <div className="max-w-md w-full bg-[#1e1f22] border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-amber-400" />
                Điều Chuyển Nhân Sự (Transfer Team)
              </h4>
              <button onClick={() => setIsTransferOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-zinc-400 text-[11px]">Nhân sự được điều chuyển:</span>
                <div className="font-bold text-white text-sm">
                  {transferEmployee.profile?.name} ({transferEmployee.employeeCode})
                </div>
                <div className="text-[11px] text-zinc-400">
                  Tổ hiện tại: <strong className="text-amber-400">{transferEmployee.profile?.orgUnitMembers?.[0]?.orgUnit?.name || "Chưa có"}</strong>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Chuyển sang Tổ tiếp nhận mới</label>
                <select
                  value={targetOrgUnitId}
                  onChange={(e) => setTargetOrgUnitId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Lý do / Quyết định điều chuyển</label>
                <textarea
                  rows={2}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Ghi rõ lý do điều động công tác..."
                  className="w-full p-3 rounded-xl bg-[#2b2d31] border border-zinc-700 text-white focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                ⚠️ Quyền truy cập kênh chat Discord của tổ cũ sẽ được thu hồi và tự động cấp quyền vào kênh của tổ mới.
              </div>

              <button
                type="submit"
                disabled={transferLoading}
                className="w-full h-11 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
              >
                {transferLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                <span>Xác Nhận Quyết Định Điều Chuyển</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal (Mục 10.5 - Nhập nhân sự & ngày công bằng CSV) */}
      {isCsvOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1f22] border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  Nhập Nhân Sự & Ngày Công Bằng CSV (HR Import - Mục 10.5)
                </h3>
              </div>
              <button
                onClick={() => setIsCsvOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Dán dữ liệu CSV hoặc tải mẫu:</span>
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Download className="h-3 w-3" />
                  <span>Dán dữ liệu mẫu chuẩn (2 nhân sự)</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setCsvPreview(null);
                }}
                placeholder="employee_code,full_name,email,job_title,team,hired_on,worked_days,month..."
                className="w-full p-3 font-mono text-[11px] rounded-xl bg-[#2b2d31] border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />

              {csvMessage && (
                <div
                  className={cn(
                    "p-3 rounded-xl border text-xs flex items-start gap-2",
                    csvMessage.type === "success"
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/30 text-rose-300"
                  )}
                >
                  {csvMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span>{csvMessage.text}</span>
                </div>
              )}

              {/* Dry-Run Preview Summary Box */}
              {csvPreview && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Kết quả xem trước (Dry Run Preview):</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
                      Hợp lệ: {csvPreview.validCount || (csvPreview.preview?.length || 0)} dòng
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 font-semibold">
                      Thêm mới: +{csvPreview.newCount || csvPreview.preview?.filter((p: any) => p.isNew)?.length || 0}
                    </div>
                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300 font-semibold">
                      Cập nhật: {csvPreview.updateCount || 0}
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 font-semibold">
                      Lỗi: {csvPreview.errorCount || csvPreview.errors?.length || 0}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCsvOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={handleCsvPreview}
                  disabled={csvLoading || !csvContent.trim()}
                  className="px-4 py-2 rounded-xl font-bold bg-[#2b2d31] hover:bg-zinc-700 text-white border border-zinc-700 transition flex items-center gap-1.5"
                >
                  {csvLoading && !csvPreview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>1. Xem Trước (Dry Run)</span>
                </button>

                <button
                  type="button"
                  onClick={handleCsvCommit}
                  disabled={csvLoading || !csvContent.trim()}
                  className="px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
                >
                  {csvLoading && csvPreview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  <span>2. Xác Nhận Nhập Hệ Thống</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
