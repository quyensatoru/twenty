import { useCallback, useEffect, useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import { enqueueSnackbar, useRecordId } from 'twenty-sdk/front-component';

import { ENRICH_PROSPECT_LINKEDIN_MANUAL_ROUTE_PATH } from '../constants/route-paths';
import { PROSPECT_LINKEDIN_FRONT_COMPONENT_UID } from '../constants/universal-identifiers';
import { postAppRoute } from './utils/post-app-route.util';

type LinkedinStatus = {
  primaryUrl: string | null;
  primaryLabel: string | null;
  secondaryCount: number;
  checkedAt: string | null;
};

const loadStatus = (prospectId: string) =>
  postAppRoute<{ success: boolean; dryRun: boolean } & LinkedinStatus>(
    ENRICH_PROSPECT_LINKEDIN_MANUAL_ROUTE_PATH,
    { prospectId, dryRun: true },
  );

const recheck = (prospectId: string) =>
  postAppRoute<{ success: boolean }>(
    ENRICH_PROSPECT_LINKEDIN_MANUAL_ROUTE_PATH,
    { prospectId },
  );

const formatCheckedAt = (checkedAt: string | null): string => {
  if (checkedAt === null) {
    return 'never checked';
  }

  const time = new Date(checkedAt).getTime();

  if (Number.isNaN(time)) {
    return 'never checked';
  }

  return `checked ${new Date(checkedAt).toLocaleString()}`;
};

// Record-page panel for one prospect: what the batch found plus a manual
// re-check. The cron is the steady state; this button is for "BD is on the
// phone with this shop right now".
const ProspectLinkedin = () => {
  const prospectId = useRecordId();
  const [status, setStatus] = useState<LinkedinStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const refresh = useCallback(async () => {
    if (prospectId === null) {
      return;
    }

    setIsLoading(true);

    try {
      setStatus(await loadStatus(prospectId));
    } catch {
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [prospectId]);

  useEffect(() => {
    setStatus(null);
    void refresh();
  }, [refresh]);

  const handleRecheck = async () => {
    if (prospectId === null || isRunning) {
      return;
    }

    setIsRunning(true);

    try {
      await recheck(prospectId);
      await refresh();
      await enqueueSnackbar({
        message: 'LinkedIn re-check finished.',
        variant: 'success',
      });
    } catch (error) {
      await enqueueSnackbar({
        message:
          error instanceof Error ? error.message : 'Re-check failed.',
        variant: 'error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--t-font-family, Inter, sans-serif)',
        gap: 8,
        width: '100%',
      }}
    >
      {isLoading || status === null ? (
        <span
          style={{
            color: 'var(--t-font-color-tertiary, #999999)',
            fontSize: 13,
          }}
        >
          {isLoading ? 'Loading LinkedIn status…' : 'LinkedIn status unavailable.'}
        </span>
      ) : (
        <>
          {status.primaryUrl === null ? (
            <span
              style={{
                color: 'var(--t-font-color-tertiary, #999999)',
                fontSize: 13,
              }}
            >
              No LinkedIn page found ({formatCheckedAt(status.checkedAt)}).
            </span>
          ) : (
            <span style={{ fontSize: 13 }}>
              <a
                href={status.primaryUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: 'var(--t-color-blue, #1961ed)',
                  fontWeight: 500,
                }}
              >
                {status.primaryLabel || status.primaryUrl}
              </a>
              {status.secondaryCount > 0 ? (
                <span
                  style={{
                    color: 'var(--t-font-color-tertiary, #999999)',
                  }}
                >
                  {` +${status.secondaryCount} more`}
                </span>
              ) : null}
              <span
                style={{
                  color: 'var(--t-font-color-tertiary, #999999)',
                  fontSize: 12,
                }}
              >
                {` (${formatCheckedAt(status.checkedAt)})`}
              </span>
            </span>
          )}
          <span>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => void handleRecheck()}
              style={{
                alignItems: 'center',
                background: 'transparent',
                border:
                  '1px solid var(--t-border-color-medium, #ebebeb)',
                borderRadius: 'var(--t-border-radius-md, 8px)',
                boxSizing: 'border-box',
                color: 'var(--t-font-color-secondary, #666666)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                fontFamily: 'var(--t-font-family, Inter, sans-serif)',
                fontSize: 13,
                fontWeight: 500,
                height: 24,
                justifyContent: 'center',
                opacity: isRunning ? 0.5 : 1,
                padding: '0 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {isRunning ? 'Checking…' : 'Re-check LinkedIn'}
            </button>
          </span>
        </>
      )}
    </section>
  );
};

export default defineFrontComponent({
  universalIdentifier: PROSPECT_LINKEDIN_FRONT_COMPONENT_UID,
  name: 'prospect-linkedin',
  description:
    "One prospect's LinkedIn enrichment state with a manual re-check button.",
  component: ProspectLinkedin,
});
