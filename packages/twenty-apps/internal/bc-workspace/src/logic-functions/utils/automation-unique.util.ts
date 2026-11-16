import { readErrorMessage } from './read-error-message.util';

// Two deliveries of one event can both miss the lookup and both create; the
// unique index then rejects the second. That second writer re-reads the
// record the first one made and carries on as if it had found it.
export const isUniqueViolation = (error: unknown): boolean =>
  /duplicate|unique|already exists/i.test(readErrorMessage(error));

export const createOrReadExisting = async <TRecord>({
  create,
  readExisting,
}: {
  create: () => Promise<TRecord>;
  readExisting: () => Promise<TRecord | null>;
}): Promise<{ record: TRecord; isNew: boolean }> => {
  try {
    return { record: await create(), isNew: true };
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const existing = await readExisting();

    if (existing === null) {
      throw error;
    }

    return { record: existing, isNew: false };
  }
};
