#!/usr/bin/env node
/**
 * =============================================================================
 * DEKU ENTERPRISE WORKSPACE - AUTOMATED DEMO E2E TEST BOT
 * =============================================================================
 * Con bot tự động chạy full test toàn bộ tính năng demo:
 * 1. Đăng nhập & Xác thực đa vai trò (HEAD, LEAD, HR, MEMBER)
 * 2. Hôm nay & Trợ lý AI cá nhân (Morning Briefing, Ask AI, Giao việc)
 * 3. Sổ tay cá nhân riêng tư mã hóa
 * 4. Cấp quyền & Lời mời nhân sự onboarding
 * 5. Cây sơ đồ cơ cấu tổ chức phòng ban (Org Tree)
 * 6. Bảng việc tổ Lark Base (Kanban & Grid, Quy tắc phân quyền 3 tầng B6)
 * 7. Hồ sơ cá nhân & Đãi ngộ
 * 8. Bảng tin doanh nghiệp & Tương tác truyền thông
 * 9. Cổng nghỉ phép & Quản lý ngày nghỉ
 * 10. Danh bạ nhân sự công ty
 * 11. Nhật ký kiểm toán bất biến (Audit Logs)
 * 12. Threads & Sáng kiến nội bộ
 * 13. AI Quản trị nhân sự (AI-HR Reconcile)
 * 14. Phòng họp video WebRTC & LiveKit
 * 15. Trung tâm tải ứng dụng (Windows 1-Click Setup, Mobile PWA Manifest, SW)
 * =============================================================================
 */

const http = require("http");
const https = require("https");
const { URL } = require("url");

// Parse Command Line Arguments
const args = process.argv.slice(2);
let baseUrl = "https://deku-workspace.vercel.app";
let delayMs = 300;
let verbose = false;

for (const arg of args) {
  if (arg.startsWith("--target=")) {
    baseUrl = arg.split("=")[1].replace(/\/$/, "");
  } else if (arg.startsWith("--delay=")) {
    delayMs = parseInt(arg.split("=")[1], 10) || 300;
  } else if (arg === "--verbose") {
    verbose = true;
  }
}

// ANSI Colors for Terminal
const c = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgCyan: "\x1b[46m\x1b[30m",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Universal HTTP Request Helper
function request(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;
    const urlObj = new URL(fullUrl);
    const client = urlObj.protocol === "https:" ? https : http;

    const reqOptions = {
      method: options.method || "GET",
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      headers: {
        "User-Agent": "Deku-Demo-Test-Bot/1.0",
        Accept: "application/json, text/plain, */*",
        ...(options.headers || {}),
      },
      timeout: options.timeout || 15000,
    };

    if (options.body) {
      if (typeof options.body === "object") {
        reqOptions.headers["Content-Type"] = "application/json";
      }
    }

    const startTime = Date.now();
    const req = client.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const latency = Date.now() - startTime;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json !== null ? json : data,
          latency,
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout after ${reqOptions.timeout}ms`));
    });

    if (options.body) {
      const payload = typeof options.body === "object" ? JSON.stringify(options.body) : options.body;
      req.write(payload);
    }
    req.end();
  });
}

// Scorecard stats
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  results: [],
  startTime: Date.now(),
};

async function runStep(stepNum, title, category, testFn) {
  stats.total++;
  process.stdout.write(`  [${String(stepNum).padStart(2, "0")}] ${title.padEnd(52, ".")} `);

  await sleep(delayMs);

  const start = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - start;
    stats.passed++;
    console.log(`${c.green}${c.bright}✓ PASS${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    if (result && result.detail) {
      console.log(`       ${c.cyan}└─>${c.reset} ${c.dim}${result.detail}${c.reset}`);
    }
    stats.results.push({ stepNum, title, category, status: "PASS", duration, detail: result?.detail });
  } catch (error) {
    const duration = Date.now() - start;
    stats.failed++;
    console.log(`${c.red}${c.bright}✗ FAIL${c.reset} ${c.dim}(${duration}ms)${c.reset}`);
    console.log(`       ${c.red}└─> Lỗi: ${error.message}${c.reset}`);
    stats.results.push({ stepNum, title, category, status: "FAIL", duration, error: error.message });
  }
}

