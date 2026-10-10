// Dữ liệu mẫu: chỉ hiển thị khi máy chủ chưa có dữ liệu (ví dụ bản xem thử tĩnh).
(function () {
  const now = Date.now(), h = 3600e3;
  const body = [
    'Đây là nội dung mẫu để minh hoạ bố cục trang bài viết. Khi quản trị viên đăng bài thật, phần này sẽ được thay thế hoàn toàn.',
    'Bài viết được trình bày theo từng đoạn, với phần dẫn nổi bật ở đầu, ảnh hoặc video minh hoạ ngay bên dưới tiêu đề.',
    'Nội dung mẫu không phản ánh sự kiện có thật.',
  ].join('\n\n');
  const mk = (i, section, title, summary, ago) => ({
    id: 'demo-' + i, section, title, summary, content: body, image: '', video: '', videoUrl: '',
    featured: false, published: true, createdAt: now - ago * h, demo: true,
  });
  window.DEMO_ARTICLES = [
    mk(1, 'dong-chay', 'Những trái tim đỏ chung nhịp đập tại đảo quốc Sư Tử', '', 2),
    mk(2, 'dong-chay', 'Công an Hà Nội ra quân cao điểm bảo đảm an ninh trật tự dịp cuối năm', '', 5),
    mk(3, 'dong-chay', 'Triệt phá đường dây lừa đảo chiếm đoạt tài sản qua không gian mạng', '', 8),
    mk(4, 'dong-chay', 'Phân luồng thông minh, giảm ùn tắc tại các cửa ngõ Thủ đô', '', 12),
    mk(5, 'dong-chay', 'Tình người trong vòng tay những người chiến sĩ Công an Thủ đô', '', 20),
    mk(6, 'dong-chay', 'Cấp căn cước cho hơn 10.000 công dân chỉ trong một ngày', '', 26),
    mk(7, 'dong-chay', 'Khai mạc Hội thao lực lượng vũ trang Thủ đô', '', 30),
    mk(8, 'lan-bong', 'Công an Hà Nội ra quân cao điểm bảo đảm an ninh trật tự dịp cuối năm', 'Hàng nghìn cán bộ, chiến sĩ đồng loạt triển khai phương án tuần tra, kiểm soát, giữ bình yên cho Thủ đô.', 2),
    mk(9, 'lan-bong', 'Tình người trong vòng tay những người chiến sĩ Công an Thủ đô', '', 7),
    mk(10, 'lan-bong', 'Hà Nội triển khai đợt cao điểm tấn công, trấn áp tội phạm', '', 9),
    mk(11, 'lan-bong', 'Cấp căn cước cho hơn 10.000 công dân chỉ trong một ngày', '', 12),
    mk(12, 'lan-bong', 'Diễn tập phương án chữa cháy, cứu nạn cứu hộ tại khu đô thị', '', 20),
    mk(13, 'ben-le-san-co', 'Xét xử vụ án tham ô tài sản, nguyên giám đốc lĩnh 12 năm tù', '', 6),
    mk(14, 'ben-le-san-co', 'Những điểm mới trong Luật Trật tự, an toàn giao thông đường bộ', '', 10),
    mk(15, 'ben-le-san-co', 'Hỏi – đáp: thủ tục đăng ký cư trú trực tuyến', '', 15),
    mk(16, 'ben-le-san-co', 'Khởi tố đối tượng đánh bạc dưới hình thức game online', '', 22),
    mk(17, 'ben-le-san-co', 'Mức xử phạt vi phạm nồng độ cồn mới nhất', '', 40),
    mk(18, 'nguoi-ham-mo', 'Lịch cấm đường phục vụ sự kiện lớn tại trung tâm Hà Nội', '', 5),
    mk(19, 'nguoi-ham-mo', 'Xử lý hơn 2.000 trường hợp vi phạm qua camera giám sát', '', 11),
    mk(20, 'nguoi-ham-mo', 'Giờ cao điểm: những điểm có nguy cơ ùn tắc cần lưu ý', '', 16),
    mk(21, 'nguoi-ham-mo', 'CSGT hướng dẫn tổ chức giao thông tại cầu vượt mới', '', 28),
    mk(22, 'nguoi-ham-mo', 'Khuyến cáo người dân đi xe an toàn mùa mưa bão', '', 44),
    mk(23, 've-chung-toi', 'Hành trình hơn nửa thế kỷ của lực lượng Công an Thủ đô', '', 60),
    mk(24, 'doi-hinh', 'Chân dung những người giữ bình yên nơi tuyến đầu', '', 50),
  ];
  window.DEMO_SITE = {
    hero: [{ image: '', line1: 'CLB CÔNG AN HÀ NỘI CHÍNH THỨC', line2: 'VÔ ĐỊCH V.LEAGUE 2025/26', button: 'Đọc bài viết', link: '#dong-chay' }],
    tournaments: [
      { name: 'LPBANK V.LEAGUE 1 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Hà Nội', awayLogo: '', date: '18/10', time: '19:15', ticketUrl: '#' },
      { name: 'AFC CHAMPIONS LEAGUE ELITE 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Đông Á Thanh Hóa', awayLogo: '', date: '22/10', time: '19:15', ticketUrl: '#' },
      { name: 'ASEAN CLUB CHAMPIONSHIP SHOPEE CUP 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Sông Lam Nghệ An', awayLogo: '', date: '31/10', time: '18:00', ticketUrl: '#' },
      { name: 'CÚP QUỐC GIA SACOMBANK 2026/27', homeName: 'Công an Hà Nội', homeLogo: '', awayName: 'Công an TP.HCM', awayLogo: '', date: '07/11', time: '19:15', ticketUrl: '#' },
    ],
    intro: { line1: 'CONG AN HA NOI', line2: 'SINCE 1956' },
    squad: [{ name: 'Filip Nguyen', number: '1', image: '' }, { name: 'Nguyen Quang Hai', number: '19', image: '' }, { name: 'Doan Van Hau', number: '5', image: '' }, { name: 'Cầu thủ 4', number: '10', image: '' }],
    multimedia: { image: '', button: 'Xem tất cả', link: 'section.html?s=multimedia' },
    shop: { title: 'Cửa hàng chính thức', subtitle: 'Sản phẩm bán chạy nhất', products: [
      { id: 'p1home', name: 'HOME KIT V.LEAGUE 2026', price: 350000, description: '', image: '' }, { id: 'p2away', name: 'AWAY KIT INTERNATIONAL 2026', price: 350000, description: '', image: '' },
      { id: 'p3homei', name: 'HOME KIT INTERNATIONAL 2026', price: 350000, description: '', image: '' }, { id: 'p4third', name: 'THIRD KIT INTERNATIONAL 2026', price: 350000, description: '', image: '' }] },
    honors: { title: 'CÔNG AN HÀ NỘI FC', banner: '', items: [
      { year: '1962', name: 'Giải hạng A miền Bắc', result: 'champion' }, { year: '1962', name: 'Giải vô địch thống nhất miền Bắc', result: 'champion' },
      { year: '1980', name: 'Giải bóng đá A1 toàn quốc', result: 'runner' }, { year: '1981-1982', name: 'Giải bóng đá A1 toàn quốc', result: 'third' },
      { year: '1981-1982', name: 'Giải bóng đá A1 toàn quốc', result: 'champion' }] },
    footer: { about: 'Cơ quan ngôn luận của Công an thành phố Hà Nội. Thông tin nhanh, chính xác, vì một Thủ đô bình yên.', facebook: '', youtube: '', instagram: '', tiktok: '', zalo: '', bank: '' },
    sponsors: Array.from({ length: 10 }, (_, i) => ({ name: 'Nhà tài trợ ' + (i + 1), image: '', url: '' })),
  };
})();
