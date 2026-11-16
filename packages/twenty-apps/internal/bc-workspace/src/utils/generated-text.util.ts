import { type TranslationValues } from './translate.util';

type Translate = (message: string, values?: TranslationValues) => string;

type Pattern = {
  pattern: RegExp;
  render: (match: RegExpMatchArray, t: Translate) => string;
};

// Literal t() calls so the catalog extraction keeps these verbs.
const translateVerb = (verb: string, t: Translate): string => {
  switch (verb) {
    case 'installed':
      return t('installed');
    case 'upgraded':
      return t('upgraded');
    case 'downgraded':
      return t('downgraded');
    case 'uninstalled':
      return t('uninstalled');
    case 'reinstalled':
      return t('reinstalled');
    case 'cancelled':
      return t('cancelled');
    default:
      return verb;
  }
};

const translateName = (name: string, t: Translate): string =>
  name === 'nobody'
    ? t('nobody')
    : name === 'a former member'
      ? t('a former member')
      : name;

// Timeline entries and automatic task titles are stored in English by the
// server; the page renders them in the reader's language. Order matters:
// the first matching pattern wins.
const PATTERNS: Pattern[] = [
  {
    pattern: /^Task created: (.*)$/s,
    render: (match, t) =>
      t('Task created: {title}', { title: translateGeneratedText(match[1], t) }),
  },
  {
    pattern: /^Task completed: (.*)$/s,
    render: (match, t) =>
      t('Task completed: {title}', { title: translateGeneratedText(match[1], t) }),
  },
  {
    pattern: /^Status changed to (.*)$/,
    render: (match, t) =>
      t('Status changed to {status}', { status: t(match[1]) }),
  },
  {
    pattern: /^PIC changed from (.*) to (.*)$/,
    render: (match, t) =>
      t('PIC changed from {from} to {to}', {
        from: translateName(match[1], t),
        to: translateName(match[2], t),
      }),
  },
  {
    pattern: /^AI detected issue: (.*)$/s,
    render: (match, t) => t('AI detected issue: {title}', { title: match[1] }),
  },
  {
    pattern: /^Issue logged: (.*)$/s,
    render: (match, t) => t('Issue logged: {title}', { title: match[1] }),
  },
  {
    pattern: /^Issue confirmed resolved: (.*)$/s,
    render: (match, t) =>
      t('Issue confirmed resolved: {title}', { title: match[1] }),
  },
  {
    pattern: /^Issue dismissed as false positive: (.*)$/s,
    render: (match, t) =>
      t('Issue dismissed as false positive: {title}', { title: match[1] }),
  },
  {
    pattern: /^Client wrote again about: (.*)$/s,
    render: (match, t) =>
      t('Client wrote again about: {title}', { title: match[1] }),
  },
  {
    pattern: /^Developer task created: (.*)$/s,
    render: (match, t) =>
      t('Developer task created: {title}', { title: match[1] }),
  },
  {
    pattern: /^Crisp message from the client$/,
    render: (_match, t) => t('Crisp message from the client'),
  },
  {
    pattern: /^Crisp message from (.*)$/,
    render: (match, t) => t('Crisp message from {name}', { name: match[1] }),
  },
  {
    pattern: /^Follow up on issue: (.*)$/s,
    render: (match, t) => t('Follow up on issue: {title}', { title: match[1] }),
  },
  {
    pattern: /^Follow up with (.*): no reply to the last BC message$/,
    render: (match, t) =>
      t('Follow up with {client}: no reply to the last BC message', { client: match[1] }),
  },
  {
    pattern: /^Welcome (.*) and plan onboarding$/,
    render: (match, t) =>
      t('Welcome {client} and plan onboarding', { client: match[1] }),
  },
  {
    pattern: /^Understand downgrade of (\S+) at (.*)$/,
    render: (match, t) =>
      t('Understand the downgrade of {app} at {client}', {
        app: match[1],
        client: match[2],
      }),
  },
  {
    pattern: /^Understand why (.*) (installed|upgraded|downgraded|uninstalled|reinstalled|cancelled) (.*)$/,
    render: (match, t) =>
      t('Understand why {client} {action} {app}', {
        client: match[1],
        action: translateVerb(match[2], t),
        app: match[3],
      }),
  },
  {
    pattern: /^(\S+) usage reached (\d+)% of the (.*) allowance$/,
    render: (match, t) =>
      t('{app} usage reached {percent}% of the {plan} allowance', {
        app: match[1],
        percent: match[2],
        plan: match[3],
      }),
  },
  {
    pattern: /^(\S+) review published: (\d)★$/,
    render: (match, t) =>
      t('{app} review published: {rating}★', { app: match[1], rating: match[2] }),
  },
  {
    pattern: /^(\d)★ review published for (\S+)$/,
    render: (match, t) =>
      t('{rating}★ review published for {app}', { app: match[2], rating: match[1] }),
  },
  {
    pattern: /^(\S+) plan changed \((.*) → (.*)\)$/,
    render: (match, t) =>
      t('{app} plan changed ({from} → {to})', {
        app: match[1],
        from: match[2],
        to: match[3],
      }),
  },
  {
    pattern: /^(\S+) (installed|upgraded|downgraded|uninstalled|reinstalled|cancelled)(.*)$/,
    render: (match, t) =>
      `${match[1]} ${translateVerb(match[2], t)}${match[3]}`,
  },
];

export const translateGeneratedText = (text: string, t: Translate): string => {
  for (const { pattern, render } of PATTERNS) {
    const match = text.match(pattern);

    if (match !== null) {
      return render(match, t);
    }
  }

  // Fixed titles such as "Meeting" or "Email sent" are catalog keys already.
  return t(text);
};
