import { useState } from 'react';

import { type ErrorLike } from '@apollo/client';

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { getErrorMessageFromApolloError } from '~/utils/get-error-message-from-apollo-error.util';

export type ShiftRegistrationTemplateError = {
  templateId: string;
  message: string;
};

export type ShiftDayRegistrationResult = {
  successCount: number;
  errors: ShiftRegistrationTemplateError[];
};

// Registration is day-centric: the member opens a day, picks templates, and
// confirms. One create per picked template; the server pre-hook is the source
// of truth (duplicate / past date / inactive template / OT-slot-taken) so each
// rejection is keyed back to its template. A partial success still commits the
// good ones.
export const useShiftRegistration = ({
  memberId,
  refetch,
}: {
  memberId: string | undefined;
  refetch: () => Promise<unknown>;
}) => {
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: 'shift',
  });

  const [isRegistering, setIsRegistering] = useState(false);

  const registerShiftsForDay = async (
    date: string,
    templateIds: string[],
  ): Promise<ShiftDayRegistrationResult> => {
    if (templateIds.length === 0) {
      return { successCount: 0, errors: [] };
    }

    setIsRegistering(true);

    const results = await Promise.allSettled(
      templateIds.map((templateId) =>
        createOneRecord({
          date,
          shiftTemplateId: templateId,
          memberId,
        }),
      ),
    );

    const errors: ShiftRegistrationTemplateError[] = [];
    let successCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push({
          templateId: templateIds[index],
          message: getErrorMessageFromApolloError(result.reason as ErrorLike),
        });
      } else {
        successCount += 1;
      }
    });

    await refetch();
    setIsRegistering(false);

    return { successCount, errors };
  };

  return {
    isRegistering,
    registerShiftsForDay,
  };
};
