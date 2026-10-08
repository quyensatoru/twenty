import { t } from 'twenty-sdk/front-component';

// Written as literals inside t() because the extractor only sees literals.
export const readColorLabel = (color: string): string => {
  switch (color) {
    case 'red':
      return t('Red');
    case 'ruby':
      return t('Ruby');
    case 'crimson':
      return t('Crimson');
    case 'tomato':
      return t('Tomato');
    case 'orange':
      return t('Orange');
    case 'amber':
      return t('Amber');
    case 'yellow':
      return t('Yellow');
    case 'lime':
      return t('Lime');
    case 'grass':
      return t('Grass');
    case 'green':
      return t('Green');
    case 'jade':
      return t('Jade');
    case 'mint':
      return t('Mint');
    case 'turquoise':
      return t('Turquoise');
    case 'cyan':
      return t('Cyan');
    case 'sky':
      return t('Sky');
    case 'blue':
      return t('Blue');
    case 'iris':
      return t('Iris');
    case 'violet':
      return t('Violet');
    case 'purple':
      return t('Purple');
    case 'plum':
      return t('Plum');
    case 'pink':
      return t('Pink');
    case 'bronze':
      return t('Bronze');
    case 'gold':
      return t('Gold');
    case 'brown':
      return t('Brown');
    default:
      return t('Gray');
  }
};
