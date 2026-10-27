import { type ProductBacklogData } from '../../../types/product-backlog';
import { type PageInset } from '../../../types/task-board';
import { type ProductBacklogActions } from '../hooks/use-product-backlog';
import { type ProductBacklogModel } from '../hooks/use-product-backlog-model';

// What every Product Backlog tab is handed by the page.
export type ProductViewProps = {
  data: ProductBacklogData;
  model: ProductBacklogModel;
  actions: ProductBacklogActions;
  reload: () => Promise<void>;
  inset: PageInset;
  isMobile: boolean;
  onOpenItem: (issueId: string) => void;
};
