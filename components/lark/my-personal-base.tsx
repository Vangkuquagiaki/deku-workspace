"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  DollarSign,
  Clock,
  Shield,
  CreditCard,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Save,
  Award,
  Sparkles,
  ChevronRight,
  FileText,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MyPersonalBaseProps {
  demoRole?: string;
  onOpenLeavePortal?: () => void;
}

export function MyPersonalBase({ demoRole = "MEMBER", onOpenLeavePortal }: MyPersonalBaseProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Privacy toggle for salary display
  const [showSalary, setShowSalary] = useState(false);

  // Edit Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editBankName, setEditBankName] = useState("");
  const [editBaseSalary, setEditBaseSalary] = useState<number>(0);
  const [editAllowance, setEditAllowance] = useState<number>(0);
  const [editBonus, setEditBonus] = useState<number>(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEdit = demoRole === "HEAD" || demoRole === "HR";

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/me");
      if (!res.ok) {
        throw new Error("Không thể tải thông tin hồ sơ cá nhân");
      }
      const json = await res.json();
      setData(json);

      // Prepopulate edit modal
      setEditName(json.profile?.name || "");
      setEditAddress(json.employee?.address || "");
      setEditPhone(json.employee?.phoneNumber || "");
      setEditDob(
        json.employee?.dob ? new Date(json.employee.dob).toISOString().split("T")[0] : ""
      );
      setEditBankAccount(json.employee?.bankAccount || "");
      setEditBankName(json.employee?.bankName || "");
      setEditBaseSalary(json.employee?.baseSalary || 0);
      setEditAllowance(json.employee?.allowance || 0);
      setEditBonus(json.employee?.bonus || 0);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Bạn không có quyền chỉnh sửa hồ sơ & đãi ngộ.");
      return;
    }
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          address: editAddress,
          phoneNumber: editPhone,
          dob: editDob || null,
          bankAccount: editBankAccount,
          bankName: editBankName,
          baseSalary: editBaseSalary,
          allowance: editAllowance,
          bonus: editBonus,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể lưu thông tin");
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditOpen(false);
        setSaveSuccess(false);
        fetchProfile();
      }, 800);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-sm font-medium">Đang tải Base thông tin cá nhân của bạn...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-lg mx-auto my-12">
        <AlertCircle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-rose-300">Không thể tải hồ sơ</h4>
        <p className="text-xs text-rose-200 mt-1">{error}</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { profile, employee, attendanceHistory, orgUnits, leaveBalances, tasks, commendations } = data;

  const annualLeave = leaveBalances?.find((b: any) => b.policyCode === "ANNUAL") || {
    totalDays: 12,
    usedDays: 0,
    remainingDays: 12,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 p-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Banner & Profile Card */}
      <div className="relative rounded-2xl bg-[#1e1f22] border border-zinc-800 shadow-xl overflow-hidden">
        {/* Decorative Top Banner */}
        <div className="h-24 bg-gradient-to-r from-zinc-900 via-indigo-950/70 to-zinc-900 relative border-b border-white/5">
          <div className="absolute top-3 right-4 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-zinc-300 border border-white/10 flex items-center gap-1 font-mono">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>Base Cá Nhân</span>
            </span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 mb-2">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl border-4 border-[#1e1f22] bg-[#2b2d31] overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
                {profile.imageUrl ? (
                  <img
                    src={profile.imageUrl}
                    alt={profile.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                    {profile.name?.slice(0, 1) || "U"}
                  </div>
                )}
              </div>

              <div className="space-y-0.5 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {profile.name}
                  </h2>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                    {employee.employeeCode}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Chính thức
                  </span>
                </div>

                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-semibold text-zinc-300">{employee.jobTitle}</span>
                  {orgUnits[0] && (
                    <>
                      <span>•</span>
                      <span className="text-zinc-400">{orgUnits[0].unitName}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="h-8 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Cập nhật đãi ngộ & hồ sơ</span>
                </button>
              ) : (
                <div className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-800/90 text-zinc-400 border border-zinc-700/60 flex items-center gap-1.5 shadow-sm">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>Chỉ xem (Kế toán & HR quản trị)</span>
                </div>
              )}

              {onOpenLeavePortal && (
                <button
                  type="button"
                  onClick={onOpenLeavePortal}
                  className="h-8 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Xin nghỉ phép</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security RBAC Banner for Member */}
      {!canEdit && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <Shield className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong>Phân quyền Nhân sự:</strong> Tài khoản của bạn được cấp quyền xem thông tin cá nhân và bảng lương đãi ngộ. Việc chỉnh sửa mức lương, phụ cấp và tài khoản nhận lương được kiểm soát bởi Ban Lãnh đạo, Phòng Kế toán & HR.
          </span>
        </div>
      )}

      {/* 2. Grid Overview: Personal Info, Work & Seniority, Compensation, Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khối 1: Thông tin nhân thân & Nơi ở */}
        <div className="p-5 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <User className="h-3.5 w-3.5 text-sky-400" />
              <span>Thông Tin Nhân Thân & Cư Trú</span>
            </h3>
            <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">
              Bảo Mật Cấp 3
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                Họ và tên:
              </span>
              <strong className="text-white font-semibold text-right">{profile.name}</strong>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Ngày sinh & Tuổi:
              </span>
              <div className="text-right">
                <strong className="text-white font-semibold">
                  {employee.dob
                    ? new Date(employee.dob).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </strong>
                {employee.age !== null && (
                  <span className="ml-1 text-sky-400 font-bold">({employee.age} tuổi)</span>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5 shrink-0">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                Nơi ở / Địa chỉ:
              </span>
              <strong className="text-zinc-200 font-medium text-right max-w-[280px]">
                {employee.address}
              </strong>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-500" />
                Số điện thoại:
              </span>
              <strong className="text-indigo-300 font-mono font-semibold text-right">
                {employee.phoneNumber}
              </strong>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-zinc-500" />
                Email công vụ:
              </span>
              <strong className="text-zinc-300 font-mono text-right">{profile.email}</strong>
            </div>

            <div className="flex items-start justify-between py-1">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                Số CCCD / Định danh:
              </span>
              <strong className="text-zinc-300 font-mono text-right">
                {employee.idCardNumber}
              </strong>
            </div>
          </div>
        </div>

        {/* Khối 2: Công tác, Phòng ban & Thâm niên */}
        <div className="p-5 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Building2 className="h-3.5 w-3.5 text-purple-400" />
              <span>Vị Trí Công Tác & Thâm Niên</span>
            </h3>
            <span className="text-[9px] uppercase font-mono font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
              Doanh Nghiệp
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                Chức vụ / Vị trí:
              </span>
              <strong className="text-white font-semibold text-right">{employee.jobTitle}</strong>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                Thâm niên làm việc:
              </span>
              <strong className="text-emerald-400 font-bold text-right">{employee.tenure}</strong>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                Đơn vị / Tổ công tác:
              </span>
              <div className="text-right space-y-1">
                {orgUnits.length > 0 ? (
                  orgUnits.map((u: any) => (
                    <div key={u.unitId} className="flex items-center justify-end gap-1.5">
                      <span className="text-zinc-200 font-semibold">{u.unitName}</span>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded">
                        {u.role}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-zinc-500">Chưa gán tổ chức</span>
                )}
              </div>
            </div>

            <div className="flex items-start justify-between py-1 border-b border-zinc-800/40">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                Quỹ ngày phép năm ({new Date().getFullYear()}):
              </span>
              <div className="text-right">
                <span className="text-zinc-400">Còn lại: </span>
                <strong className="text-indigo-400 font-bold text-sm">
                  {annualLeave.remainingDays}
                </strong>
                <span className="text-zinc-500 text-[11px]"> / {annualLeave.totalDays} ngày</span>
              </div>
            </div>

            <div className="flex items-start justify-between py-1">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-zinc-500" />
                Khen thưởng & Ghi nhận:
              </span>
              <strong className="text-amber-300 font-medium text-right">
                {commendations.length > 0 ? `${commendations.length} danh hiệu` : "0 danh hiệu"}
              </strong>
            </div>
          </div>
        </div>

        {/* Khối 3: Bảng Chấm Công & Ngày Công Thực Tế */}
        <div className="p-5 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>Chấm Công & Ngày Công</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded-md">
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-zinc-400 uppercase font-bold tracking-wider">
                Ngày công tháng hiện tại
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-400">
                  {employee.workedDaysThisMonth}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">/ 22.0 ngày công chuẩn</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl">
                Đạt 100% định mức
              </span>
            </div>
          </div>

          {/* Lịch sử ngày công gần nhất */}
          {attendanceHistory && attendanceHistory.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                Lịch sử ngày công các tháng:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {attendanceHistory.slice(0, 3).map((a: any) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center"
                  >
                    <span className="text-[10px] text-zinc-500 font-mono block">{a.month}</span>
                    <strong className="text-xs font-bold text-white">{a.workedDays} ngày</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Khối 4: Lương & Đãi Ngộ Cá Nhân (Tuyệt đối bảo mật) */}
        <div className="p-5 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
              <span>Lương & Đãi Ngộ Cá Nhân</span>
            </h3>

            {/* Toggle show/hide salary button */}
            <button
              type="button"
              onClick={() => setShowSalary(!showSalary)}
              className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 transition border border-white/10"
              title="Ẩn / Hiện số tiền để bảo mật"
            >
              {showSalary ? (
                <>
                  <EyeOff className="h-3 w-3 text-zinc-400" />
                  <span>Ẩn</span>
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 text-amber-400" />
                  <span>Hiện</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                  Tổng thu nhập thực lĩnh (Net)
                </p>
                <div className="text-2xl font-black text-amber-400 mt-0.5">
                  {showSalary ? (
                    `${employee.totalSalary.toLocaleString("vi-VN")} đ`
                  ) : (
                    <span className="font-mono tracking-widest text-lg text-zinc-400">
                      •••••••••••• đ
                    </span>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                Đã duyệt tháng 10/2026
              </span>
            </div>

            {/* Chi tiết các khoản */}
            <div className="pt-2 border-t border-amber-500/20 space-y-1.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Lương cơ bản:</span>
                <strong>
                  {showSalary ? `${employee.baseSalary.toLocaleString("vi-VN")} đ` : "•••••• đ"}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Phụ cấp (Ăn trưa, xăng xe, trách nhiệm):</span>
                <strong>
                  {showSalary ? `${employee.allowance.toLocaleString("vi-VN")} đ` : "•••••• đ"}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Thưởng hiệu suất KPI / Dự án:</span>
                <strong className="text-emerald-400">
                  {showSalary ? `+${employee.bonus.toLocaleString("vi-VN")} đ` : "•••••• đ"}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/10">
                <span className="text-zinc-400">Mức đóng BHXH theo luật:</span>
                <span className="text-zinc-400">
                  {showSalary ? `${employee.insuranceSalary.toLocaleString("vi-VN")} đ` : "•••••• đ"}
                </span>
              </div>
            </div>
          </div>

          {/* Thông tin tài khoản ngân hàng nhận lương */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-1 text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                Tài khoản nhận lương:
              </span>
              <strong className="text-white font-mono">{employee.bankAccount}</strong>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Ngân hàng:</span>
              <span className="text-zinc-300 font-semibold">{employee.bankName}</span>
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>
              Dữ liệu thu nhập được mã hóa và bảo mật nghiêm ngặt theo Nghị định 13/2023/NĐ-CP.
            </span>
          </p>
        </div>
      </div>

      {/* 3. Tác Vụ Của Tôi (My Tasks) */}
      <div className="p-5 rounded-2xl bg-[#1e1f22] border border-zinc-800 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            <span>Nhiệm Vụ Được Giao ({tasks?.length || 0})</span>
          </h3>
          <span className="text-[11px] text-zinc-400">Đồng bộ từ Bảng việc Lark Base</span>
        </div>

        {tasks && tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((t: any) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white">{t.title}</h4>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono",
                      t.status === "DONE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : t.status === "IN_PROGRESS"
                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                        : t.status === "OVERDUE"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-zinc-700/50 text-zinc-300"
                    )}
                  >
                    {t.status}
                  </span>
                </div>
                {t.deadlineText && (
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-amber-400" />
                    <span>Hạn chót: {t.deadlineText}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic py-4 text-center">
            Bạn hiện chưa có nhiệm vụ nào tồn đọng.
          </p>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-3xl bg-[#1e1f22] border border-zinc-800 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-indigo-400" />
                <span>Cập Nhật Thông Tin Cá Nhân & Nơi Cư Trú</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Họ và tên</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Ngày tháng năm sinh</label>
                  <input
                    type="date"
                    value={editDob}
                    onChange={(e) => setEditDob(e.target.value)}
                    className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="09xx xxx xxx"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Nơi ở hiện tại / Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Số nhà, đường, phường, quận/huyện, tỉnh/TP"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Số tài khoản nhận lương</label>
                  <input
                    type="text"
                    value={editBankAccount}
                    onChange={(e) => setEditBankAccount(e.target.value)}
                    className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Tên ngân hàng</label>
                  <input
                    type="text"
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Vietcombank, MB, Techcombank..."
                  />
                </div>
              </div>

              {/* Compensation editing section (exclusive to HR / Head / Accounting) */}
              <div className="p-4 rounded-2xl bg-black/30 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Đãi Ngộ & Lương Thưởng (Thẩm quyền Kế toán & HR)
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                    CẤP QUẢN TRỊ
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Lương cơ bản (VNĐ)</label>
                    <input
                      type="number"
                      step="500000"
                      value={editBaseSalary}
                      onChange={(e) => setEditBaseSalary(Number(e.target.value))}
                      className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Phụ cấp (VNĐ)</label>
                    <input
                      type="number"
                      step="100000"
                      value={editAllowance}
                      onChange={(e) => setEditAllowance(Number(e.target.value))}
                      className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400">Thưởng (VNĐ)</label>
                    <input
                      type="number"
                      step="100000"
                      value={editBonus}
                      onChange={(e) => setEditBonus(Number(e.target.value))}
                      className="w-full bg-[#2b2d31] border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã lưu thành công thông tin hồ sơ của bạn!</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition disabled:opacity-50"
                >
                  {saveLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

