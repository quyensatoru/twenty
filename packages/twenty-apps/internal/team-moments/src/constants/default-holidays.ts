type DefaultHoliday = {
  name: string;
  date: string;
  isYearly: boolean;
  audience: 'EVERYONE' | 'WOMEN' | 'MEN';
};

// Solar holidays repeat on the same day. Lunar ones move every year, so they
// are seeded as one-off dates for the coming year and re-added by hand.
export const DEFAULT_HOLIDAYS: DefaultHoliday[] = [
  { name: 'Tết Dương lịch', date: '2000-01-01', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày thành lập Đảng Cộng sản Việt Nam', date: '2000-02-03', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Thầy thuốc Việt Nam', date: '2000-02-27', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Quốc tế Phụ nữ', date: '2000-03-08', isYearly: true, audience: 'WOMEN' },
  { name: 'Ngày thành lập Đoàn TNCS Hồ Chí Minh', date: '2000-03-26', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Giải phóng miền Nam, thống nhất đất nước', date: '2000-04-30', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Quốc tế Lao động', date: '2000-05-01', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Chiến thắng Điện Biên Phủ', date: '2000-05-07', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày sinh Chủ tịch Hồ Chí Minh', date: '2000-05-19', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Quốc tế Thiếu nhi', date: '2000-06-01', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Báo chí Cách mạng Việt Nam', date: '2000-06-21', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Gia đình Việt Nam', date: '2000-06-28', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Thương binh - Liệt sĩ', date: '2000-07-27', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Cách mạng tháng Tám', date: '2000-08-19', isYearly: true, audience: 'EVERYONE' },
  { name: 'Quốc khánh', date: '2000-09-02', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Doanh nhân Việt Nam', date: '2000-10-13', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày Phụ nữ Việt Nam', date: '2000-10-20', isYearly: true, audience: 'WOMEN' },
  { name: 'Ngày Nhà giáo Việt Nam', date: '2000-11-20', isYearly: true, audience: 'EVERYONE' },
  { name: 'Ngày thành lập Quân đội nhân dân Việt Nam', date: '2000-12-22', isYearly: true, audience: 'EVERYONE' },
  { name: 'Giáng sinh', date: '2000-12-24', isYearly: true, audience: 'EVERYONE' },
  { name: 'Tết ông Công ông Táo', date: '2027-01-30', isYearly: false, audience: 'EVERYONE' },
  { name: 'Tết Nguyên đán Đinh Mùi', date: '2027-02-06', isYearly: false, audience: 'EVERYONE' },
  { name: 'Rằm tháng Giêng', date: '2027-02-20', isYearly: false, audience: 'EVERYONE' },
  { name: 'Tết Hàn thực', date: '2027-04-09', isYearly: false, audience: 'EVERYONE' },
  { name: 'Giỗ Tổ Hùng Vương', date: '2027-04-16', isYearly: false, audience: 'EVERYONE' },
  { name: 'Tết Đoan Ngọ', date: '2027-06-09', isYearly: false, audience: 'EVERYONE' },
  { name: 'Lễ Vu Lan', date: '2027-08-16', isYearly: false, audience: 'EVERYONE' },
  { name: 'Tết Trung thu', date: '2027-09-15', isYearly: false, audience: 'EVERYONE' },
];
