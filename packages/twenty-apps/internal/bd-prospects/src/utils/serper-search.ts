export type WebSearchResult = {
  title?: string;
  url?: string;
  description?: string;
};

const SERPER_SEARCH_URL = 'https://google.serper.dev/search';
const RESULTS_PER_QUERY = 10;

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
};

export const serperSearch = async ({
  apiKey,
  query,
}: {
  apiKey: string;
  query: string;
}): Promise<WebSearchResult[]> => {
  const response = await fetch(SERPER_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({ q: query, num: RESULTS_PER_QUERY }),
  });

  if (!response.ok) {
    throw new Error(
      `Serper search failed for ${JSON.stringify(query)}: HTTP ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    organic?: SerperOrganicResult[];
  };

  return (body?.organic ?? []).map((result) => ({
    title: result?.title,
    url: result?.link,
    description: result?.snippet,
  }));
};
