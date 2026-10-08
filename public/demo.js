// Dữ liệu mẫu: chỉ hiển thị khi máy chủ chưa có bài viết nào (ví dụ bản xem thử tĩnh).
(function () {
  const now = Date.now(), h = 3600e3;
  const lorem = [
    'Đây là nội dung mẫu để minh hoạ bố cục trang bài viết. Khi quản trị viên đăng bài thật, phần này sẽ được thay thế hoàn toàn.',
    'Bài viết được trình bày theo từng đoạn, với phần dẫn nổi bật ở đầu, ảnh hoặc video minh hoạ ngay bên dưới tiêu đề.',
    'Nội dung mẫu không phản ánh sự kiện có thật.',
  ].join('\n\n');
  const mk = (i, section, title, summary, ago, featured, video) => ({
    id: 'demo-' + i, section, title, summary, content: lorem, image: '', video: '', videoUrl: video ? 'demo' : '',
    featured: !!featured, published: true, createdAt: now - ago * h, demo: true,
  });
  window.DEMO_ARTICLES = [
    mk(1, 'thoi-su', 'Công an Hà Nội ra quân cao điểm bảo đảm an ninh trật tự dịp cuối năm', 'Hàng nghìn cán bộ, chiến sĩ đồng loạt triển khai phương án tuần tra, kiểm soát, giữ bình yên cho Thủ đô.', 2, true),
    mk(2, 'an-ninh', 'Triệt phá đường dây lừa đảo chiếm đoạt tài sản qua không gian mạng', 'Cơ quan Công an làm rõ hàng trăm bị hại với số tiền chiếm đoạt hàng chục tỷ đồng.', 3, true),
    mk(3, 'giao-thong', 'Phân luồng thông minh, giảm ùn tắc tại các cửa ngõ Thủ đô', 'Lực lượng CSGT ứng dụng camera AI để điều tiết giao thông theo thời gian thực.', 5, true),
    mk(4, 'thoi-su', 'Tình người trong vòng tay những người chiến sĩ Công an Thủ đô', 'Những câu chuyện đẹp về người chiến sĩ gần dân, vì dân phục vụ.', 7, true),
    mk(5, 'thoi-su', 'Hà Nội triển khai đợt cao điểm tấn công, trấn áp tội phạm', '', 9),
    mk(6, 'thoi-su', 'Cấp căn cước cho hơn 10.000 công dân chỉ trong một ngày', '', 12),
    mk(7, 'thoi-su', 'Diễn tập phương án chữa cháy, cứu nạn cứu hộ tại khu đô thị', '', 20),
    mk(8, 'thoi-su', 'Khai mạc Hội thao lực lượng vũ trang Thủ đô', '', 26),
    mk(9, 'an-ninh', 'Bắt giữ nhóm đối tượng cướp giật tài sản trên phố cổ', '', 4),
    mk(10, 'an-ninh', 'Phá chuyên án ma tuý, thu giữ hàng chục kg tang vật', '', 8),
    mk(11, 'an-ninh', 'Cảnh báo chiêu trò đầu tư tiền ảo "việc nhẹ lương cao"', '', 30),
    mk(12, 'phap-luat', 'Xét xử vụ án tham ô tài sản, nguyên giám đốc lĩnh 12 năm tù', '', 6),
    mk(13, 'phap-luat', 'Những điểm mới trong Luật Trật tự, an toàn giao thông đường bộ', '', 10),
    mk(14, 'phap-luat', 'Hỏi – đáp: thủ tục đăng ký cư trú trực tuyến', '', 15),
    mk(15, 'phap-luat', 'Khởi tố đối tượng đánh bạc dưới hình thức game online', '', 22),
    mk(16, 'phap-luat', 'Mức xử phạt vi phạm nồng độ cồn mới nhất', '', 40),
    mk(17, 'giao-thong', 'Lịch cấm đường phục vụ sự kiện lớn tại trung tâm Hà Nội', '', 5),
    mk(18, 'giao-thong', 'Xử lý hơn 2.000 trường hợp vi phạm qua camera giám sát', '', 11),
    mk(19, 'giao-thong', 'Giờ cao điểm: những điểm có nguy cơ ùn tắc cần lưu ý', '', 16),
    mk(20, 'giao-thong', 'CSGT hướng dẫn tổ chức giao thông tại cầu vượt mới', '', 28),
    mk(21, 'giao-thong', 'Khuyến cáo người dân đi xe an toàn mùa mưa bão', '', 44),
    mk(22, 'video', 'Bản tin an ninh 24h', '', 3, false, true),
    mk(23, 'video', 'Phóng sự: nơi tuyến đầu bảo vệ bình yên Thủ đô', '', 13, false, true),
    mk(24, 'video', 'Công an Hà Nội với nhân dân', '', 33, false, true),
  ];
})();
