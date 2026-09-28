import juice from 'juice/client.js';

// Gmail and Outlook ignore most of <style>, so every rule is copied onto the
// elements it matches. Media queries cannot be inlined and stay in <style>,
// where the clients that support them (Apple Mail, iOS, Gmail app) apply them.
// Unparseable CSS leaves the document as it was rather than failing the send.
export const inlineEmailCss = (html: string): string => {
  try {
    return juice(html, {
      preserveMediaQueries: true,
      preserveFontFaces: true,
      preserveImportant: true,
      applyWidthAttributes: true,
      applyHeightAttributes: true,
    });
  } catch {
    return html;
  }
};
