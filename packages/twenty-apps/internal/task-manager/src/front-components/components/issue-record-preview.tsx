import { useState } from 'react';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { AppPath, navigate, t } from 'twenty-sdk/front-component';
import {
  IconChevronLeft,
  IconExternalLink,
  IconMessage,
  IconShoppingBag,
  IconX,
} from 'twenty-ui/icon';

import { useIssueCrispConversations } from '../hooks/use-issue-crisp-conversations';
import { readErrorText } from '../utils/read-error-text.util';
import { IssueConversationPreview } from './issue-conversation-preview';
import { IssueMerchantPreview } from './issue-merchant-preview';
import { TaskBoardSelect } from './task-board-select';
import { TaskIconButton } from './task-icon-button';
import { TaskMessage } from './task-message';
import { TASK_TOKENS } from './task-tokens';

export type IssueRecordPreviewTarget = {
  objectNameSingular: 'merchant' | 'crispConversation';
  recordId: string;
  label?: string;
};

type IssueRecordPreviewProps = {
  issueId: string;
  target: IssueRecordPreviewTarget;
  merchants: { id: string; name?: string | null }[];
  onSelect: (target: IssueRecordPreviewTarget) => void;
  onOpenIssue: (issueId: string) => void;
  onBack: () => void;
  onOpenFull: () => void;
};

const PREVIEW_HEADER_HEIGHT = 44;

// This page is owned by Customer Support; its workspace ID differs per installation.
const SUPPORT_INBOX_PAGE_UID = 'b996993c-8898-41b1-adaf-927c6e470f5a';

export const IssueRecordPreview = ({
  issueId,
  target,
  merchants,
  onSelect,
  onOpenIssue,
  onBack,
  onOpenFull,
}: IssueRecordPreviewProps) => {
  const { conversations } = useIssueCrispConversations(
    issueId,
    merchants.map((merchant) => merchant.id),
  );
  const [error, setError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const isConversation = target.objectNameSingular === 'crispConversation';
  const records = [
    ...merchants.map((merchant) => ({
      objectNameSingular: 'merchant' as const,
      recordId: merchant.id,
      label: (merchant.name ?? merchant.id).replace(/\.myshopify\.com$/, ''),
    })),
    ...conversations.map((conversation) => ({
      objectNameSingular: 'crispConversation' as const,
      recordId: conversation.id,
      label:
        conversation.visitorName ??
        conversation.visitorEmail ??
        conversation.shopDomain ??
        t('Visitor'),
    })),
  ];
  const recordKey = `${target.objectNameSingular}:${target.recordId}`;
  const readRecordIcon = (objectNameSingular: string) =>
    objectNameSingular === 'crispConversation' ? (
      <IconMessage size={14} color={TASK_TOKENS.textTertiary} />
    ) : (
      <IconShoppingBag size={14} color={TASK_TOKENS.textTertiary} />
    );
  const options = records.map((record) => ({
    value: `${record.objectNameSingular}:${record.recordId}`,
    label: record.label,
    icon: readRecordIcon(record.objectNameSingular),
  }));
  if (!options.some((option) => option.value === recordKey))
    options.push({
      value: recordKey,
      label: (
        target.label ?? (isConversation ? t('Conversation') : t('Merchant'))
      ).replace(/^(Merchant|Conversation): /, ''),
      icon: readRecordIcon(target.objectNameSingular),
    });

  const openFull = async () => {
    setIsOpening(true);
    setError(null);
    try {
      if (isConversation) {
        const { getPageLayouts } = await new MetadataApiClient().query({
          getPageLayouts: { id: true, universalIdentifier: true },
        });
        const inbox = getPageLayouts.find(
          (page) => page.universalIdentifier === SUPPORT_INBOX_PAGE_UID,
        );
        if (inbox === undefined)
          throw new Error(t('Support inbox is not available.'));
        await navigate(
          `/page/${inbox.id}#conversation-${encodeURIComponent(target.recordId)}` as AppPath,
          undefined,
          undefined,
          { surface: 'main' },
        );
      } else {
        await navigate(
          AppPath.RecordShowPage,
          { objectNameSingular: 'merchant', objectRecordId: target.recordId },
          undefined,
          { surface: 'main' },
        );
      }
      onOpenFull();
    } catch (error) {
      setError(readErrorText(error));
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <section
      aria-label={t('Linked record preview')}
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        height: '100%',
      }}
    >
      {/* One 44px row, as in the design: back to the properties, the record
          switcher, open in full, close. The record's own name is not
          repeated under it. */}
      <header
        style={{
          alignItems: 'center',
          background: TASK_TOKENS.background,
          borderBottom: `1px solid ${TASK_TOKENS.border}`,
          boxSizing: 'border-box',
          display: 'flex',
          flexShrink: 0,
          gap: 6,
          height: PREVIEW_HEADER_HEIGHT,
          padding: '0 8px',
        }}
      >
        <TaskIconButton label={t('Back to properties')} onClick={onBack}>
          <IconChevronLeft size={15} />
        </TaskIconButton>
        <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
          <TaskBoardSelect
            ariaLabel={t('Linked records')}
            variant="ghost"
            value={recordKey}
            options={options}
            width="auto"
            isDisabled={isOpening}
            onChange={(value) => {
              const record = records.find(
                (record) =>
                  `${record.objectNameSingular}:${record.recordId}` === value,
              );
              if (record !== undefined) {
                setError(null);
                onSelect({
                  objectNameSingular: record.objectNameSingular,
                  recordId: record.recordId,
                });
              }
            }}
          />
        </div>
        <TaskIconButton
          label={
            isConversation
              ? t('Open full conversation')
              : t('Open merchant record')
          }
          onClick={() => void openFull()}
          isDisabled={isOpening}
        >
          <IconExternalLink size={14} />
        </TaskIconButton>
        <TaskIconButton label={t('Close preview')} onClick={onBack}>
          <IconX size={14} />
        </TaskIconButton>
      </header>
      {error !== null && (
        <div role="alert" style={{ padding: '8px 16px 0' }}>
          <TaskMessage text={error} tone="danger" />
        </div>
      )}
      {isConversation ? (
        <IssueConversationPreview
          key={target.recordId}
          conversationId={target.recordId}
          issueId={issueId}
          onOpenMerchant={(recordId, label) =>
            onSelect({
              objectNameSingular: 'merchant',
              recordId,
              label: label ?? undefined,
            })
          }
          onOpenIssue={onOpenIssue}
        />
      ) : (
        <IssueMerchantPreview
          key={target.recordId}
          merchantId={target.recordId}
          issueId={issueId}
          fallbackName={
            merchants.find((merchant) => merchant.id === target.recordId)
              ?.name ??
            target.label ??
            null
          }
          onOpenConversation={(recordId, label) =>
            onSelect({
              objectNameSingular: 'crispConversation',
              recordId,
              label,
            })
          }
          onOpenIssue={onOpenIssue}
        />
      )}
    </section>
  );
};
