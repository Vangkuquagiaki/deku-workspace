import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Shield, Sparkles, Building2, Users, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SignInPage() {
  const demoAccounts = [
    {
      role: "HEAD",
      roleBadge: "Giám Đốc Khối (HEAD)",
      roleColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      name: "Lê Hoàng Long",
      email: "head.tech@enterprise.local",
      dept: "Phòng Công Nghệ",
      desc: "Xem toàn bộ task của mọi tổ trực thuộc phòng, duyệt nhân sự cấp phòng.",
    },
    {
      role: "LEAD",
      roleBadge: "Trưởng Tổ (LEAD)",
      roleColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      name: "Nguyễn Minh Tuấn",
      email: "lead.cloud@enterprise.local",
      dept: "Tổ Nền Tảng & Cloud",
      desc: "Quản lý và điều phối các nhiệm vụ của tổ mình, xem thâm niên thành viên.",
    },
    {
      role: "HR",
      roleBadge: "Nhân Sự (HR)",
      roleColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      name: "Phạm Thu Hà",
      email: "hr.admin@enterprise.local",
      dept: "Phòng Nhân Sự",
      desc: "Nhập CSV công nhật, quản trị bảng tin. Bị chặn xem nhiệm vụ phòng ban (B6).",
    },
    {
      role: "MEMBER",
      roleBadge: "Thành Viên (MEMBER)",
      roleColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      name: "Trần Thị Lan",
      email: "member.sales@enterprise.local",
      dept: "Tổ Kinh Doanh Nội Địa",
      desc: "Chỉ thấy công việc của tổ mình và hồ sơ cá nhân bảo mật.",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col lg:flex-row items-center justify-center gap-8 py-8">
      {/* Clerk Sign In Box */}
      <div className="shrink-0">
        <SignIn />
      </div>

      {/* Demo Credentials & Quick Explore Guide */}
      <div className="max-w-md w-full bg-[#1e1f22]/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="space-y-1.5 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="font-bold text-white text-base">Hệ Thống Doanh Nghiệp Demo</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Hệ thống áp dụng ma trận bảo mật 3 tầng, phân cấp OrgUnit, và tự động hóa biên bản họp Lark Base.
          </p>
        </div>

        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            4 Vai Trò Demo (Tài khoản mẫu)
          </span>

          {demoAccounts.map((acc) => (
            <div
              key={acc.email}
              className="p-3 rounded-2xl bg-[#2b2d31]/60 border border-white/5 space-y-1.5 hover:border-zinc-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{acc.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${acc.roleColor}`}>
                  {acc.roleBadge}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>{acc.email}</span>
                <span className="text-zinc-500">{acc.dept}</span>
              </div>
              <p className="text-[11px] text-zinc-400 italic">{acc.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
          <Link
            href="/base"
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 group"
          >
            <span>Vào thẳng Lark Base Demo</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
          <Link
            href="/meetings"
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 group"
          >
            <span>Phòng Họp AI</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
