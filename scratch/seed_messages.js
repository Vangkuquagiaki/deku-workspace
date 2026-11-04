const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const primaryProfile = await prisma.profile.findFirst({
    where: { userId: "user_3JzV4FIF2w5cBBa5kDRXqS9nhGc" }
  });
  const colleagueSarah = await prisma.profile.findUnique({
    where: { userId: "user_sample_sarah" }
  });
  const colleagueAlex = await prisma.profile.findUnique({
    where: { userId: "user_sample_alex" }
  });

  const server = await prisma.server.findFirst({
    where: { profileId: primaryProfile.id },
    include: { channels: true, members: true }
  });

  const memberSarah = await prisma.member.findFirst({
    where: { serverId: server.id, profileId: colleagueSarah.id }
  });
  const memberAlex = await prisma.member.findFirst({
    where: { serverId: server.id, profileId: colleagueAlex.id }
  });
  const memberThien = await prisma.member.findFirst({
    where: { serverId: server.id, profileId: primaryProfile.id }
  });

  const generalChannel = server.channels.find(c => c.name === "general");

  const kaggleConversations = [
    { memberId: memberSarah.id, content: "Chào mọi người! Tôi vừa kiểm tra thử nghiệm kết nối phòng họp WebRTC, độ trễ rất thấp." },
    { memberId: memberAlex.id, content: "Đã nạp bộ dữ liệu benchmark PhoMT và AMI vào kiểm thử, độ chính xác nhận dạng rất hứa hẹn." },
    { memberId: memberThien.id, content: "Tuyệt vời, nhớ cập nhật các từ chuyên ngành vào từ điển Glossary trước buổi demo nhé." },
    { memberId: memberSarah.id, content: "Rõ rồi! Đã thêm deploy, egress, latency vào bảng từ điển thuật ngữ rồi nhé." },
    { memberId: memberAlex.id, content: "Vừa test chia sẻ màn hình và audio channel, âm thanh lọc tạp âm rất trong trẻo." },
    { memberId: memberThien.id, content: "Hôm nay chúng ta sẽ họp thử nghiệm lúc 14h tại phòng họp [hop-giao-ban-tuan] nhé mọi người." }
  ];

  for (const msg of kaggleConversations) {
    const exists = await prisma.message.findFirst({
      where: { channelId: generalChannel.id, content: msg.content }
    });
    if (!exists) {
      await prisma.message.create({
        data: {
          content: msg.content,
          channelId: generalChannel.id,
          memberId: msg.memberId
        }
      });
    }
  }

  console.log("✅ Seeded Kaggle-inspired conversation messages into #general!");
}

main().finally(() => prisma.$disconnect());
