import { RECORD_WRITE_BATCH_SIZE } from '../../constants/send-limits';
import { type ApiClient } from '../../types/api-client';
import { type EmailSendDraft } from '../../types/email-send-draft';
import { chunk } from '../../utils/chunk.util';
import { executeWithRetry } from '../../utils/execute-with-retry.util';

export const createEmailSendRecords = async (
  client: ApiClient,
  drafts: EmailSendDraft[],
): Promise<void> => {
  for (const batch of chunk(drafts, RECORD_WRITE_BATCH_SIZE)) {
    await executeWithRetry(() =>
      client.mutation({
        createEmailSends: { __args: { data: batch }, id: true },
      }),
    );
  }
};