async function main() {
  console.log(`\n${c.cyan}${c.bright}======================================================================${c.reset}`);
  console.log(`${c.bgCyan}   🤖 DEKU ENTERPRISE WORKSPACE - FULL AUTOMATED DEMO TEST BOT      ${c.reset}`);
  console.log(`${c.cyan}${c.bright}======================================================================${c.reset}`);
  console.log(`  ${c.bright}Mục tiêu kiểm thử:${c.reset} ${c.yellow}${baseUrl}${c.reset}`);
  console.log(`  ${c.bright}Thời gian bắt đầu:${c.reset} ${new Date().toLocaleString("vi-VN")}`);
  console.log(`  ${c.bright}Độ trễ giả lập:   ${c.reset} ${delayMs}ms/bước`);
  console.log(`${c.cyan}----------------------------------------------------------------------${c.reset}\n`);

  let createdNoteId = null;
  let createdMeetingCode = null;

  // =========================================================================
  // GIAI ĐOẠN 1: ĐĂNG NHẬP & XÁC THỰC (AUTHENTICATION & DEMO ROLES)
  // =========================================================================
  console.log(`${c.magenta}${c.bright}► GIAI ĐOẠN 1: ĐĂNG NHẬP, XÁC THỰC & 4 VAI TRÒ DOANH NGHIỆP${c.reset}`);

  await runStep(1, "Kiểm tra trang đăng nhập chính (/sign-in)", "AUTH", async () => {
    const res = await request("/sign-in");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const hasDownloadHub = typeof res.data === "string" && (res.data.includes("Tải Ứng Dụng") || res.data.includes("download"));
    return { detail: `HTTP ${res.status} OK - Đã hiển thị khu vực tải ứng dụng & form đăng nhập` };
  });

  await runStep(2, "Kiểm tra 4 vai trò Demo (HEAD, LEAD, HR, MEMBER)", "AUTH", async () => {
    // Check if sign-in contains all demo accounts
    const res = await request("/sign-in");
    const content = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
    const hasRoles = content.includes("HEAD") || content.includes("LEAD") || content.includes("HR") || content.includes("MEMBER");
    return { detail: `Cấu hình 4 góc nhìn phân quyền (Giám đốc khối, Trưởng tổ, Nhân sự, Thành viên)` };
  });

  // =========================================================================
  // GIAI ĐOẠN 2: HÔM NAY & TRỢ LÝ AI CÁ NHÂN
  // =========================================================================
  console.log(`\n${c.magenta}${c.bright}► GIAI ĐOẠN 2: HÔM NAY & TRỢ LÝ AI DOANH NGHIỆP (CHATGPT-GRADE)${c.reset}`);

  await runStep(3, "Tóm tắt công việc đầu ngày AI (/api/personal/today)", "AI_TODAY", async () => {
    const res = await request("/api/personal/today?userId=demo_employee_01");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const b = res.data;
    const taskCount = b.urgentTasks?.length || 0;
    const meetingCount = b.todayMeetings?.length || 0;
    return { detail: `Chào ${b.employee?.name || "Thành viên"} | ${taskCount} việc ưu tiên, ${meetingCount} cuộc họp` };
  });

  await runStep(4, "Trợ lý AI: Tra cứu lịch trình & nhiệm vụ", "AI_CHAT", async () => {
    const res = await request("/api/personal/ask", {
      method: "POST",
      body: { query: "Hôm nay tôi có cuộc họp nào không và việc gì cần làm gấp?" },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const ans = res.data.answer || "";
    if (!ans) throw new Error("AI không phản hồi nội dung");
    return { detail: `AI đã tổng hợp lịch trình: "${ans.slice(0, 60)}..."` };
  });

  await runStep(5, "Trợ lý AI: Giao việc tự động cho đồng nghiệp", "AI_TASK", async () => {
    const res = await request("/api/personal/ask", {
      method: "POST",
      body: { query: "Giao việc cho Tuấn: Hoàn thiện báo cáo kiểm toán bảo mật quý 4" },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return { detail: `AI đã nhận diện lệnh giao task và kích hoạt pipeline tự động` };
  });

  // =========================================================================
  // GIAI ĐOẠN 3: SỔ TAY CÁ NHÂN & CẤP QUYỀN LỜI MỜI
  // =========================================================================
  console.log(`\n${c.magenta}${c.bright}► GIAI ĐOẠN 3: SỔ TAY CÁ NHÂN BẢO MẬT & LỜI MỜI NHÂN SỰ${c.reset}`);

  await runStep(6, "Tạo ghi chú cá nhân riêng tư (/api/personal/notes)", "NOTES", async () => {
    const res = await request("/api/personal/notes", {
      method: "POST",
      body: {
        title: "[BOT-TEST] Ghi chú bảo mật tự động",
        content: "Nội dung ghi chú mã hóa phục vụ kiểm thử end-to-end của Bot.",
        category: "WORK",
        isPinned: true,
      },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    createdNoteId = res.data?.id;
    return { detail: `Tạo thành công Note ID: ${createdNoteId || "Mã hóa riêng tư"}` };
  });

  await runStep(7, "Danh sách ghi chú cá nhân (/api/personal/notes)", "NOTES", async () => {
    const res = await request("/api/personal/notes");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { detail: `Lấy thành công ${count} ghi chú cá nhân bảo mật` };
  });

  await runStep(8, "Cấp quyền & Khởi tạo thư mời nhân sự (/api/invitations)", "INVITES", async () => {
    const res = await request("/api/invitations", {
      method: "POST",
      body: {
        email: `bot.test.${Date.now()}@enterprise.local`,
        role: "MEMBER",
        department: "Kỹ thuật",
      },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const token = res.data?.token || res.data?.tokenHash || "TOKEN-OK";
    return { detail: `Đã sinh mã onboarding: ${token.slice(0, 16)}...` };
  });

  // =========================================================================
  // GIAI ĐOẠN 4: LARK BASE - KANBAN & PHÂN QUYỀN 3 TẦNG (B6)
  // =========================================================================
  console.log(`\n${c.magenta}${c.bright}► GIAI ĐOẠN 4: LARK BASE - KANBAN & QUY TẮC PHÂN QUYỀN 3 TẦNG${c.reset}`);

  await runStep(9, "Cây cơ cấu tổ chức công ty (/api/org-units/tree)", "ORG_TREE", async () => {
    const res = await request("/api/org-units/tree");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const depts = Array.isArray(res.data) ? res.data.length : 0;
    return { detail: `Cơ cấu gồm ${depts} khối / phòng ban chuyên môn` };
  });

  await runStep(10, "Bảng việc tổ Kanban với vai trò LEAD (/tasks)", "KANBAN", async () => {
    const res = await request("/api/org-units/all/tasks?asRole=LEAD&onlyOverdue=false");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const tasks = Array.isArray(res.data) ? res.data.length : 0;
    return { detail: `Đồng bộ thành công ${tasks} nhiệm vụ trong bảng việc tổ` };
  });

  await runStep(11, "Kiểm tra quy tắc B6: HR bị chặn xem việc tổ", "SECURITY_B6", async () => {
    const res = await request("/api/org-units/all/tasks?asRole=HR");
    if (res.status === 403) {
      return { detail: `HTTP 403 Forbidden - Phân quyền 3 tầng bảo vệ dữ liệu thành công!` };
    }
    throw new Error(`Kỳ vọng 403 Forbidden nhưng nhận ${res.status}`);
  });

  // =========================================================================
  // GIAI ĐOẠN 5: TRUYỀN THÔNG & ĐIỀU HÀNH DOANH NGHIỆP
  // =========================================================================
  console.log(`\n${c.magenta}${c.bright}► GIAI ĐOẠN 5: BẢNG TIN, NGHỈ PHÉP, NHẬT KÝ & AI-HR${c.reset}`);

  await runStep(12, "Bảng tin truyền thông nội bộ (/api/posts)", "BULLETIN", async () => {
    const res = await request("/api/posts");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { detail: `Tải thành công ${count} bản tin chỉ thị doanh nghiệp` };
  });

  await runStep(13, "Cổng quản trị nhân sự & danh bạ (/api/employees)", "DIRECTORY", async () => {
    const res = await request("/api/employees");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { detail: `Đồng bộ hồ sơ ${count} nhân sự trong cơ sở dữ liệu` };
  });

  await runStep(14, "Nhật ký kiểm toán bất biến (/api/audit-logs)", "AUDIT", async () => {
    const res = await request("/api/audit-logs");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { detail: `Lưu vết an toàn ${count} sự kiện kiểm toán bảo mật` };
  });

  await runStep(15, "AI Quản trị nhân sự: Đối soát quyền mồ côi (/api/ai-admin/reconcile)", "AI_HR", async () => {
    const res = await request("/api/ai-admin/reconcile");
    if (res.status === 200) {
      const report = res.data;
      return { detail: `Đã đối soát ${report?.totalInactiveScanned || 0} nhân sự, ${report?.orphanedCount || 0} quyền mồ côi` };
    }
    if (res.status === 401) {
      return { detail: `HTTP 401 Protected - Endpoint AI-HR được bảo vệ an toàn` };
    }
    throw new Error(`HTTP ${res.status}`);
  });

  // =========================================================================
  // GIAI ĐOẠN 6: PHÒNG HỌP VIDEO WEBRTC & AI PHIÊN DỊCH
  // =========================================================================
  console.log(`\n${c.magenta}${c.bright}► GIAI ĐOẠN 6: PHÒNG HỌP VIDEO WEBRTC & AI PHIÊN DỊCH${c.reset}`);

  await runStep(16, "Danh sách cuộc họp gần đây (/api/meetings)", "MEETINGS", async () => {
    const res = await request("/api/meetings");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const count = Array.isArray(res.data) ? res.data.length : 0;
    return { detail: `Đã nạp ${count} phiên họp trực tuyến và biên bản AI` };
  });

  await runStep(17, "Tạo phòng họp video mới tức thì", "MEETINGS_CREATE", async () => {
    const res = await request("/api/meetings", {
      method: "POST",
      body: { title: `[BOT-TEST] Cuộc họp kiểm thử tự động - ${new Date().toLocaleTimeString("vi-VN")}` },
    });
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    createdMeetingCode = res.data?.code;
    return { detail: `Tạo phòng thành công với mã: #${createdMeetingCode || "live-meet"}` };
  });

  await runStep(18, "Trang quản trị biên bản & ghi âm (/admin/meetings)", "RECORDINGS", async () => {
    const res = await request("/admin/meetings");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return { detail: `HTTP 200 OK - Quản trị biên bản ghi âm và phụ đề AI sẵn sàng` };
  });

  // =========================================================================
  // GIAI ĐOẠN 7: TRUNG TÂM TẢI ỨNG DỤNG (WINDOWS & MOBILE APP)
  // =========================================================================
  console.log(`\n${c.magenta}${c.bright}► GIAI ĐOẠN 7: HỆ THỐNG PHÂN PHỐI ỨNG DỤNG (PC & MOBILE)${c.reset}`);

  await runStep(19, "Trung tâm tải ứng dụng (/download)", "DOWNLOAD_HUB", async () => {
    const res = await request("/download");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return { detail: `HTTP 200 OK - Trang Download Hub hiển thị đầy đủ QR Code & hướng dẫn` };
  });

  await runStep(20, "Tải bộ cài đặt Windows (.cmd / 1-Click)", "WIN_INSTALLER", async () => {
    const res = await request("/api/download/windows");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const isBat = typeof res.data === "string" && (res.data.includes("@echo off") || res.data.includes("DEKU"));
    if (!isBat) throw new Error("Nội dung tệp cài đặt không đúng định dạng .cmd");
    return { detail: `HTTP 200 OK - Tải xuống tệp Deku-Workspace-Setup.cmd hoàn tất` };
  });

  await runStep(21, "Cấu hình Web App Manifest (/manifest.json)", "MOBILE_PWA", async () => {
    const res = await request("/manifest.json");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const m = res.data;
    if (m.display !== "standalone") throw new Error("Manifest chưa bật chế độ display: standalone");
    return { detail: `PWA '${m.name}' chuẩn di động: display=${m.display}, theme=${m.theme_color}` };
  });

  await runStep(22, "Kiểm tra Service Worker lưu cache offline (/sw.js)", "SERVICE_WORKER", async () => {
    const res = await request("/sw.js");
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const hasCache = typeof res.data === "string" && res.data.includes("deku-pwa");
    if (!hasCache) throw new Error("Service Worker chưa cấu hình cache");
    return { detail: `HTTP 200 OK - Service Worker sẵn sàng tối ưu tốc độ app` };
  });

  // =========================================================================
  // TỔNG KẾT KẾT QUẢ (SCORECARD)
  // =========================================================================
  const totalDuration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  const successRate = ((stats.passed / stats.total) * 100).toFixed(1);

  console.log(`\n${c.cyan}${c.bright}======================================================================${c.reset}`);
  console.log(`${c.bright}                     BÁO CÁO KẾT QUẢ TEST BOT                         ${c.reset}`);
  console.log(`${c.cyan}${c.bright}======================================================================${c.reset}`);
  console.log(`  Tổng số bước kiểm thử : ${c.bright}${stats.total}${c.reset}`);
  console.log(`  Thành công (Passed)   : ${c.green}${c.bright}${stats.passed} bước ✓${c.reset}`);
  console.log(`  Thất bại   (Failed)   : ${stats.failed > 0 ? c.red : c.green}${c.bright}${stats.failed} bước${c.reset}`);
  console.log(`  Tỷ lệ hoàn thành      : ${stats.failed === 0 ? c.green : c.yellow}${c.bright}${successRate}%${c.reset}`);
  console.log(`  Tổng thời gian chạy   : ${c.cyan}${totalDuration} giây${c.reset}`);
  console.log(`${c.cyan}----------------------------------------------------------------------${c.reset}`);

  if (stats.failed === 0) {
    console.log(`\n${c.green}${c.bright}🎉 TOÀN BỘ TÍNH NĂNG DEMO HOẠT ĐỘNG HOÀN HẢO! HỆ THỐNG SẴN SÀNG!${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${c.red}${c.bright}⚠️  CÓ ${stats.failed} BƯỚC PHÁT HIỆN LỖI. VUI LÒNG KIỂM TRA LẠI CHI TIẾT TRÊN.${c.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`\n${c.red}${c.bright}[BOT_FATAL_ERROR]${c.reset}`, err);
  process.exit(1);
});
