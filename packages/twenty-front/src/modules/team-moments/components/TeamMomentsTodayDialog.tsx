import { styled } from '@linaria/react';
import { plural, t } from '@lingui/core/macro';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { navigationMenuItemsSelector } from '@/navigation-menu-item/common/states/navigationMenuItemsSelector';
import { TEAM_MOMENTS_PAGE_NAVIGATION_ITEM_NAME } from '@/team-moments/constants/TeamMomentsPageNavigationItemName';
import { TeamMomentsFireworks } from '@/team-moments/components/TeamMomentsFireworks';
import { type TeamMomentsToday } from '@/team-moments/types/TeamMomentsToday';
import { RootStackingContextZIndices } from '@/ui/layout/constants/RootStackingContextZIndices';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { NavigationMenuItemType } from '~/generated-metadata/graphql';
import { useNavigateApp } from '~/hooks/useNavigateApp';

// oxlint-disable-next-line twenty/no-hardcoded-colors -- The celebration backdrop keeps the same opacity in both themes.
const StyledBackdrop = styled.div`
  background: rgba(20, 8, 14, 0.45);
  inset: 0;
  position: fixed;
  z-index: ${RootStackingContextZIndices.RootModalBackDrop};
`;

const StyledDialog = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.xl};
  box-shadow: ${themeCssVariables.boxShadow.strong};
  left: 50%;
  max-width: calc(100vw - 32px);
  overflow: hidden;
  position: fixed;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 460px;
  z-index: ${RootStackingContextZIndices.RootModal};
`;

// oxlint-disable-next-line twenty/no-hardcoded-colors -- These are the Team Moments celebration colors.
const StyledHero = styled.div`
  background: #6e1a42;
  color: #fff5f8;
  overflow: hidden;
  padding: 24px 24px 22px;
  position: relative;
`;

const StyledFlower = styled.svg`
  pointer-events: none;
  position: absolute;
  right: -40px;
  top: -50px;
`;

// oxlint-disable-next-line twenty/no-hardcoded-colors -- The translucent white button sits on the fixed hero color.
const StyledCloseButton = styled.button`
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: inherit;
  cursor: pointer;
  display: flex;
  height: 28px;
  justify-content: center;
  position: absolute;
  right: 12px;
  top: 12px;
  width: 28px;
`;

const StyledEyebrow = styled.div`
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  letter-spacing: 0.08em;
  opacity: 0.85;
  position: relative;
  text-transform: uppercase;
`;

const StyledTitle = styled.h2`
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.15;
  margin: 8px 0 4px;
  position: relative;
`;

const StyledSubtitle = styled.div`
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.5;
  opacity: 0.9;
  position: relative;
`;

const StyledList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  list-style: none;
  margin: 0;
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledItem = styled.li`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledMark = styled.span<{ background: string; color: string }>`
  align-items: center;
  background: ${({ background }) => background};
  border-radius: 10px;
  color: ${({ color }) => color};
  display: flex;
  flex: none;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  height: 40px;
  justify-content: center;
  width: 40px;
`;

const StyledItemText = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledItemTitle = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

const StyledItemMeta = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledFooter = styled.div`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[6]}
    ${themeCssVariables.spacing[4]};
`;

const KIND_MARKS = {
  BIRTHDAY: {
    label: 'SN',
    background: themeCssVariables.tag.background.orange,
    color: themeCssVariables.tag.text.orange,
  },
  ANNIVERSARY: {
    label: 'KN',
    background: themeCssVariables.tag.background.blue,
    color: themeCssVariables.tag.text.blue,
  },
  HOLIDAY: {
    label: 'NL',
    background: themeCssVariables.tag.background.pink,
    color: themeCssVariables.tag.text.pink,
  },
  CUSTOM: {
    label: 'SK',
    background: themeCssVariables.tag.background.turquoise,
    color: themeCssVariables.tag.text.turquoise,
  },
} as const;

const PETAL_ANGLES = [0, 72, 144, 216, 288];

type TeamMomentsTodayDialogProps = {
  moments: TeamMomentsToday[];
  currentWorkspaceMemberId: string;
  onClose: () => void;
};

