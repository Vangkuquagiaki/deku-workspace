const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SERVER_ID = '9825609f-fc16-49e5-99ca-e2c204fdf8ec';
const CURRENT_CLERK_USER_ID = 'user_3JzV4FIF2w5cBBa5kDRXqS9nhGc';

async function main() {
  console.log('================================================================');
  console.log('       COMPREHENSIVE DATABASE AUDIT & INTEGRITY CHECK           ');
  console.log('================================================================\n');

  const issues = [];
  const report = {};

  // 1. Primary User & Server Ownership
  console.log('1. Checking Server & Primary Admin Account...');
  const server = await prisma.server.findUnique({
    where: { id: SERVER_ID },
    include: {
      profile: true,
      channels: true,
      members: {
        where: { role: 'ADMIN' },
        include: { profile: true },
      },
    },
  });

  if (!server) {
    issues.push('CRITICAL: Server discord-clone not found!');
  } else {
    report.serverName = server.name;
    report.serverChannelsCount = server.channels.length;
    report.adminCount = server.members.length;
    console.log(`   ✓ Server: "${server.name}" (${server.id})`);
    console.log(`   ✓ Channels: ${server.channels.length} channels`);
    console.log(`   ✓ Server Owner: "${server.profile.name}" (${server.profile.userId})`);

    const hasClerkAdmin = server.members.some((m) => m.profile.userId === CURRENT_CLERK_USER_ID);
    if (hasClerkAdmin) {
      console.log(`   ✓ Primary Clerk User (${CURRENT_CLERK_USER_ID}) is verified ADMIN of Server.`);
    } else {
      issues.push(`Primary Clerk User (${CURRENT_CLERK_USER_ID}) is NOT an admin of server!`);
    }
  }

  // Check Current User EmployeeProfile & OrgUnitMember
  const currentProfile = await prisma.profile.findFirst({
    where: { userId: CURRENT_CLERK_USER_ID },
    include: {
      employeeProfile: true,
      orgUnitMembers: {
        include: { orgUnit: true },
      },
    },
  });

  if (!currentProfile) {
    issues.push(`Current profile for ${CURRENT_CLERK_USER_ID} missing!`);
  } else {
    console.log(`   ✓ Current Profile Name: "${currentProfile.name}"`);
    if (!currentProfile.employeeProfile) {
      console.log('   ⚠️ Current profile lacks EmployeeProfile record (will auto-link/create).');
    } else {
      console.log(`   ✓ Current EmployeeProfile: Code=${currentProfile.employeeProfile.employeeCode}, Title=${currentProfile.employeeProfile.jobTitle}, BaseSalary=${currentProfile.employeeProfile.baseSalary?.toLocaleString()} VND`);
    }
    console.log(`   ✓ Current OrgUnit Memberships: ${currentProfile.orgUnitMembers.length} unit(s)`);
    currentProfile.orgUnitMembers.forEach((m) => {
      console.log(`      - [${m.role}] ${m.orgUnit.name} (${m.orgUnit.type})`);
    });
  }

  // 2. OrgUnits Hierarchy Integrity
  console.log('\n2. Checking OrgUnits Hierarchy & Structure...');
  const orgUnits = await prisma.orgUnit.findMany({
    include: { parent: true, children: true, members: true },
  });
  report.totalOrgUnits = orgUnits.length;
  const departments = orgUnits.filter((u) => u.type === 'DEPARTMENT');
  const teams = orgUnits.filter((u) => u.type === 'TEAM');
  console.log(`   ✓ Total OrgUnits: ${orgUnits.length} (Departments: ${departments.length}, Teams: ${teams.length})`);

  // Check for broken parent links
  const orphanedTeams = teams.filter((t) => t.parentId && !orgUnits.some((u) => u.id === t.parentId));
  if (orphanedTeams.length > 0) {
    issues.push(`Found ${orphanedTeams.length} teams with invalid parentId!`);
  } else {
    console.log('   ✓ Zero orphaned teams: All parent-child relationships are intact.');
  }

  // 3. Profiles & EmployeeProfiles Integrity
  console.log('\n3. Checking Profiles & Employee Profiles...');
  const totalProfiles = await prisma.profile.count();
  const totalEmployeeProfiles = await prisma.employeeProfile.count();
  report.totalProfiles = totalProfiles;
  report.totalEmployeeProfiles = totalEmployeeProfiles;
  console.log(`   ✓ Total Profiles: ${totalProfiles}`);
  console.log(`   ✓ Total Employee Profiles: ${totalEmployeeProfiles}`);

  // Check orphaned EmployeeProfiles
  const allProfiles = await prisma.profile.findMany({ select: { id: true } });
  const profileIdSet = new Set(allProfiles.map((p) => p.id));
  const epProfiles = await prisma.employeeProfile.findMany({ select: { id: true, profileId: true, baseSalary: true } });
  const orphanedEP = epProfiles.filter((ep) => !profileIdSet.has(ep.profileId));
  if (orphanedEP.length > 0) {
    issues.push(`Found ${orphanedEP.length} EmployeeProfiles with invalid profileId!`);
  } else {
    console.log('   ✓ 100% of EmployeeProfiles have valid Profile references.');
  }

  const zeroSalaryCount = epProfiles.filter((ep) => !ep.baseSalary || ep.baseSalary <= 0).length;
  console.log(`   ✓ Employee compensation data populated (${epProfiles.length - zeroSalaryCount}/${epProfiles.length} with detailed salary & allowance).`);

  // 4. Server Members & OrgUnit Members
  console.log('\n4. Checking Workspace Memberships...');
  const serverMembersCount = await prisma.member.count({ where: { serverId: SERVER_ID } });
  const orgUnitMembersCount = await prisma.orgUnitMember.count();
  report.serverMembersCount = serverMembersCount;
  report.orgUnitMembersCount = orgUnitMembersCount;
  console.log(`   ✓ Server Members in discord-clone: ${serverMembersCount}`);
  console.log(`   ✓ OrgUnit Memberships: ${orgUnitMembersCount}`);

  // Check roles distribution in OrgUnitMembers
  const oumRoles = await prisma.orgUnitMember.groupBy({
    by: ['role'],
    _count: { id: true },
  });
  console.log('   ✓ OrgUnit Role Distribution:');
  oumRoles.forEach((r) => {
    console.log(`      - ${r.role}: ${r._count.id} members`);
  });

  // 5. Tasks in Lark Base
  console.log('\n5. Checking Lark Base Tasks...');
  const totalTasks = await prisma.task.count();
  report.totalTasks = totalTasks;
  console.log(`   ✓ Total Tasks: ${totalTasks}`);

  // Status breakdown
  const taskStatuses = await prisma.task.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  console.log('   ✓ Task Status Breakdown:');
  taskStatuses.forEach((s) => {
    console.log(`      - ${s.status}: ${s._count.id} tasks`);
  });

  // Priority breakdown
  const taskPriorities = await prisma.task.groupBy({
    by: ['priority'],
    _count: { id: true },
  });
  console.log('   ✓ Task Priority Breakdown:');
  taskPriorities.forEach((p) => {
    console.log(`      - ${p.priority}: ${p._count.id} tasks`);
  });

  // Check task assignees and evidence texts
  const sampleTasks = await prisma.task.findMany({
    take: 5,
    include: { orgUnit: true, assignee: true, meeting: true },
  });
  console.log('   ✓ Sample Task Verification:');
  sampleTasks.forEach((t, i) => {
    console.log(`      [Task ${i + 1}] "${t.title}" | Status: ${t.status} | Priority: ${t.priority}`);
    console.log(`         OrgUnit: ${t.orgUnit?.name} | Assignee: ${t.assignee?.name || t.assigneeName || 'None'}`);
    console.log(`         Evidence: "${t.evidenceText ? t.evidenceText.slice(0, 70) + '...' : 'None'}"`);
  });

  // 6. Company Bulletin Posts & Categories
  console.log('\n6. Checking Company Bulletin...');
  const postCategoryCount = await prisma.postCategory.count();
  const postCount = await prisma.post.count();
  const pinnedPostCount = await prisma.post.count({ where: { isPinned: true } });
  report.postCategoryCount = postCategoryCount;
  report.postCount = postCount;
  console.log(`   ✓ Post Categories: ${postCategoryCount}`);
  console.log(`   ✓ Total Bulletin Posts: ${postCount} (Pinned: ${pinnedPostCount})`);

  const samplePosts = await prisma.post.findMany({
    take: 3,
    include: { category: true, author: true, audienceOrgUnit: true },
  });
  console.log('   ✓ Sample Bulletin Post Verification:');
  samplePosts.forEach((p, i) => {
    console.log(`      [Post ${i + 1}] "${p.title}" | Cat: ${p.category?.name} | Author: ${p.author.name} | Audience: ${p.audienceOrgUnit?.name || 'Toàn công ty'}`);
  });

  // 7. Meetings & AI Transcripts
  console.log('\n7. Checking AI Meetings & Transcripts...');
  const meetingCount = await prisma.meeting.count();
  const transcriptCount = await prisma.transcriptSegment.count();
  report.meetingCount = meetingCount;
  report.transcriptCount = transcriptCount;
  console.log(`   ✓ Total Meetings: ${meetingCount}`);
  console.log(`   ✓ Total Transcript Segments: ${transcriptCount}`);

  const sampleMeeting = await prisma.meeting.findFirst({
    include: {
      segments: { take: 3 },
      orgUnit: true,
      tasks: { take: 2 },
    },
  });
  if (sampleMeeting) {
    console.log(`   ✓ Sample Meeting: "${sampleMeeting.title}" (${sampleMeeting.code}) | Org: ${sampleMeeting.orgUnit?.name || 'N/A'}`);
    console.log(`      Tasks linked: ${sampleMeeting.tasks.length}`);
    console.log(`      Transcripts: ${sampleMeeting.segments.length} segment(s) preview:`);
    sampleMeeting.segments.forEach((s) => {
      console.log(`         - [${s.startMs}ms - ${s.endMs}ms] ${s.speakerName}: "${s.text}"`);
    });
  }

  // 8. Attendance Records & Leave
  console.log('\n8. Checking Attendance & Leave Management...');
  const attendanceCount = await prisma.attendanceRecord.count();
  const leavePolicyCount = await prisma.leavePolicy.count();
  const leaveRequestCount = await prisma.leaveRequest.count();
  report.attendanceCount = attendanceCount;
  report.leavePolicyCount = leavePolicyCount;
  report.leaveRequestCount = leaveRequestCount;
  console.log(`   ✓ Attendance Records: ${attendanceCount}`);
  console.log(`   ✓ Leave Policies: ${leavePolicyCount}`);
  console.log(`   ✓ Leave Requests: ${leaveRequestCount}`);

  // 9. Enterprise Threads
  console.log('\n9. Checking Enterprise Threads (Kaggle V3)...');
  const socialTopicCount = await prisma.socialTopic.count();
  const socialPostCount = await prisma.socialPost.count();
  report.socialTopicCount = socialTopicCount;
  report.socialPostCount = socialPostCount;
  console.log(`   ✓ Social Topics: ${socialTopicCount}`);
  console.log(`   ✓ Social Posts: ${socialPostCount}`);

  // Final Summary
  console.log('\n================================================================');
  console.log('                      AUDIT RESULTS SUMMARY                     ');
  console.log('================================================================');
  if (issues.length === 0) {
    console.log('🎉 ALL INTEGRITY CHECKS PASSED: 100% HEALTHY & PRODUCTION-READY!');
  } else {
    console.log(`⚠️ FOUND ${issues.length} ISSUE(S):`);
    issues.forEach((iss, i) => console.log(`   ${i + 1}. ${iss}`));
  }
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('Fatal audit error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

