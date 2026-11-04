const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [
    profileCount,
    employeeProfileCount,
    orgUnitCount,
    orgUnitMemberCount,
    taskCount,
    postCategoryCount,
    postCount,
    meetingCount,
    attendanceCount,
    serverCount,
    channelCount,
    memberCount,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.employeeProfile.count(),
    prisma.orgUnit.count(),
    prisma.orgUnitMember.count(),
    prisma.task.count(),
    prisma.postCategory.count(),
    prisma.post.count(),
    prisma.meeting.count(),
    prisma.attendanceRecord.count(),
    prisma.server.count(),
    prisma.channel.count(),
    prisma.member.count(),
  ]);

  console.log('--- CURRENT NEON DB COUNTS ---');
  console.log('Profiles:', profileCount);
  console.log('EmployeeProfiles:', employeeProfileCount);
  console.log('OrgUnits:', orgUnitCount);
  console.log('OrgUnitMembers:', orgUnitMemberCount);
  console.log('Tasks:', taskCount);
  console.log('PostCategories:', postCategoryCount);
  console.log('Posts:', postCount);
  console.log('Meetings:', meetingCount);
  console.log('AttendanceRecords:', attendanceCount);
  console.log('Servers:', serverCount);
  console.log('Channels:', channelCount);
  console.log('Members:', memberCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());

