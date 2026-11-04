const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const db = new PrismaClient();

async function main() {
  console.log("=== SEEDING KAGGLE ENTERPRISE DATASET (DATASET V3 & DISCORD V1-V3) ===");

  // 1. Fetch Server and Key Profiles
  const server = await db.server.findFirst({
    include: {
      channels: true,
      members: {
        include: { profile: true },
      },
    },
  });

  if (!server) {
    console.error("No server found! Run seed first.");
    return;
  }

  const profiles = await db.profile.findMany();
  const profileMap = {};
  profiles.forEach((p) => {
    profileMap[p.name] = p;
  });

  const adminProfile = profiles.find((p) => p.name.includes("Thiện")) || profiles[0];
  const ctoProfile = profiles.find((p) => p.name.includes("Hùng")) || profiles[1] || adminProfile;
  const techLead = profiles.find((p) => p.name.includes("Sarah")) || profiles[2] || adminProfile;
  const salesLead = profiles.find((p) => p.name.includes("Bảo")) || profiles[3] || adminProfile;
  const globalLead = profiles.find((p) => p.name.includes("Emily")) || profiles[4] || adminProfile;
  const qaLead = profiles.find((p) => p.name.includes("Trọng")) || profiles[5] || adminProfile;
  const hrSpecialist = profiles.find((p) => p.name.includes("Hà") || p.name.includes("Mai")) || adminProfile;

  console.log(`Using Server: ${server.name} with ${server.channels.length} channels`);

  // 2. Seed Social Topics from Kaggle V3
  console.log("\n--- 1. Seeding Social Topics ---");
  const defaultTopics = [
    { name: "Công nghệ & Hạ tầng", slug: "cong-nghe" },
    { name: "An toàn thông tin & E2EE", slug: "an-toan-thong-tin" },
    { name: "Nền tảng Cloud & LiveKit", slug: "cloud-livekit" },
    { name: "Cải tiến quy trình", slug: "cai-tien" },
    { name: "Kinh doanh & Thị trường", slug: "kinh-doanh" },
    { name: "Hỏi đáp nội bộ (Q&A)", slug: "hoi-dap" },
    { name: "Kiến thức & Chia sẻ", slug: "kien-thuc" },
    { name: "Văn hóa doanh nghiệp", slug: "van-hoa" },
  ];

  const topicRecords = [];
  for (const t of defaultTopics) {
    let rec = await db.socialTopic.findUnique({ where: { slug: t.slug } });
    if (!rec) {
      rec = await db.socialTopic.create({
        data: { name: t.name, slug: t.slug },
      });
    }
    topicRecords.push(rec);
  }
  console.log(`Verified ${topicRecords.length} Social Topics.`);

  // 3. Seed Realistic Social Posts from Kaggle Dataset V3
  console.log("\n--- 2. Seeding Enterprise Threads Posts ---");
  const sampleSocialPosts = [
    {
      author: techLead,
      audience: "COMPANY",
      postType: "TEXT",
      body: "Một giải pháp kỹ thuật tốt cần bám sát trải nghiệm người dùng và có vòng kiểm thử đối soát tự động trước khi triển khai chính thức lên môi trường production.\n\nNhóm Nền Tảng & Cloud đã hoàn tất đồng bộ dải phụ đề thời gian thực (real-time captions) với độ trễ dưới 2 giây. Tất cả các đoạn hội thoại có thuật ngữ kỹ thuật sẽ được đối chiếu tự động với bảng Glossary.\n\n#CongNghe #CloudLivekit #CaiTien",
      topicSlug: "cong-nghe",
      likesCount: 18,
      replies: [
        {
          author: ctoProfile,
          body: "Rất hoan nghênh nỗ lực tối ưu độ trễ của nhóm Cloud. Đề nghị bên QA phối hợp stress test trên 50 người kết nối đồng thời trong tuần này nhé.",
          depth: 0,
        },
        {
          author: qaLead,
          body: "Tổ QA đã chuẩn bị kịch bản kiểm thử tải mô phỏng 60 luồng WebRTC đồng thời. Dự kiến sáng thứ 5 sẽ có báo cáo kết quả chi tiết.",
          depth: 1,
        },
        {
          author: adminProfile,
          body: "Các action item này đã được xác nhận vào Bảng việc Lark Base của tổ Nền Tảng & Cloud. Mọi người theo dõi tiến độ ở đó nhé!",
          depth: 0,
        },
      ],
    },
    {
      author: salesLead,
      audience: "COMPANY",
      postType: "LONG_TEXT",
      body: "Chia sẻ kinh nghiệm: trước khi chuyển giao một đầu việc hay hợp đồng cho khách hàng, nên có checklist gồm người phụ trách, đầu ra, tài liệu và hạn hoàn thành để tránh thất lạc thông tin.\n\nNhóm Kinh Doanh Nội Địa vừa ký kết hợp đồng thử nghiệm giải pháp họp AI với đối tác bán lẻ 120 chi nhánh. Tính năng điểm danh và trích xuất biên bản tự động được đánh giá rất cao!\n\n#KinhDoanh #KienThuc",
      topicSlug: "kinh-doanh",
      likesCount: 24,
      replies: [
        {
          author: globalLead,
          body: "Chúc mừng team Nội Địa! Team Kinh Doanh Quốc Tế cũng đang áp dụng bộ checklist tương tự cho buổi demo với đối tác Nhật Bản vào thứ 6 này.",
          depth: 0,
        },
        {
          author: hrSpecialist,
          body: "Thành tích này rất xứng đáng để đề xuất tuyên dương trong Bảng tin tháng 11 của công ty!",
          depth: 0,
        },
      ],
    },
    {
      author: qaLead,
      audience: "COMPANY",
      postType: "TEXT",
      body: "Quy tắc an toàn dữ liệu: Theo Nghị định 13/2023/NĐ-CP và Luật 91/2025/QH15, mọi cuộc họp ghi âm cần có sự đồng thuận (Consent) của 100% người tham dự.\n\nHệ thống của chúng ta đã tích hợp thông báo minh bạch, người từ chối ghi âm vẫn tham gia bình thường mà không bị ngắt kết nối. Mọi lượt truy cập hồ sơ nhạy cảm đều được ghi log kiểm toán bất biến.\n\n#AnToanThongTin #CaiTien",
      topicSlug: "an-toan-thong-tin",
      likesCount: 31,
      replies: [
        {
          author: adminProfile,
          body: "Chính xác, mục Kiểm Toán & Tuân Thủ trên thanh điều hướng đã ghi nhận đầy đủ các audit log này với mã bảo mật SHA-256.",
          depth: 0,
        },
        {
          author: techLead,
          body: "Các trường nhạy cảm như CCCD, Tài khoản ngân hàng và Lương cơ bản đã được bảo vệ chặt chẽ ở backend qua ProfileAccessPolicy.",
          depth: 0,
        },
      ],
    },
    {
      author: globalLead,
      audience: "TEAM",
      postType: "TEXT",
      body: "Cập nhật tiến độ dự án thị trường APAC: Chúng ta đã cấu hình xong máy chủ phụ đề đa ngữ Anh - Nhật - Việt cho phòng họp trực tuyến.\n\nCác bạn trong tổ Kinh Doanh Quốc Tế chuẩn bị sẵn slide demo và xem trước danh mục thuật ngữ chuyên ngành trong GlossaryTerm nhé.\n\n#KinhDoanh #CloudLivekit",
      topicSlug: "cloud-livekit",
      likesCount: 12,
      replies: [
        {
          author: adminProfile,
          body: "Đã kiểm tra dải âm thanh và video HD 720p, chạy rất mượt trên mạng quốc tế.",
          depth: 0,
        },
      ],
    },
  ];

  for (const p of sampleSocialPosts) {
    let existing = await db.socialPost.findFirst({
      where: { body: p.body },
    });

    if (!existing) {
      const author = p.author || adminProfile;
      const createdPost = await db.socialPost.create({
        data: {
          authorId: author.id,
          authorName: author.name,
          authorRole: "Thành viên cốt cán",
          authorAvatar: author.imageUrl,
          audience: p.audience,
          postType: p.postType,
          status: "PUBLISHED",
          body: p.body,
          likesCount: p.likesCount || 0,
          repliesCount: (p.replies || []).length,
        },
      });

      // Link topic
      const topic = topicRecords.find((t) => t.slug === p.topicSlug) || topicRecords[0];
      if (topic) {
        await db.socialPostTopic.create({
          data: {
            postId: createdPost.id,
            topicId: topic.id,
          },
        });
      }

      // Add replies
      for (const rep of p.replies || []) {
        const repAuthor = rep.author || adminProfile;
        await db.socialReply.create({
          data: {
            postId: createdPost.id,
            authorId: repAuthor.id,
            authorName: repAuthor.name,
            authorAvatar: repAuthor.imageUrl,
            body: rep.body,
            depth: rep.depth || 0,
            status: "PUBLISHED",
          },
        });
      }

      // Add a reaction from admin
      await db.socialReaction.create({
        data: {
          postId: createdPost.id,
          profileId: adminProfile.id,
          type: "LIKE",
        },
      });
    }
  }
  console.log("Enterprise Threads Posts & Replies seeded successfully.");

  // 4. Seed Channel Conversations from Kaggle V1/V2/V3 (Detoxed & Cleaned)
  console.log("\n--- 3. Seeding Realistic Channel Messages from Kaggle V1-V3 ---");

  const channelMessageData = {
    "nen-tang-cloud": [
      { sender: techLead, text: "Đã cập nhật cấu hình Docker container cho LiveKit SFU server trên cụm Kubernetes." },
      { sender: ctoProfile, text: "Kiểm tra memory leak và kết nối WebRTC có bị drop khi scale pods không nhé." },
      { sender: techLead, text: "Em đã test autoscaling HPA từ 2 lên 8 pods, độ trễ audio giữ vững ở mức 45ms." },
      { sender: adminProfile, text: "Tuyệt vời, thông số này đã đạt chuẩn SLA cam kết với ban giám đốc." },
      { sender: techLead, text: "Egress template 720p cũng đã lưu trữ trực tiếp vào S3/R2 tương thích, file ghi hình mp4 rất sắc nét." },
    ],
    "qa-ha-tang": [
      { sender: qaLead, text: "Bắt đầu chạy test suite kiểm thử bảo mật E2EE và xác thực chữ ký WebRTC token." },
      { sender: techLead, text: "Token LiveKit có thời hạn TTL 6 giờ và cấp quyền riêng biệt cho từng phòng họp nhé." },
      { sender: qaLead, text: "Đã verify: phòng có PIN thì bắt buộc nhập đúng PIN mới nhận được token giải mã media." },
      { sender: adminProfile, text: "Nhớ ghi lại kết quả vào Bảng việc Lark Base để phục vụ buổi kiểm toán tuân thủ sắp tới." },
      { sender: qaLead, text: "Đã cập nhật checklist 16/16 test case đạt chuẩn theo tài liệu validation V3 rồi anh!" },
    ],
    "kinh-doanh-noi-dia": [
      { sender: salesLead, text: "Tuần này team mình sẽ có 3 buổi demo giải pháp phòng họp thông minh cho các doanh nghiệp logistic." },
      { sender: adminProfile, text: "Tập trung trình diễn tính năng Giơ tay phát biểu, Điểm danh tự động và Tóm tắt biên bản họp bằng AI nhé." },
      { sender: salesLead, text: "Khách hàng rất ấn tượng với việc Action item sau khi xác nhận sẽ tự động tạo thẻ việc trong Kanban." },
      { sender: salesLead, text: "Đã gửi báo giá gói Doanh Nghiệp Tiêu Chuẩn cho công ty Vận Tải Đông Đô, họ hẹn thứ 5 chốt hợp đồng." },
    ],
    "kinh-doanh-quoc-te": [
      { sender: globalLead, text: "Đối tác Tokyo vừa xác nhận lịch họp song ngữ trực tuyến vào 14h chiều thứ 6 tuần này." },
      { sender: techLead, text: "Đã nạp sẵn bộ từ vựng song ngữ Nhật - Việt vào GlossaryTerm để phụ đề hiển thị chuẩn xác nhất." },
      { sender: globalLead, text: "Cảm ơn team Tech, phiên dịch real-time sẽ giúp buổi thương thảo hợp đồng thuận lợi hơn rất nhiều." },
    ],
    "general": [
      { sender: adminProfile, text: "Chào mừng toàn thể cán bộ nhân viên đến với Không Gian Làm Việc Số Doanh Nghiệp!" },
      { sender: hrSpecialist, text: "Mọi người nhớ kiểm tra mục 'Hồ Sơ & Đãi Ngộ Của Tôi' để xác nhận thông tin ngày công và thâm niên tháng này nhé." },
      { sender: ctoProfile, text: "Các phân hệ Bảng Việc Lark Base, Cổng Bảng Tin và Phòng Họp AI đã kết nối hoàn chỉnh, chúc mọi người làm việc hiệu quả!" },
    ],
    "deku": [
      { sender: adminProfile, text: "Phòng họp trực tuyến #deku đã sẵn sàng. Hệ thống âm thanh, camera và chia sẻ màn hình hoạt động tối ưu." },
      { sender: techLead, text: "Micro đã được tối ưu hiển thị: khi nói sẽ sáng rực xanh, khi im lặng sẽ hiển thị xám thanh lịch." },
    ],
  };

  for (const [chName, msgList] of Object.entries(channelMessageData)) {
    const ch = server.channels.find((c) => c.name === chName);
    if (!ch) continue;

    for (const item of msgList) {
      const senderProfile = item.sender || adminProfile;
      // Find or link server member
      let member = server.members.find((m) => m.profileId === senderProfile.id);
      if (!member) {
        member = server.members[0];
      }

      const existingMsg = await db.message.findFirst({
        where: {
          channelId: ch.id,
          content: item.text,
        },
      });

      if (!existingMsg && member) {
        await db.message.create({
          data: {
            channelId: ch.id,
            memberId: member.id,
            content: item.text,
          },
        });
      }
    }
    console.log(`Channel #${chName}: populated messages.`);
  }

  console.log("\n🎉 ALL KAGGLE DATASET V3 & DISCORD V1-V3 CONTENT INTEGRATED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
  })
  .finally(() => db.$disconnect());

