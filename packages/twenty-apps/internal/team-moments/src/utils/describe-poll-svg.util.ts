import { type PollOption, type PollRow } from '../types/moments-records';

const WIDTH = 560;
const BAR_HEIGHT = 28;
const BAR_GAP = 14;
const TOP_PADDING = 64;
const SIDE_PADDING = 28;

const escapeXml = (value: string): string =>
  value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char] ?? char));

const countVotesFor = (poll: Pick<PollRow, 'votes'>, optionId: string): number =>
  (poll.votes ?? []).filter((vote) => vote.optionId === optionId).length;

// A plain bar chart, not a photo: Mattermost fetches this URL itself to
// render the attachment thumbnail, so it has to work as a public, unauthenticated
// image that reveals only the question and tally, never a voter's identity.
export const describePollSvg = (poll: Pick<PollRow, 'question' | 'options' | 'votes'>): string => {
  const totalVotes = (poll.votes ?? []).length;
  const options: PollOption[] = poll.options ?? [];
  const height = TOP_PADDING + options.length * (BAR_HEIGHT + BAR_GAP) + 16;
  const maxBarWidth = WIDTH - SIDE_PADDING * 2 - 140;

  const bars = options
    .map((option, index) => {
      const votes = countVotesFor(poll, option.id);
      const ratio = totalVotes === 0 ? 0 : votes / totalVotes;
      const barWidth = Math.max(2, Math.round(maxBarWidth * ratio));
      const y = TOP_PADDING + index * (BAR_HEIGHT + BAR_GAP);
      const label = `${option.emoji ?? ''} ${option.label}`.trim();
      const percent = totalVotes === 0 ? 0 : Math.round(ratio * 100);

      return `
        <text x="${SIDE_PADDING}" y="${y + BAR_HEIGHT / 2 + 5}" font-size="15" fill="#171A21" font-family="Inter, sans-serif">${escapeXml(label)}</text>
        <rect x="${SIDE_PADDING + 120}" y="${y}" width="${maxBarWidth}" height="${BAR_HEIGHT}" rx="6" fill="#EBEFFC" />
        <rect x="${SIDE_PADDING + 120}" y="${y}" width="${barWidth}" height="${BAR_HEIGHT}" rx="6" fill="#FF6353" />
        <text x="${WIDTH - SIDE_PADDING}" y="${y + BAR_HEIGHT / 2 + 5}" font-size="13" fill="#6E7391" font-family="Inter, sans-serif" text-anchor="end">${percent}% · ${votes}</text>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">
    <rect width="${WIDTH}" height="${height}" fill="#FFFFFF" />
    <text x="${SIDE_PADDING}" y="36" font-size="19" font-weight="700" fill="#171A21" font-family="Inter, sans-serif">${escapeXml(poll.question)}</text>
    ${bars}
  </svg>`;
};
