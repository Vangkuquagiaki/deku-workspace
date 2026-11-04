const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BANNER_IMAGES = {
  "Nhân sự": [
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
  ],
  "Quy trình": [
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
  ],
  "Pháp luật": [
    "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80",
  ],
  "Tuyên dương": [
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
  ],
  "Công ty": [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
  ],
};

function generateRealisticBody(title, categoryName, index) {
  const cat = categoryName || "Công ty";
  const banners = BANNER_IMAGES[cat] || BANNER_IMAGES["Công ty"];
  const bannerUrl = banners[index % banners.length];

  let details = "";
  if (cat.includes("Nhân sự") || title.includes("sinh hoạt") || title.includes("phối hợp")) {
    details = `Kính gửi toàn thể Cán bộ Nhân viên,\n\nNhằm nâng cao chất lượng môi trường làm việc và tối ưu hóa hiệu suất phối hợp giữa các khối chuyên môn, Ban Nhân sự xin thông báo các nội dung trọng tâm:\n\n1. Thời gian & Phạm vi: Áp dụng từ ngày 01 của tháng tới đối với toàn thể 1.280 nhân sự tại tất cả các văn phòng và chi nhánh.\n2. Nội dung triển khai:\n- Đăng ký lịch làm việc linh hoạt (Hybrid) và điểm danh trên cổng HRM nội bộ Deku trước 09h00 hàng ngày.\n- Quản lý chế độ đãi ngộ, bảo hiểm sức khỏe mở rộng Bảo Việt và hạn mức ngày phép năm 2026.\n- Đề nghị Trưởng các tổ bộ phận rà soát danh sách nhân sự và gửi phản hồi trước thứ Sáu tuần này.\n\nMọi ý kiến thắc mắc xin vui lòng liên hệ trực tiếp Bộ phận Nhân sự (Phòng HR) để được hỗ trợ giải đáp kịp thời.`;
  } else if (cat.includes("Quy trình") || title.includes("quy trình") || title.includes("làm việc")) {
    details = `Kính gửi các Khối Phòng ban & Tổ Chuyên môn,\n\nCăn cứ theo mục tiêu chuyển đổi số và nâng cao độ tin cậy trong quy trình vận hành nội bộ, Deku chính thức ban hành cập nhật tiêu chuẩn quy trình mới:\n\n1. Phê duyệt & Giao việc: Toàn bộ đầu việc (tasks) và tiến độ dự án được quản lý tập trung trên Bảng việc Lark Base. Cấp Quản lý và Tổ trưởng có trách nhiệm phân bổ task rõ hạn chót (Deadline) và người phụ trách chính (Assignee).\n2. Quản lý tài liệu & Mã nguồn: Tuân thủ nghiêm ngặt quy trình kiểm thử tự động CI/CD và quy tắc đánh giá chéo (Peer Review).\n3. Báo cáo định kỳ: Cập nhật trạng thái công việc (Đang làm, Hoàn thành, Chờ duyệt) trước 17h30 hàng ngày.\n\nĐề nghị các phòng ban nghiêm túc triển khai thực hiện.`;
  } else if (cat.includes("Pháp luật") || title.includes("bảo mật") || title.includes("tài khoản")) {
    details = `Kính gửi các Cán bộ Nhân viên,\n\nNhằm đảm bảo an toàn an ninh thông tin tuyệt đối cho hạ tầng công nghệ và tuân thủ Luật 91/2025/QH15 và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, Phòng Pháp chế & An ninh mạng Deku lưu ý:\n\n1. Bảo mật tài khoản:\n- Bắt buộc kích hoạt xác thực hai yếu tố (2FA / OTP) cho mọi tài khoản hệ thống Deku, Workspace và Email công ty.\n- Không chia sẻ mật khẩu, token phiên làm việc hoặc tài liệu mật qua các kênh nhắn tin không được mã hóa.\n2. Quy định cuộc họp trực tuyến:\n- Toàn bộ các phiên họp có ghi hình hoặc phiên dịch AI phải có sự đồng thuận từ các bên tham gia theo chuẩn E2EE.\n- Nghiêm cấm trích xuất biên bản cuộc họp mang tính bảo mật chiến lược ra ngoài tổ chức.\n\nCác trường hợp vi phạm sẽ bị xử lý kỷ luật theo nội quy lao động công ty.`;
  } else if (cat.includes("Tuyên dương") || title.includes("Tuyên dương") || title.includes("hợp tác")) {
    details = `Kính gửi đại gia đình Deku,\n\nBan Giám Đốc và Hội đồng Thi đua Khen thưởng trân trọng vinh danh các cá nhân và tập thể xuất sắc đã có những đóng góp vượt bậc trong đợt thi đua vừa qua:\n\n🏆 Danh hiệu Cống hiến & Sáng tạo:\n- Tập thể Đội ngũ Kỹ thuật & Hạ tầng AI: Hoàn thành vượt tiến độ tích hợp WebRTC và mô hình phiên dịch trực tiếp.\n- Tập thể Khối Kinh doanh & Đối tác: Đạt 135% chỉ tiêu hợp đồng doanh nghiệp.\n- Các cá nhân tiêu biểu được trao tặng kỷ niệm chương và phần thưởng 1 tháng lương kinh doanh.\n\nXin chúc mừng tất cả các anh chị em! Hãy cùng tiếp tục phát huy tinh thần đoàn kết và bứt phá mạnh mẽ hơn nữa trong chặng đường sắp tới!`;
  } else {
    details = `Kính gửi toàn thể Cán bộ Công nhân viên,\n\nBan Lãnh đạo Deku xin trân trọng gửi tới toàn thể nhân sự thông báo chính thức về định hướng hoạt động và chiến lược phát triển:\n\n1. Kế hoạch trọng tâm:\n- Đẩy mạnh triển khai hệ sinh thái làm việc tích hợp: Chat đa kênh, Bảng việc Base, Họp trực tuyến AI và Mạng xã hội Threads nội bộ.\n- Tối ưu hóa phân quyền theo chuẩn Enterprise: Minh bạch, bảo mật và phân cấp rõ ràng theo từng phòng ban.\n2. Lịch sinh hoạt chung:\n- Buổi Town Hall toàn công ty sẽ diễn ra vào lúc 15h30 thứ Sáu tới tại Phòng họp Hội đồng và phát trực tiếp trên kênh Deku Video.\n\nTrân trọng cảm ơn sự đồng hành và nỗ lực không ngừng của toàn thể quý anh chị em cán bộ nhân viên!`;
  }

  // Combine image markdown + text
  return `![Banner](${bannerUrl})\n\n${details}`;
}

async function main() {
  console.log("Starting bulletin posts enrichment...");
  const posts = await prisma.post.findMany({
    include: { category: true }
  });

  console.log(`Found ${posts.length} posts to update.`);
  let updatedCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const newBody = generateRealisticBody(post.title, post.category?.name, i);

    await prisma.post.update({
      where: { id: post.id },
      data: {
        body: newBody,
      }
    });

    updatedCount++;
    if (updatedCount % 50 === 0 || updatedCount === posts.length) {
      console.log(`Updated ${updatedCount}/${posts.length} posts...`);
    }
  }

  console.log("Successfully enriched all bulletin posts with rich content and image banners!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

