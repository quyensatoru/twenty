import { useState } from 'react';
import { MetadataApiClient } from 'twenty-client-sdk/metadata';
import { AppPath, navigate, t } from 'twenty-sdk/front-component';
import {
  IconArrowLeft,
  IconExternalLink,
  IconMessage,
  IconShoppingBag,
} from 'twenty-ui/icon';

import { useIssueCrispConversations } from '../hooks/use-issue-crisp-conversations';
import { readErrorText } from '../utils/read-error-text.util';
import { IssueConversationPreview } from './issue-conversation-preview';
import { IssueMerchantPreview } from './issue-merchant-preview';
import { TaskIconButton } from './task-icon-button';
import { TaskSelect } from './task-select';
import { TaskMessage } from './task-message';

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
      label: `${t('Merchant')}: ${merchant.name ?? merchant.id}`,
    })),
    ...conversations.map((conversation) => ({
      objectNameSingular: 'crispConversation' as const,
      recordId: conversation.id,
      label: `${t('Conversation')}: ${conversation.visitorName ?? conversation.visitorEmail ?? conversation.shopDomain ?? t('Visitor')}`,
    })),
  ];
  const recordKey = `${target.objectNameSingular}:${target.recordId}`;
  const options = records.map((record) => ({
    value: `${record.objectNameSingular}:${record.recordId}`,
    label: record.label,
  }));
  if (!options.some((option) => option.value === recordKey))
    options.push({
      value: recordKey,
      label:
        target.label ?? (isConversation ? t('Conversation') : t('Merchant')),
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
      <header
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 8,
          paddingBottom: 12,
          flexShrink: 0,
        }}
      >
        <TaskIconButton label={t('Back to details')} onClick={onBack}>
          <IconArrowLeft size={16} />
        </TaskIconButton>
        {isConversation ? (
          <IconMessage size={16} />
        ) : (
          <IconShoppingBag size={16} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <TaskSelect
            ariaLabel={t('Linked records')}
            value={recordKey}
            options={options}
            width="100%"
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
          <IconExternalLink size={16} />
        </TaskIconButton>
      </header>
      {error !== null && (
        <div role="alert">
          <TaskMessage text={error} tone="danger" />
        </div>
      )}
      {isConversation ? (
        <IssueConversationPreview
          key={target.recordId}
          conversationId={target.recordId}
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
