export type DepartmentCode =
  | "COMPANY"
  | "BDH"
  | "IT"
  | "SALES"
  | "HR"
  | "FIN"
  | "MKT"
  | "OPS";

export interface DepartmentInfo {
  key: DepartmentCode;
  name: string;
  shortName: string;
  badge: string;
  color: string;
  badgeColor: string;
  bgLight: string;
  isPrivate: boolean;
  description: string;
}

export const DEPARTMENTS_LIST: DepartmentInfo[] = [
  {
    key: "COMPANY",
    name: "Kênh Chung Toàn Công Ty",
    shortName: "Toàn công ty",
    badge: "Toàn công ty",
    color: "text-sky-400",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    bgLight: "bg-sky-500/5",
    isPrivate: false,
    description: "Kênh trao đổi chung cho toàn thể 1.280 cán bộ nhân viên công ty",
  },
  {
    key: "BDH",
    name: "Ban Giám Đốc & Điều Hành",
    shortName: "Ban Giám Đốc",
    badge: "Mật (C-Level)",
    color: "text-amber-400",
    badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    bgLight: "bg-amber-500/5",
    isPrivate: true,
    description: "Khu vực chiến lược, nghị quyết và điều hành cấp cao của Ban Tổng Giám Đốc",
  },
  {
    key: "IT",
    name: "Phòng Công Nghệ Thông Tin",
    shortName: "Công Nghệ (IT)",
    badge: "Kỹ thuật (IT)",
    color: "text-indigo-400",
    badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    bgLight: "bg-indigo-500/5",
    isPrivate: true,
    description: "Khu vực kỹ thuật: Phát triển phần mềm, AI, Hạ tầng Cloud & QA",
  },
  {
    key: "SALES",
    name: "Phòng Kinh Doanh & Đối Tác",
    shortName: "Kinh Doanh",
    badge: "Kinh doanh",
    color: "text-emerald-400",
    badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    bgLight: "bg-emerald-500/5",
    isPrivate: true,
    description: "Quản lý hợp đồng, doanh số, pipeline bán hàng và đối tác chiến lược",
  },
  {
    key: "HR",
    name: "Phòng Nhân Sự & Đào Tạo",
    shortName: "Nhân Sự (HR)",
    badge: "Nhân sự",
    color: "text-purple-400",
    badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    bgLight: "bg-purple-500/5",
    isPrivate: true,
    description: "Chính sách lương thưởng, tuyển dụng, bảo hiểm và văn hóa doanh nghiệp",
  },
  {
    key: "FIN",
    name: "Phòng Tài Chính - Kế Toán",
    shortName: "Tài Chính - Kế Toán",
    badge: "Tài chính",
    color: "text-yellow-400",
    badgeColor: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
    bgLight: "bg-yellow-500/5",
    isPrivate: true,
    description: "Ngân sách thu chi, hóa đơn chứng từ, kiểm toán và báo cáo tài chính",
  },
  {
    key: "MKT",
    name: "Phòng Marketing & Truyền Thông",
    shortName: "Marketing",
    badge: "Marketing",
    color: "text-rose-400",
    badgeColor: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    bgLight: "bg-rose-500/5",
    isPrivate: true,
    description: "Truyền thông thương hiệu, chiến dịch quảng cáo và tiếp thị sản phẩm",
  },
  {
    key: "OPS",
    name: "Vận Hành, CSKH & Pháp Chế",
    shortName: "Vận Hành & CSKH",
    badge: "Vận hành",
    color: "text-teal-400",
    badgeColor: "bg-teal-500/10 text-teal-300 border-teal-500/20",
    bgLight: "bg-teal-500/5",
    isPrivate: true,
    description: "Quy trình vận hành nội bộ, chăm sóc khách hàng và tư vấn pháp chế",
  },
];

export const DEPARTMENTS_MAP: Record<DepartmentCode, DepartmentInfo> =
  DEPARTMENTS_LIST.reduce((acc, dept) => {
    acc[dept.key] = dept;
    return acc;
  }, {} as Record<DepartmentCode, DepartmentInfo>);

