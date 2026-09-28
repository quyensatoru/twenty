import { type UnsubscribePageCopy } from '../types/unsubscribe-page-copy';

// The unsubscribe page is opened by merchants, outside Twenty, so it follows
// the browser's language instead of a workspace member's locale.
export const UNSUBSCRIBE_PAGE_COPIES: Record<'en' | 'vi', UnsubscribePageCopy> =
  {
    en: {
      lang: 'en',
      confirmTitle: 'Unsubscribe',
      confirmMessage:
        'Stop receiving marketing emails from us? Service emails about your account still arrive.',
      confirmButton: 'Unsubscribe',
      doneTitle: 'You are unsubscribed',
      doneMessage: 'You will not receive marketing emails from us any more.',
      invalidTitle: 'Link not valid',
      invalidMessage:
        'This unsubscribe link is broken. Reply to any of our emails and we will remove you by hand.',
    },
    vi: {
      lang: 'vi',
      confirmTitle: 'Huỷ đăng ký',
      confirmMessage:
        'Bạn muốn ngừng nhận email marketing từ chúng tôi? Email dịch vụ liên quan đến tài khoản vẫn được gửi.',
      confirmButton: 'Huỷ đăng ký',
      doneTitle: 'Bạn đã huỷ đăng ký',
      doneMessage: 'Bạn sẽ không nhận email marketing từ chúng tôi nữa.',
      invalidTitle: 'Link không hợp lệ',
      invalidMessage:
        'Link huỷ đăng ký này bị lỗi. Hãy trả lời bất kỳ email nào của chúng tôi, chúng tôi sẽ gỡ bạn khỏi danh sách.',
    },
  };