export const TeamMomentsTodayDialog = ({
  moments,
  currentWorkspaceMemberId,
  onClose,
}: TeamMomentsTodayDialogProps) => {
  const currentWorkspaceMembers = useAtomStateValue(
    currentWorkspaceMembersState,
  );
  const navigationMenuItems = useAtomStateValue(navigationMenuItemsSelector);
  const navigateApp = useNavigateApp();

  const momentsPageLayoutId = navigationMenuItems.find(
    (item) =>
      item.type === NavigationMenuItemType.PAGE_LAYOUT &&
      item.name === TEAM_MOMENTS_PAGE_NAVIGATION_ITEM_NAME,
  )?.pageLayoutId;

  const getMemberName = (memberId: string | null) => {
    const member = currentWorkspaceMembers.find(
      (workspaceMember) => workspaceMember.id === memberId,
    );

    return [member?.name?.firstName, member?.name?.lastName]
      .filter(isDefined)
      .join(' ')
      .trim();
  };

  // A member is celebrated by their own birthday or anniversary, and by any
  // occasion that honours their group, such as 20/10 for female members.
  const isHonoree = moments.some((moment) =>
    moment.honoreeIds.includes(currentWorkspaceMemberId),
  );

  const describeMoment = (moment: TeamMomentsToday) => {
    const isSelf = moment.memberId === currentWorkspaceMemberId;
    const memberName = getMemberName(moment.memberId);
    const years = moment.years ?? 0;

    switch (moment.kind) {
      case 'BIRTHDAY':
        return {
          title: isSelf ? t`Your birthday` : t`${memberName}'s birthday`,
          meta: years > 0 && years < 120 ? t`Turns ${years} today` : '',
        };
      case 'ANNIVERSARY':
        return {
          title: isSelf
            ? t`Your work anniversary`
            : t`${memberName}'s work anniversary`,
          meta: plural(years, {
            one: '# year with the team',
            other: '# years with the team',
          }),
        };
      case 'HOLIDAY':
      case 'CUSTOM': {
        const honoreeCount = moment.honoreeIds.length;
        const kindLabel =
          moment.kind === 'HOLIDAY' ? t`Holiday` : t`Team event`;

        if (moment.audience === 'EVERYONE') {
          return { title: moment.name, meta: kindLabel };
        }

        if (moment.honoreeIds.includes(currentWorkspaceMemberId)) {
          return {
            title: moment.name,
            meta: t`You are one of the people celebrated today`,
          };
        }

        return {
          title: moment.name,
          meta:
            moment.audience === 'WOMEN'
              ? plural(honoreeCount, {
                  one: 'Celebrating # female teammate',
                  other: 'Celebrating # female teammates',
                })
              : plural(honoreeCount, {
                  one: 'Celebrating # male teammate',
                  other: 'Celebrating # male teammates',
                }),
        };
      }
    }
  };

  const openMomentsPage = () => {
    onClose();

    if (isDefined(momentsPageLayoutId)) {
      navigateApp(AppPath.PageLayoutPage, {
        pageLayoutId: momentsPageLayoutId,
      });
    }
  };

  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date());

  return (
    <>
      <StyledBackdrop onClick={onClose} />
      <TeamMomentsFireworks />
      <StyledDialog
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-moments-today-title"
      >
        <StyledHero>
          <StyledFlower
            width="190"
            height="190"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            {/* oxlint-disable-next-line twenty/no-hardcoded-colors -- The flower is part of the fixed celebration artwork. */}
            <g fill="none" stroke="#F7A8C8" strokeWidth="1.4">
              {PETAL_ANGLES.map((angle) => (
                <ellipse
                  key={angle}
                  cx="100"
                  cy="62"
                  rx="20"
                  ry="38"
                  transform={`rotate(${angle} 100 100)`}
                />
              ))}
            </g>
          </StyledFlower>
          <StyledCloseButton
            type="button"
            aria-label={t`Close`}
            onClick={onClose}
          >
            <IconX size={14} />
          </StyledCloseButton>
          <StyledEyebrow>{t`Today · ${today}`}</StyledEyebrow>
          <StyledTitle id="team-moments-today-title">
            {isHonoree
              ? t`This day is all about you!`
              : plural(moments.length, {
                  one: 'A special day for the team',
                  other: '# special occasions today',
                })}
          </StyledTitle>
          <StyledSubtitle>
            {isHonoree
              ? t`Your teammates have something waiting for you.`
              : t`Take a minute to send your wishes.`}
          </StyledSubtitle>
        </StyledHero>
        <StyledList>
          {moments.map((moment) => {
            const { title, meta } = describeMoment(moment);
            const mark = KIND_MARKS[moment.kind];

            return (
              <StyledItem key={moment.key}>
                <StyledMark background={mark.background} color={mark.color}>
                  {mark.label}
                </StyledMark>
                <StyledItemText>
                  <StyledItemTitle>{title}</StyledItemTitle>
                  {meta.length > 0 && <StyledItemMeta>{meta}</StyledItemMeta>}
                </StyledItemText>
              </StyledItem>
            );
          })}
        </StyledList>
        <StyledFooter>
          <Button variant="outline" onClick={onClose}>
            {t`Later`}
          </Button>
          {isDefined(momentsPageLayoutId) && (
            <Button variant="solid" color="accent" onClick={openMomentsPage}>
              {isHonoree ? t`Open my wishes` : t`Send wishes`}
            </Button>
          )}
        </StyledFooter>
      </StyledDialog>
    </>
  );
};
