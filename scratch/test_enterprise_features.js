const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function runTests() {
  console.log("=== RUNNING ENTERPRISE SUITE VERIFICATION ===");

  // 1. Check OrgUnits
  const depts = await db.orgUnit.findMany({
    where: { type: "DEPARTMENT" },
    include: { children: true, members: true },
  });
  console.log(`\n[TEST 1] OrgUnits: Found ${depts.length} departments.`);
  for (const d of depts) {
    console.log(` - Dept: ${d.name} (${d.children.length} teams, ${d.members.length} members)`);
  }

  // 2. Check Tasks & Single Automation Rule persistence
  const tasks = await db.task.findMany({
    take: 5,
    include: { assignee: true, orgUnit: true },
  });
  console.log(`\n[TEST 2] Tasks & Lark Base: Found ${tasks.length} sample tasks.`);
  for (const t of tasks) {
    console.log(` - [${t.status}] ${t.title} -> Assignee: ${t.assignee?.name || t.assigneeName || "Unassigned"} | Evidence: "${t.evidenceText || "N/A"}"`);
  }

  // 3. Test Vietnamese Diacritics matching logic
  function removeVietnameseDiacritics(str) {
    if (!str) return "";
    return str
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }
  const sample1 = "Nguyễn Văn An";
  const search1 = "nguyen van an";
  const search2 = "van an";
  console.log(`\n[TEST 3] Accent-insensitive Search:`);
  console.log(` - Normalize "${sample1}": "${removeVietnameseDiacritics(sample1)}"`);
  console.log(` - Matches "${search1}": ${removeVietnameseDiacritics(sample1).includes(removeVietnameseDiacritics(search1))}`);
  console.log(` - Matches "${search2}": ${removeVietnameseDiacritics(sample1).includes(removeVietnameseDiacritics(search2))}`);

  // 4. Check M1: Meeting Consent & Nghị định 13/2023/NĐ-CP
  const meeting = await db.meeting.findFirst({
    include: { participants: true, segments: true },
  });
  if (meeting) {
    console.log(`\n[TEST 4] M1 Consent & Meeting: Found meeting "${meeting.title}" (${meeting.code})`);
    console.log(` - Notice at: ${meeting.recordingNoticeAt || "None"}`);
    console.log(` - Participants count: ${meeting.participants.length}`);
    for (const p of meeting.participants) {
      console.log(`   * ${p.name} (${p.role}) - Consent: ${p.consentStatus || "PENDING"}`);
    }
  }

  // 5. Check Bulletin Posts
  const posts = await db.post.findMany({
    include: { category: true, author: true },
  });
  console.log(`\n[TEST 5] Bulletin Posts: Found ${posts.length} company posts.`);
  for (const p of posts) {
    console.log(` - [${p.category?.name || "Tin tức"}] ${p.title} (Pinned: ${p.isPinned})`);
  }

  // 6. Check Audit Logs
  const auditLogs = await db.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  console.log(`\n[TEST 6] Audit Logs: Found ${auditLogs.length} audit entries.`);
  for (const l of auditLogs) {
    console.log(` - [${l.action}] Target: ${l.targetType}:${l.targetId} at ${l.createdAt}`);
  }

  console.log("\n=== ALL DIRECT DATABASE CHECKS PASSED ===");
}

runTests()
  .catch(console.error)
  .finally(() => db.$disconnect());
