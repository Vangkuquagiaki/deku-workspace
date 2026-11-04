const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

const DATA_DIR = path.join(__dirname, 'seed_data');
const SERVER_ID = '9825609f-fc16-49e5-99ca-e2c204fdf8ec';
const CURRENT_CLERK_USER_ID = 'user_3JzV4FIF2w5cBBa5kDRXqS9nhGc';
const CURRENT_USER_PROFILE_ID = '0088f287-0409-4990-9b6d-6530103510b9';

function loadJson(name) {
  const filePath = path.join(DATA_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function batchInsert(model, items, batchSize = 400, label = '') {
  let inserted = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const result = await model.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    inserted += result.count;
    process.stdout.write(`  [${label}] Inserted ${Math.min(i + batchSize, items.length)}/${items.length} (new: ${result.count})\r`);
  }
  console.log(`\n  ✓ [${label}] Finished: total ${inserted} new records.`);
  return inserted;
}

async function main() {
  console.log('========================================================');
  console.log(' STARTING FULL V3 DATASET SEEDING INTO NEON POSTGRESQL');
  console.log('========================================================');

  const startTime = Date.now();

  // 1. Verify Server
  const server = await prisma.server.findUnique({
    where: { id: SERVER_ID },
  });
  if (!server) {
    throw new Error(`Server ${SERVER_ID} not found in database!`);
  }
  console.log(`✓ Target Server: "${server.name}" (${server.id})`);

  // 2. ORG UNITS (38 units: departments first, then teams)
  console.log('\n[1/12] Seeding OrgUnits...');
  const orgUnits = loadJson('org_units');
  const departments = orgUnits.filter((u) => !u.parent_id).map((u) => ({
    id: u.id,
    name: u.name,
    type: u.type,
    parentId: null,
  }));
  const teams = orgUnits.filter((u) => u.parent_id).map((u) => ({
    id: u.id,
    name: u.name,
    type: u.type,
    parentId: u.parent_id,
  }));

  await prisma.orgUnit.createMany({ data: departments, skipDuplicates: true });
  await prisma.orgUnit.createMany({ data: teams, skipDuplicates: true });
  console.log(`  ✓ Seeded ${departments.length} departments and ${teams.length} teams.`);

  // 3. PROFILES (1,280 employees)
  console.log('\n[2/12] Seeding Profiles (1,280 users)...');
  const users = loadJson('users');
  const userMap = new Map();
  for (const u of users) {
    userMap.set(u.id, u);
  }

  const existingProfiles = await prisma.profile.findMany({ select: { id: true, userId: true } });
  const existingProfileIds = new Set(existingProfiles.map((p) => p.id));
  const existingUserIds = new Set(existingProfiles.map((p) => p.userId));

  const profilesToInsert = [];
  for (const u of users) {
    if (existingProfileIds.has(u.id) || existingUserIds.has(u.id)) {
      continue;
    }
    profilesToInsert.push({
      id: u.id,
      userId: u.id,
      name: u.full_name,
      email: u.email,
      imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.full_name)}`,
      createdAt: u.created_at ? new Date(u.created_at) : new Date(),
    });
  }
  await batchInsert(prisma.profile, profilesToInsert, 400, 'Profiles');

  // 4. EMPLOYEE PROFILES (1,280 with rich personal & salary information)
  console.log('\n[3/12] Seeding EmployeeProfiles (1,280 profiles)...');
  const epData = loadJson('employee_profiles');
  const epUserToIdMap = new Map();
  for (const ep of epData) {
    epUserToIdMap.set(ep.user_id, ep.id);
  }

  const existingEPs = await prisma.employeeProfile.findMany({ select: { id: true, profileId: true } });
  const existingEPProfileIds = new Set(existingEPs.map((e) => e.profileId));

  const cities = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Cần Thơ', 'Hải Phòng'];
  const employeeProfilesToInsert = [];

  epData.forEach((ep, idx) => {
    if (existingEPProfileIds.has(ep.user_id)) {
      return;
    }

    const hiredDate = ep.hired_on ? new Date(ep.hired_on) : new Date(2022, 0, 1);
    const birthYear = hiredDate.getFullYear() - 25 - (idx % 12);
    const dob = new Date(birthYear, (idx * 3) % 12, (idx % 28) + 1);

    // Realistic compensation matrix based on tier
    let baseSalary = 16000000;
    let allowance = 2500000;
    let bonus = 4000000;

    const title = ep.job_title || '';
    if (title.includes('Giám đốc') || title.includes('Trưởng phòng') || title.includes('Phó Giám đốc')) {
      baseSalary = 52000000 + (idx % 10) * 1500000;
      allowance = 5000000;
      bonus = 15000000;
    } else if (title.includes('Tổ trưởng') || title.includes('Lead') || title.includes('Quản lý')) {
      baseSalary = 30000000 + (idx % 6) * 1000000;
      allowance = 3500000;
      bonus = 8000000;
    } else if (title.includes('Kỹ sư') || title.includes('Chuyên viên') || title.includes('Senior')) {
      baseSalary = 22000000 + (idx % 8) * 800000;
      allowance = 2800000;
      bonus = 6000000;
    } else {
      baseSalary = 14500000 + (idx % 5) * 600000;
      allowance = 2000000;
      bonus = 3000000;
    }

    const phoneSuffix = String(10000000 + ((idx * 7919) % 90000000));
    const idSuffix = String(10000000 + ((idx * 6571) % 90000000));
    const bankSuffix = String(10000000 + ((idx * 4327) % 90000000));

    employeeProfilesToInsert.push({
      id: ep.id,
      profileId: ep.user_id,
      employeeCode: ep.employee_code,
      jobTitle: ep.job_title || 'Nhân viên',
      hiredOn: hiredDate,
      employmentStatus: ep.employment_status || 'ACTIVE',
      isHr: Boolean(title.includes('Nhân sự') || ep.employee_code === 'DK0001'),
      dob,
      address: `${10 + (idx % 90)} Đường số ${1 + (idx % 20)}, ${cities[idx % cities.length]}`,
      phoneNumber: `09${phoneSuffix}`,
      idCardNumber: `0790${idSuffix}`,
      bankAccount: `1903${bankSuffix}`,
      bankName: 'Techcombank',
      baseSalary,
      allowance,
      bonus,
      insuranceSalary: baseSalary,
      createdAt: ep.created_at ? new Date(ep.created_at) : new Date(),
    });
  });

  await batchInsert(prisma.employeeProfile, employeeProfilesToInsert, 400, 'EmployeeProfiles');

  // 5. SERVER MEMBERS (Add all employees to Server 'discord-clone')
  console.log('\n[4/12] Adding all 1,280 employees to Server membership...');
  const allProfiles = await prisma.profile.findMany({ select: { id: true } });
  const existingMembers = await prisma.member.findMany({
    where: { serverId: SERVER_ID },
    select: { profileId: true },
  });
  const existingMemberProfileIds = new Set(existingMembers.map((m) => m.profileId));

  const membersToInsert = [];
  for (const p of allProfiles) {
    if (existingMemberProfileIds.has(p.id)) continue;
    membersToInsert.push({
      serverId: SERVER_ID,
      profileId: p.id,
      role: 'GUEST',
    });
  }
  await batchInsert(prisma.member, membersToInsert, 400, 'ServerMembers');

  // 6. ORG UNIT MEMBERS (1,291 links)
  console.log('\n[5/12] Seeding OrgUnitMembers (1,291 links)...');
  const oumData = loadJson('org_unit_members');
  const orgUnitMembersToInsert = oumData.map((om) => ({
    id: om.id,
    orgUnitId: om.org_unit_id,
    profileId: om.user_id,
    role: om.role || 'MEMBER',
    isPrimary: Boolean(om.is_primary),
  }));

  // Ensure current user is also in Executive Department
  const execDept = orgUnits.find((u) => u.code === 'BDH' || u.name.includes('Giám đốc'));
  if (execDept) {
    orgUnitMembersToInsert.push({
      id: 'bdh-lead-user-current',
      orgUnitId: execDept.id,
      profileId: CURRENT_USER_PROFILE_ID,
      role: 'HEAD',
      isPrimary: true,
    });
  }

  await batchInsert(prisma.orgUnitMember, orgUnitMembersToInsert, 400, 'OrgUnitMembers');

  // 7. POST CATEGORIES & POSTS (10 categories & 308 Company Bulletin posts)
  console.log('\n[6/12] Seeding Company Bulletin (10 Categories & 308 Posts)...');
  const postCategories = loadJson('post_categories');
  const postCatsToInsert = postCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }));
  await prisma.postCategory.createMany({ data: postCatsToInsert, skipDuplicates: true });

  const posts = loadJson('posts');
  const postsToInsert = posts.map((p) => ({
    id: p.id,
    categoryId: p.category_id,
    authorId: p.author_id,
    audienceOrgUnitId: p.audience_org_unit_id,
    title: p.title,
    body: p.body,
    isPinned: Boolean(p.is_pinned),
    publishedAt: p.published_at ? new Date(p.published_at) : new Date(),
  }));
  await batchInsert(prisma.post, postsToInsert, 300, 'Posts');

  // 8. MEETINGS & TRANSCRIPT SEGMENTS (596 Meetings & 4,768 Transcripts)
  console.log('\n[7/12] Seeding Meetings (596) & Transcripts (4,768)...');
  const meetings = loadJson('meetings');
  const meetingIds = new Set(meetings.map((m) => m.id));

  const meetingsToInsert = meetings.map((m) => {
    const code = `mtg-${m.id.slice(0, 4)}-${m.id.slice(9, 13)}`;
    return {
      id: m.id,
      code,
      title: m.title,
      hostId: m.organizer_id || 'system',
      status: 'ENDED',
      startedAt: m.started_at ? new Date(m.started_at) : new Date(),
      endedAt: m.ended_at ? new Date(m.ended_at) : null,
      orgUnitId: m.org_unit_id,
    };
  });
  await batchInsert(prisma.meeting, meetingsToInsert, 300, 'Meetings');

  const transcripts = loadJson('transcript_segments');
  const transcriptsToInsert = transcripts.map((t) => {
    const user = userMap.get(t.speaker_user_id);
    return {
      id: t.id,
      meetingId: t.meeting_id,
      speakerId: t.speaker_user_id,
      speakerName: user ? user.full_name : 'Nhân sự',
      lang: t.language || 'vi',
      text: t.text,
      startMs: t.start_ms || 0,
      endMs: t.end_ms || 0,
    };
  });
  await batchInsert(prisma.transcriptSegment, transcriptsToInsert, 400, 'TranscriptSegments');

  // 9. TASKS (5,552 Tasks in Lark Base)
  console.log('\n[8/12] Seeding Tasks into Lark Base (5,552 Tasks)...');
  const tasks = loadJson('tasks');
  const tasksToInsert = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status || 'TODO',
    priority: t.priority || 'MEDIUM',
    orgUnitId: t.org_unit_id,
    assigneeId: t.assignee_id,
    assigneeName: t.assignee_name,
    dueDate: t.due_at ? new Date(t.due_at) : null,
    deadlineText: t.deadline_text,
    evidenceText: t.evidence_text,
    isHumanConfirmed: Boolean(t.is_human_confirmed),
    meetingId: meetingIds.has(t.source_meeting_id) ? t.source_meeting_id : null,
    createdAt: t.created_at ? new Date(t.created_at) : new Date(),
    updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
  }));
  await batchInsert(prisma.task, tasksToInsert, 400, 'Tasks');

  // 10. ATTENDANCE RECORDS (7,304 Attendance Records)
  console.log('\n[9/12] Seeding Attendance Records (7,304 records)...');
  const attendance = loadJson('attendance_records');
  const attToInsert = [];
  for (const a of attendance) {
    const epId = epUserToIdMap.get(a.user_id);
    if (!epId) continue;

    let mStr = a.month;
    if (mStr.length === 7) mStr = `${mStr}-01`;
    const mDate = new Date(mStr);

    attToInsert.push({
      id: a.id,
      employeeProfileId: epId,
      month: mDate,
      workedDays: Number(a.worked_days) || 0,
      source: 'CSV',
    });
  }
  await batchInsert(prisma.attendanceRecord, attToInsert, 400, 'AttendanceRecords');

  // 11. LEAVE POLICIES & LEAVE REQUESTS (4 Policies & 1,329 Requests)
  console.log('\n[10/12] Seeding Leave Policies & Requests (1,329)...');
  const leavePolicies = loadJson('leave_policies');
  const polsToInsert = leavePolicies.map((p) => ({
    id: p.id,
    name: p.name,
    code: p.code,
    defaultDays: Number(p.annual_days) || 12,
    isPaid: true,
  }));
  await prisma.leavePolicy.createMany({ data: polsToInsert, skipDuplicates: true });

  const leaveRequests = loadJson('leave_requests');
  const leaveReqsToInsert = [];
  for (const lr of leaveRequests) {
    const epId = epUserToIdMap.get(lr.user_id);
    if (!epId) continue;

    leaveReqsToInsert.push({
      id: lr.id,
      employeeProfileId: epId,
      policyId: lr.policy_id,
      startDate: lr.start_date ? new Date(lr.start_date) : new Date(),
      endDate: lr.end_date ? new Date(lr.end_date) : new Date(),
      daysCount: Number(lr.requested_days) || 1,
      reason: `Nghỉ phép cá nhân theo quy định công ty (${lr.reason_category || 'PERSONAL'})`,
      status: lr.status || 'APPROVED',
      session: lr.portion === 'HALF_AM' ? 'MORNING' : lr.portion === 'HALF_PM' ? 'AFTERNOON' : 'FULL_DAY',
    });
  }
  await batchInsert(prisma.leaveRequest, leaveReqsToInsert, 400, 'LeaveRequests');

  // 12. ENTERPRISE THREADS (80 Topics & 1,500 Posts)
  console.log('\n[11/12] Seeding Enterprise Threads (Topics & Posts)...');
  const topics = loadJson('social_topics');
  const topicsToInsert = topics.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug || t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));
  await prisma.socialTopic.createMany({ data: topicsToInsert, skipDuplicates: true });

  const socialPosts = loadJson('social_posts');
  const socialPostsToInsert = socialPosts.map((sp) => {
    const author = userMap.get(sp.author_id);
    return {
      id: sp.id,
      authorId: sp.author_id,
      authorName: author ? author.full_name : 'Nhân sự',
      audience: sp.audience || 'COMPANY',
      postType: sp.post_type || 'TEXT',
      status: sp.status || 'PUBLISHED',
      body: sp.body,
      sourceMeetingId: sp.source_meeting_id,
      likesCount: Number(sp.likes_count) || 0,
      repliesCount: Number(sp.replies_count) || 0,
      createdAt: sp.created_at ? new Date(sp.created_at) : new Date(),
      updatedAt: sp.created_at ? new Date(sp.created_at) : new Date(),
    };
  });
  await batchInsert(prisma.socialPost, socialPostsToInsert, 400, 'SocialPosts');

  // 13. Ensure key channels exist for departments
  console.log('\n[12/12] Ensuring department channels exist in server...');
  const keyDepts = orgUnits.filter((u) => !u.parent_id).slice(0, 10);
  const existingChannels = await prisma.channel.findMany({
    where: { serverId: SERVER_ID },
    select: { name: true },
  });
  const existingChannelNames = new Set(existingChannels.map((c) => c.name.toLowerCase()));

  const channelsToCreate = [];
  for (const dept of keyDepts) {
    const channelName = dept.code.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (!existingChannelNames.has(channelName)) {
      channelsToCreate.push({
        name: channelName,
        type: 'TEXT',
        serverId: SERVER_ID,
        profileId: CURRENT_USER_PROFILE_ID,
        orgUnitId: dept.id,
      });
      existingChannelNames.add(channelName);
    }
  }
  if (channelsToCreate.length > 0) {
    await prisma.channel.createMany({ data: channelsToCreate, skipDuplicates: true });
    console.log(`  ✓ Created ${channelsToCreate.length} department discussion channels.`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n========================================================');
  console.log(` SEEDING COMPLETED SUCCESSFULLY IN ${durationSec}s!`);
  console.log('========================================================');
}

main()
  .catch((e) => {
    console.error('\n❌ SEEDING FAILED WITH ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

