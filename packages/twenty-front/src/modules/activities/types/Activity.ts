export type Activity = {
  id: string;
  createdAt: string;
  // Fetched with every record, the generated types just do not spell it out.
  createdBy?: {
    name: string;
    source: string;
  };
  updatedAt: string;
  title: string;
  bodyV2?: {
    blocknote: string | null;
    markdown: string | null;
  };
};
