import { type Occurrence } from '../../types/occurrence';

export const pickDefaultTemplate = (occurrence: Occurrence): { templateKey: string; cardKind: 'GREETING' | 'INVITATION' } => {
  if (occurrence.kind === 'BIRTHDAY') {
    return { templateKey: 'birthday', cardKind: 'GREETING' };
  }

  if (occurrence.kind === 'ANNIVERSARY') {
    return { templateKey: 'anniversary', cardKind: 'GREETING' };
  }

  if (occurrence.kind === 'CUSTOM') {
    return { templateKey: 'party', cardKind: 'INVITATION' };
  }

  const title = occurrence.title.toLowerCase();

  if (title.includes('quốc tế phụ nữ') || occurrence.date.endsWith('-03-08')) {
    return { templateKey: 'women-intl', cardKind: 'GREETING' };
  }

  if (title.includes('phụ nữ') || occurrence.date.endsWith('-10-20')) {
    return { templateKey: 'women', cardKind: 'GREETING' };
  }

  if (title.includes('tết')) {
    return { templateKey: 'tet', cardKind: 'GREETING' };
  }

  return { templateKey: 'party', cardKind: 'GREETING' };
};

export const pickDefaultRecipient = (occurrence: Occurrence): string => {
  if (occurrence.memberName !== null) {
    return occurrence.memberName;
  }

  if (occurrence.audience === 'WOMEN') {
    return 'Gửi các chị em';
  }

  if (occurrence.audience === 'MEN') {
    return 'Gửi các anh em';
  }

  return occurrence.kind === 'CUSTOM' ? 'Kính mời cả team' : 'Gửi cả team';
};

export const pickDefaultMessage = (occurrence: Occurrence): string => {
  if (occurrence.kind === 'BIRTHDAY') {
    return 'Chúc bạn tuổi mới thật rực rỡ, nhiều sức khoẻ và luôn giữ ngọn lửa sáng tạo.';
  }

  if (occurrence.kind === 'ANNIVERSARY') {
    return `Cảm ơn bạn vì ${occurrence.years ?? ''} năm đồng hành cùng team. Chặng đường tiếp theo còn nhiều điều tuyệt vời.`;
  }

  if (occurrence.kind === 'CUSTOM') {
    return 'Cùng nhau gặp mặt và tạo thêm những kỷ niệm đáng nhớ nhé.';
  }

  return 'Chúc cả nhà một ngày thật vui và ý nghĩa.';
};
