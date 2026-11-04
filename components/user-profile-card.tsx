"use client";

import React, { useEffect, useState } from "react";
import {
  Shield,
  Briefcase,
  Building2,
  Calendar,
  Award,
  Clock,
  X,
  Mail,
  CheckCircle,
  Loader2,
  Lock,
  MapPin,
  Phone,
  DollarSign,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfileCardProps {
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
  asRole?: string;
}

export function UserProfileCard({
  profileId,
  isOpen,
  onClose,
  asRole,
}: UserProfileCardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSalary, setShowSalary] = useState(false);

  useEffect(() => {
    if (!isOpen || !profileId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const url = `/api/profile/${profileId}${asRole ? `?asRole=${asRole}` : ""}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải thông tin hồ sơ");
        return res.json();
      })
      .then((resData) => {
        if (isMounted) setData(resData);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [profileId, isOpen, asRole]);

  if (!isOpen) return null;

  const profile = data?.profile;
  const employee = data?.employee;
  const accessLevel = data?.accessLevel; // "SELF" | "HR" | "HEAD" | "LEAD" | "PUBLIC"
  const orgUnits = data?.orgUnits || [];
  const commendations = data?.commendations || [];

  const isSelfOrHr = accessLevel === "SELF" || accessLevel === "HR";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#1e1f22] border border-zinc-800 shadow-2xl overflow-hidden select-none max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Graphic */}
        <div className="h-28 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-6 pb-6 pt-0 relative overflow-y-auto">
          {/* Avatar floating */}
          <div className="-mt-14 mb-3 flex items-end justify-between">
            <div className="h-24 w-24 rounded-2xl border-4 border-[#1e1f22] bg-[#2b2d31] overflow-hidden shadow-xl flex items-center justify-center shrink-0">
              {profile?.imageUrl ? (
                <img
                  src={profile.imageUrl}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-emerald-600 flex items-center justify-center text-white font-extrabold text-2xl">
                  {profile?.name?.slice(0, 1) || "U"}
                </div>
              )}
            </div>

            {/* Access Level Badge */}
            {accessLevel && (
              <span
                className={cn(
                  "text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                  accessLevel === "SELF"
                    ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                    : accessLevel === "HR"
                    ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                    : "bg-white/5 border-white/10 text-zinc-300"
                )}
              >
                Quyền: {accessLevel === "SELF" ? "Chính Chủ (Toàn quyền)" : accessLevel}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
              <p className="text-xs">Đang tải hồ sơ bảo mật 3 tầng...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-400">{error}</div>
          ) : (
            <div className="space-y-4">
              {/* Name & Job Title */}
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>{profile?.name}</span>
                  {employee?.employeeCode && (
                    <span className="text-[11px] font-mono font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      {employee.employeeCode}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Briefcase className="h-3 w-3 text-zinc-500" />
                  <span>{employee?.jobTitle || "Thành viên doanh nghiệp"}</span>
                </p>
              </div>

              {/* Department & Team Org */}
              {orgUnits.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {orgUnits.map((u: any) => (
                    <span
                      key={u.id}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#2b2d31] border border-white/5 text-zinc-300 flex items-center gap-1"
                    >
                      <Building2 className="h-3 w-3 text-indigo-400" />
                      <span>{u.name}</span>
                      {u.role && (
                        <span className="text-[9px] text-amber-300 font-mono">({u.role})</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Personal Details (Address, Age, Phone) */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                {/* Tuổi & Ngày sinh */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                    Tuổi / Ngày sinh:
                  </span>
                  {employee?.dob ? (
                    <strong className="text-white">
                      {new Date(employee.dob).toLocaleDateString("vi-VN")}{" "}
                      {employee.age !== null && (
                        <span className="text-sky-400">({employee.age} tuổi)</span>
                      )}
                    </strong>
                  ) : isSelfOrHr ? (
                    <span className="text-zinc-500 italic">Chưa cập nhật</span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Bảo mật riêng tư
                    </span>
                  )}
                </div>

                {/* Nơi ở */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-zinc-400 flex items-center gap-1.5 shrink-0">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                    Nơi ở:
                  </span>
                  {employee?.address ? (
                    <strong className="text-zinc-200 text-right max-w-[240px]">
                      {employee.address}
                    </strong>
                  ) : isSelfOrHr ? (
                    <span className="text-zinc-500 italic">Chưa cập nhật</span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Bảo mật riêng tư
                    </span>
                  )}
                </div>

                {/* Số điện thoại */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    Số điện thoại:
                  </span>
                  {employee?.phoneNumber ? (
                    <strong className="text-indigo-300 font-mono">
                      {employee.phoneNumber}
                    </strong>
                  ) : isSelfOrHr ? (
                    <span className="text-zinc-500 italic">Chưa cập nhật</span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Bảo mật riêng tư
                    </span>
                  )}
                </div>
              </div>

              {/* Commendations / Badges */}
              {commendations.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1">
                    <Award className="h-3.5 w-3.5" />
                    Khen thưởng & Ghi nhận
                  </span>
                  <div className="space-y-1">
                    {commendations.map((c: any) => (
                      <p key={c.id} className="text-xs text-amber-100 font-medium">
                        ⭐ {c.title}: <span className="opacity-80">{c.content}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Sensitive Tier Stats: Worked Days & Tenure */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {employee?.tenure !== undefined ? (
                  <div className="p-3 rounded-xl bg-[#2b2d31]/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-emerald-400" />
                      Thâm niên
                    </span>
                    <p className="text-xs font-bold text-white">{employee.tenure}</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#2b2d31]/20 border border-white/5 space-y-0.5 opacity-60">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Thâm niên
                    </span>
                    <p className="text-xs text-zinc-500 italic">Bảo mật</p>
                  </div>
                )}

                {employee?.worked_days !== undefined ? (
                  <div className="p-3 rounded-xl bg-[#2b2d31]/60 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-emerald-400" />
                      Công tháng này
                    </span>
                    <p className="text-xs font-bold text-emerald-400">
                      {employee.worked_days} / 22 ngày
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#2b2d31]/20 border border-white/5 space-y-0.5 opacity-60">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Chấm công
                    </span>
                    <p className="text-xs text-zinc-500 italic">Bảo mật (Lead/HR)</p>
                  </div>
                )}
              </div>

              {/* Lương & Thu nhập (Chỉ hiển thị nếu là Chính chủ hoặc HR) */}
              {isSelfOrHr ? (
                <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Lương & Thu nhập cá nhân
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSalary(!showSalary)}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      {showSalary ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      <span>{showSalary ? "Ẩn" : "Hiện"}</span>
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-zinc-400">Tổng thực lĩnh (Net):</span>
                    <strong className="text-sm font-black text-amber-400">
                      {showSalary
                        ? `${(employee?.totalSalary || 0).toLocaleString("vi-VN")} đ`
                        : "•••••••••• đ"}
                    </strong>
                  </div>

                  {showSalary && (
                    <div className="text-[11px] text-zinc-400 pt-1 border-t border-amber-500/10 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Lương cơ bản:</span>
                        <span>{(employee?.baseSalary || 0).toLocaleString("vi-VN")} đ</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phụ cấp:</span>
                        <span>{(employee?.allowance || 0).toLocaleString("vi-VN")} đ</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>Thưởng KPI:</span>
                        <span>+{(employee?.bonus || 0).toLocaleString("vi-VN")} đ</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                  <span>
                    Thông tin Lương & Thu nhập được bảo mật nghiêm ngặt (Chỉ chính chủ & HR).
                  </span>
                </div>
              )}

              {/* Contact Email */}
              {profile?.email && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{profile.email}</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Xác minh</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