export function getDepartmentCode(channel?: {
  name?: string | null;
  orgUnit?: { code?: string | null; name?: string | null } | null;
  orgUnitId?: string | null;
}): DepartmentCode {
  if (!channel) return "COMPANY";

  if (channel.orgUnit?.code) {
    const code = channel.orgUnit.code.toUpperCase();
    if (code.startsWith("BDH")) return "BDH";
    if (code.startsWith("IT")) return "IT";
    if (code.startsWith("SALES")) return "SALES";
    if (code.startsWith("HR")) return "HR";
    if (code.startsWith("FIN")) return "FIN";
    if (code.startsWith("MKT")) return "MKT";
    if (
      code.startsWith("OPS") ||
      code.startsWith("CS") ||
      code.startsWith("LEGAL")
    )
      return "OPS";
  }

  const name = (channel.name || "").toLowerCase();
  if (name.startsWith("bdh") || name.includes("giam-doc")) return "BDH";
  if (
    name.startsWith("it") ||
    name.includes("cloud") ||
    name.includes("qa") ||
    name.includes("backend") ||
    name.includes("frontend") ||
    name.includes("cong-nghe")
  ) {
    return "IT";
  }
  if (name.startsWith("sales") || name.includes("kinh-doanh")) return "SALES";
  if (name.startsWith("hr") || name.includes("nhan-su")) return "HR";
  if (
    name.startsWith("fin") ||
    name.includes("tai-chinh") ||
    name.includes("ke-toan") ||
    name.includes("ngan-sach")
  ) {
    return "FIN";
  }
  if (name.startsWith("mkt") || name.includes("marketing")) return "MKT";
  if (
    name.startsWith("ops") ||
    name.startsWith("cs") ||
    name.startsWith("legal") ||
    name.includes("van-hanh")
  ) {
    return "OPS";
  }

  return "COMPANY";
}

export function canAccessDepartment(
  perspective: string,
  deptCode: DepartmentCode
): boolean {
  // Boss / Executive sees all departments
  if (perspective === "ALL" || perspective === "BDH") {
    return true;
  }
  // Company-wide channels are accessible to everyone
  if (deptCode === "COMPANY") {
    return true;
  }
  // Employee can only access their assigned perspective department
  return perspective === deptCode;
}

export function getDepartmentInfo(code: DepartmentCode | string): DepartmentInfo {
  const upper = (code || "COMPANY").toUpperCase() as DepartmentCode;
  return DEPARTMENTS_MAP[upper] || DEPARTMENTS_MAP.COMPANY;
}

export function guessMemberDepartment(member: {
  profile?: { email?: string | null; name?: string | null };
  role?: string | null;
}): { deptCode: DepartmentCode; deptName: string; badge: string } {
  if (member.role === "ADMIN") {
    return {
      deptCode: "BDH",
      deptName: "Ban Giám Đốc",
      badge: "👑 C-Level",
    };
  }

  const email = (member.profile?.email || "").toLowerCase();
  const name = (member.profile?.name || "").toLowerCase();

  if (email.includes("it.") || email.includes(".tech") || name.includes("it")) {
    return {
      deptCode: "IT",
      deptName: "Phòng Công Nghệ",
      badge: "💻 Kỹ thuật",
    };
  }
  if (
    email.includes("sales.") ||
    email.includes("sale") ||
    name.includes("kinh doanh")
  ) {
    return {
      deptCode: "SALES",
      deptName: "Phòng Kinh Doanh",
      badge: "💼 Kinh doanh",
    };
  }
  if (email.includes("hr.") || name.includes("nhân sự")) {
    return {
      deptCode: "HR",
      deptName: "Phòng Nhân Sự",
      badge: "📋 Nhân sự",
    };
  }
  if (
    email.includes("fin.") ||
    email.includes("acc.") ||
    name.includes("kế toán") ||
    name.includes("tài chính")
  ) {
    return {
      deptCode: "FIN",
      deptName: "Phòng Tài Chính",
      badge: "💰 Tài chính",
    };
  }

  return {
    deptCode: "COMPANY",
    deptName: "Khối Văn Phòng",
    badge: "🏢 Nhân sự",
  };
}

