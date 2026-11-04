const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed data for Meeting Intelligence Platform...");

  // 1. Get or create primary user profile (Minh Thiện Nguyễn)
  let primaryProfile = await prisma.profile.findFirst({
    where: { userId: "user_3JzV4FIF2w5cBBa5kDRXqS9nhGc" }
  });

  if (!primaryProfile) {
    primaryProfile = await prisma.profile.findFirst();
  }

  if (!primaryProfile) {
    primaryProfile = await prisma.profile.create({
      data: {
        userId: "user_3JzV4FIF2w5cBBa5kDRXqS9nhGc",
        name: "Minh Thiện Nguyễn",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        email: "minhthienn2706@gmail.com"
      }
    });
  }

  console.log(`✅ Primary Profile: ${primaryProfile.name} (${primaryProfile.id})`);

  // 2. Create sample colleague profiles
  const colleagueSarah = await prisma.profile.upsert({
    where: { userId: "user_sample_sarah" },
    update: {},
    create: {
      userId: "user_sample_sarah",
      name: "Sarah Chen (Tech Lead)",
      imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      email: "sarah.chen@company.com"
    }
  });

  const colleagueAlex = await prisma.profile.upsert({
    where: { userId: "user_sample_alex" },
    update: {},
    create: {
      userId: "user_sample_alex",
      name: "Alex Rivers (AI Engineer)",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      email: "alex.rivers@company.com"
    }
  });

  // 3. Find or create default Server
  let server = await prisma.server.findFirst({
    where: { profileId: primaryProfile.id },
    include: { channels: true, members: true }
  });

  if (!server) {
    server = await prisma.server.create({
      data: {
        name: "Meeting & AI Intelligence",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200",
        inviteCode: "meeting-ai-workspace",
        profileId: primaryProfile.id,
        channels: {
          create: [
            { name: "general", type: "TEXT", profileId: primaryProfile.id },
            { name: "phong-hop-am-thanh", type: "AUDIO", profileId: primaryProfile.id },
            { name: "phong-hop-video", type: "VIDEO", profileId: primaryProfile.id }
          ]
        },
        members: {
          create: [
            { profileId: primaryProfile.id, role: "ADMIN" }
          ]
        }
      },
      include: { channels: true, members: true }
    });
  }

  // Ensure Sarah and Alex are members
  let memberSarah = await prisma.member.findFirst({
    where: { serverId: server.id, profileId: colleagueSarah.id }
  });
  if (!memberSarah) {
    memberSarah = await prisma.member.create({
      data: { serverId: server.id, profileId: colleagueSarah.id, role: "MODERATOR" }
    });
  }

  let memberAlex = await prisma.member.findFirst({
    where: { serverId: server.id, profileId: colleagueAlex.id }
  });
  if (!memberAlex) {
    memberAlex = await prisma.member.create({
      data: { serverId: server.id, profileId: colleagueAlex.id, role: "GUEST" }
    });
  }

  const memberThien = await prisma.member.findFirst({
    where: { serverId: server.id, profileId: primaryProfile.id }
  });

  // 4. Seed clean Kaggle-inspired conversation messages into general channel
  const generalChannel = server.channels.find(c => c.name === "general") || server.channels[0];
  if (generalChannel && memberThien) {
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
  }

  // 5. Seed Real-world Meetings (AMI + PhoMT)
  const existingMeeting1 = await prisma.meeting.findUnique({
    where: { code: "hop-chien-luoc-ai" }
  });

  if (!existingMeeting1) {
    await prisma.meeting.create({
      data: {
        code: "hop-chien-luoc-ai",
        title: "Họp Chiến Lược: Đánh Giá Tiến Độ Hệ Thống Phòng Họp AI & Phiên Dịch",
        hostId: primaryProfile.userId,
        status: "ENDED",
        lobby: true,
        startsAt: new Date(Date.now() - 3600000),
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(Date.now() - 1200000),
        participants: {
          create: [
            { userId: primaryProfile.userId, name: primaryProfile.name, role: "HOST", language: "vi" },
            { userId: colleagueSarah.userId, name: colleagueSarah.name, role: "COHOST", language: "en" },
            { userId: colleagueAlex.userId, name: colleagueAlex.name, role: "MEMBER", language: "en" }
          ]
        },
        recordings: {
          create: [
            {
              egressId: "egress_sample_01",
              fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
              durationSec: 2400,
              sizeBytes: BigInt(125829120),
              status: "COMPLETE",
              startedBy: primaryProfile.name
            }
          ]
        },
        segments: {
          create: [
            {
              speakerId: primaryProfile.userId,
              speakerName: primaryProfile.name,
              lang: "vi",
              text: "Chào mọi người, hôm nay chúng ta sẽ đánh giá kiến trúc hệ thống phòng họp AI.",
              translation: {
                en: "Hello everyone, today we will review the AI meeting room system architecture.",
                zh: "大家好，今天我们将回顾AI会议室系统架构。",
                ja: "みなさん、こんにちは。本日はAI会議室システムのアーキテクチャを確認します。"
              },
              startMs: 2500,
              endMs: 6800
            },
            {
              speakerId: colleagueSarah.userId,
              speakerName: colleagueSarah.name,
              lang: "en",
              text: "Thanks Thien. I have reviewed the LiveKit Egress pipeline and it operates smoothly.",
              translation: {
                vi: "Cảm ơn Thiện. Tôi đã xem xét luồng LiveKit Egress và nó hoạt động rất mượt mà.",
                zh: "谢谢Thiện。我已经审查了LiveKit Egress流程，它运行非常顺畅。",
                ja: "Thienさん、ありがとう。LiveKit Egressパイプラインを確認しましたが、非常にスムーズに動作しています。"
              },
              startMs: 7500,
              endMs: 12400
            },
            {
              speakerId: colleagueAlex.userId,
              speakerName: colleagueAlex.name,
              lang: "en",
              text: "The bilingual speech-to-text benchmark shows latency is staying under 2.5 seconds.",
              translation: {
                vi: "Điểm chuẩn nhận dạng giọng nói song ngữ cho thấy độ trễ duy trì dưới 2,5 giây.",
                zh: "双语语音转文本基准测试显示延迟保持在2.5秒以内。",
                ja: "バイリンガル音声認識ベンチマークでは、レイテンシが2.5秒未満に維持されています。"
              },
              startMs: 13200,
              endMs: 18900
            },
            {
              speakerId: primaryProfile.userId,
              speakerName: primaryProfile.name,
              lang: "vi",
              text: "Tuyệt vời, từ điển thuật ngữ GlossaryTerm đã đồng bộ tốt với các từ kỹ thuật chưa?",
              translation: {
                en: "Excellent, is the GlossaryTerm dictionary synchronizing well with technical words?",
                zh: "太好了，GlossaryTerm术语词典与技术词汇同步良好吗？",
                ja: "素晴らしい、GlossaryTerm用語辞書は技術用語とうまく同期していますか？"
              },
              startMs: 19500,
              endMs: 24500
            },
            {
              speakerId: colleagueSarah.userId,
              speakerName: colleagueSarah.name,
              lang: "en",
              text: "Yes, deploy, egress, and latency are strictly translated based on company rules.",
              translation: {
                vi: "Có, các từ deploy, egress và latency được dịch chính xác theo quy định công ty.",
                zh: "是的，deploy、egress和latency都根据公司规则严格翻译。",
                ja: "はい、deploy、egress、latencyは社内ルールに基づいて厳密に翻訳されます。"
              },
              startMs: 25200,
              endMs: 31000
            }
          ]
        }
      }
    });
  }

  const existingMeeting2 = await prisma.meeting.findUnique({
    where: { code: "hop-giao-ban-tuan" }
  });

  if (!existingMeeting2) {
    await prisma.meeting.create({
      data: {
        code: "hop-giao-ban-tuan",
        title: "Họp Giao Ban Dự Án Hàng Tuần - Meeting Intelligence Platform",
        hostId: primaryProfile.userId,
        status: "SCHEDULED",
        lobby: true,
        startsAt: new Date(Date.now() + 86400000),
        participants: {
          create: [
            { userId: primaryProfile.userId, name: primaryProfile.name, role: "HOST", language: "vi" },
            { userId: colleagueSarah.userId, name: colleagueSarah.name, role: "COHOST", language: "en" }
          ]
        }
      }
    });
  }

  // 6. Seed Glossary Terms
  const terms = [
    { source: "deploy", target: "triển khai", lang: "en-vi" },
    { source: "egress", target: "xuất bản ghi", lang: "en-vi" },
    { source: "latency", target: "độ trễ", lang: "en-vi" },
    { source: "speech-to-text", target: "nhận dạng giọng nói", lang: "en-vi" },
    { source: "transcript", target: "biên bản hội thoại", lang: "en-vi" },
    { source: "Trưởng phòng", target: "Department Head", lang: "vi-en" },
    { source: "Biên bản họp", target: "Meeting Minutes", lang: "vi-en" },
    { source: "Phòng chờ", target: "Waiting Lobby", lang: "vi-en" }
  ];

  for (const t of terms) {
    const exists = await prisma.glossaryTerm.findFirst({
      where: { orgId: "org_default", source: t.source, lang: t.lang }
    });
    if (!exists) {
      await prisma.glossaryTerm.create({
        data: {
          orgId: "org_default",
          source: t.source,
          target: t.target,
          lang: t.lang
        }
      });
    }
  }

  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
