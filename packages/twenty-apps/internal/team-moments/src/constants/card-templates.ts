export type CardDecoration = 'floral' | 'confetti' | 'frame';

export type CardTemplate = {
  key: string;
  name: string;
  short: string;
  ground: string;
  ink: string;
  ornament: string;
  decoration: CardDecoration;
  eyebrow: string;
  headline: string;
};

export const CARD_TEMPLATES: CardTemplate[] = [
  { key: 'women', name: 'Phụ nữ 20/10', short: '20/10', ground: '#6E1A42', ink: '#FFF5F8', ornament: '#F7A8C8', decoration: 'floral', eyebrow: 'NGÀY PHỤ NỮ VIỆT NAM', headline: 'Chúc mừng\n20 tháng 10' },
  { key: 'birthday', name: 'Sinh nhật', short: 'HBD', ground: '#FFE4CC', ink: '#5C2204', ornament: '#F76B15', decoration: 'confetti', eyebrow: 'CHÚC MỪNG SINH NHẬT', headline: 'Happy\nBirthday' },
  { key: 'anniversary', name: 'Kỷ niệm làm việc', short: 'Kỷ niệm', ground: '#13306E', ink: '#EEF3FF', ornament: '#8FB0F5', decoration: 'frame', eyebrow: 'KỶ NIỆM ĐỒNG HÀNH', headline: 'Cảm ơn\nvì đã đồng hành' },
  { key: 'party', name: 'Tiệc / thiệp mời', short: 'Party', ground: '#0F2A22', ink: '#F3EBD3', ornament: '#C9A85C', decoration: 'frame', eyebrow: 'THIỆP MỜI', headline: 'Trân trọng\nkính mời' },
  { key: 'tet', name: 'Tết Nguyên đán', short: 'Tết', ground: '#8E1B1B', ink: '#FFF0D6', ornament: '#E8B04B', decoration: 'floral', eyebrow: 'CHÚC MỪNG NĂM MỚI', headline: 'An khang\nthịnh vượng' },
  { key: 'women-intl', name: 'Quốc tế Phụ nữ 8/3', short: '8/3', ground: '#F9E3EC', ink: '#5E1236', ornament: '#D6409F', decoration: 'floral', eyebrow: 'QUỐC TẾ PHỤ NỮ 8/3', headline: 'Happy\nWomen’s Day' },
];

export const findCardTemplate = (key: string | null | undefined): CardTemplate =>
  CARD_TEMPLATES.find((template) => template.key === key) ?? CARD_TEMPLATES[1];
