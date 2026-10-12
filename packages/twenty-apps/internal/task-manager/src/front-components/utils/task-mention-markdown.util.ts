export const TASK_MENTION_HREF_PREFIX = '#task-mention-';

export const buildTaskMentionHref = (memberId: string): string =>
  `${TASK_MENTION_HREF_PREFIX}${encodeURIComponent(memberId)}`;

export const buildTaskMentionMarkdown = (
  memberId: string,
  name: string,
): string => {
  const label = name.replace(/([\\`*_[\]<>])/g, '\\$1');
  return `[@${label}](${buildTaskMentionHref(memberId)})`;
};

export const stripTaskMentionMarkup = (markdown: string): string =>
  markdown.replace(
    /\[(@(?:\\.|[^\]\\])*)\]\(#task-mention-[^)]*\)/g,
    (_match, label: string) => label.replace(/\\([\\`*_[\]<>])/g, '$1'),
  );
