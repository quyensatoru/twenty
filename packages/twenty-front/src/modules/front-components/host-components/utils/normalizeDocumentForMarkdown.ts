import { type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { type Transaction } from '@tiptap/pm/state';
import { isDefined, isSafeUrl } from 'twenty-shared/utils';

// Table cell attributes a markdown table has no syntax for, with the value
// that writes nothing.
const MARKDOWN_NEUTRAL_CELL_ATTRIBUTES: Record<string, unknown> = {
  textAlignment: 'left',
  textColor: 'default',
  backgroundColor: 'default',
  colwidth: null,
};

const TABLE_CELL_TYPE_NAMES = new Set(['tableCell', 'tableHeader']);

const readNeutralCellAttributes = (cell: ProseMirrorNode) => {
  let hasChanged = false;
  const attributes = { ...cell.attrs };

  for (const [name, neutralValue] of Object.entries(
    MARKDOWN_NEUTRAL_CELL_ATTRIBUTES,
  )) {
    if (name in attributes && attributes[name] !== neutralValue) {
      attributes[name] = neutralValue;
      hasChanged = true;
    }
  }

  return hasChanged ? attributes : null;
};

// A markdown table always has exactly one header row and no per-cell
// formatting, so the table is shown that way while editing too. Neither change
// alters a node's size, so positions read before them stay valid.
const normalizeTables = (transaction: Transaction) => {
  const { schema } = transaction.doc.type;
  const markups: {
    position: number;
    typeName: string;
    attributes: Record<string, unknown>;
  }[] = [];

  transaction.doc.descendants((node, position, _parent, index) => {
    if (node.type.name !== 'tableRow') {
      return true;
    }

    const cellTypeName = index === 0 ? 'tableHeader' : 'tableCell';

    node.forEach((cell, offset) => {
      if (!TABLE_CELL_TYPE_NAMES.has(cell.type.name)) {
        return;
      }

      const neutralAttributes = readNeutralCellAttributes(cell);

      if (cell.type.name !== cellTypeName || isDefined(neutralAttributes)) {
        markups.push({
          position: position + 1 + offset,
          typeName: cellTypeName,
          attributes: neutralAttributes ?? cell.attrs,
        });
      }
    });

    return false;
  });

  for (const { position, typeName, attributes } of markups) {
    transaction.setNodeMarkup(position, schema.nodes[typeName], attributes);
  }
};

// Markdown writes a file as a link and reads it back as one, so it becomes a
// link as soon as its upload lands instead of after the next save.
const replaceUploadedFilesWithLinks = (transaction: Transaction) => {
  const { schema } = transaction.doc.type;
  const files: { position: number; node: ProseMirrorNode }[] = [];

  transaction.doc.descendants((node, position) => {
    if (node.type.name === 'file' && node.attrs.url !== '') {
      files.push({ position, node });
    }

    return true;
  });

  for (const { position, node } of files.reverse()) {
    const url = String(node.attrs.url);
    const name = String(node.attrs.name ?? '');
    const link = schema.text(name === '' ? url : name, [
      schema.marks.link.create({ href: url }),
    ]);

    transaction.replaceWith(
      position,
      position + node.nodeSize,
      schema.nodes.paragraph.create(null, link),
    );
  }
};

const BARE_DOMAIN = /^[\w-]+(\.[\w-]+)+([/?#].*)?$/;

// The server refuses a whole save when one link is not http(s), mailto, tel or
// a same-origin path. A bare domain typed into the link field is what someone
// meant as https; anything else (`#anchor`, `javascript:`) keeps its text and
// loses the link.
const readSafeHref = (href: string): string | null => {
  const trimmedHref = href.trim();

  if (isSafeUrl(trimmedHref)) {
    return trimmedHref;
  }

  const httpsHref = `https://${trimmedHref}`;

  return BARE_DOMAIN.test(trimmedHref) && isSafeUrl(httpsHref)
    ? httpsHref
    : null;
};

const repairLinksTheServerRefuses = (transaction: Transaction) => {
  const linkMarkType = transaction.doc.type.schema.marks.link;
  const repairs: {
    from: number;
    to: number;
    href: string | null;
    mark: ProseMirrorNode['marks'][number];
  }[] = [];

  transaction.doc.descendants((node, position) => {
    const mark = node.marks.find(
      (candidate) => candidate.type === linkMarkType,
    );
    const href = String(mark?.attrs.href ?? '');

    if (isDefined(mark) && readSafeHref(href) !== href) {
      repairs.push({
        from: position,
        to: position + node.nodeSize,
        href: readSafeHref(href),
        mark,
      });
    }

    return true;
  });

  for (const { from, to, href, mark } of repairs) {
    transaction.removeMark(from, to, mark);

    if (isDefined(href)) {
      transaction.addMark(
        from,
        to,
        linkMarkType.create({ ...mark.attrs, href }),
      );
    }
  }
};

// What markdown cannot store at all is removed from the document as soon as
// it appears, so the editor never shows anything that would not survive a
// save. Everything else it cannot spell natively (alignment, colours, toggles,
// nesting) is carried by convertBlocksToMarkdown instead.
export const normalizeDocumentForMarkdown = (transaction: Transaction) => {
  normalizeTables(transaction);
  replaceUploadedFilesWithLinks(transaction);
  repairLinksTheServerRefuses(transaction);

  return transaction.docChanged;
};
