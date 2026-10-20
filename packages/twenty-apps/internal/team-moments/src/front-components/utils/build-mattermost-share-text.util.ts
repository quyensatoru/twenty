export const buildMattermostShareText = ({ imageUrl, shareUrl }: { imageUrl: string; shareUrl: string }): string =>
  `[![Thiệp Team Moments](${imageUrl})](${shareUrl})`;
