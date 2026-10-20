import { type OccurrenceKind } from '../../types/occurrence';

type KindStyle = {
  label: string;
  short: string;
  text: string;
  soft: string;
  solid: string;
};

// One hue per occasion kind, told apart by lightness as well as hue. The
// soft/text pairs keep 4.5:1 contrast for 12px tags.
export const KIND_STYLES: Record<OccurrenceKind, KindStyle> = {
  BIRTHDAY: { label: 'Sinh nhật', short: 'SN', text: '#A63A0A', soft: '#FFF1E7', solid: '#F76B15' },
  ANNIVERSARY: { label: 'Kỷ niệm làm việc', short: 'KN', text: '#1A4FB8', soft: '#EAF1FE', solid: '#1961ED' },
  HOLIDAY: { label: 'Ngày lễ', short: 'NL', text: '#9B1C5E', soft: '#FDEDF5', solid: '#D6409F' },
  CUSTOM: { label: 'Sự kiện riêng', short: 'SK', text: '#0B6B5F', soft: '#E5F6F3', solid: '#12A594' },
};

export const KIND_ORDER: OccurrenceKind[] = ['BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY', 'CUSTOM'];
