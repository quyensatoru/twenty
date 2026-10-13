export const requireTaskAiPath = (path: string): string => {
  if (
    !path ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.split('/').some((part) => part === '..' || part === '.')
  ) {
    throw new Error('Use a repository-relative file path without traversal.');
  }
  return path;
};

export const createTaskAiBudget = () => {
  const files = new Set<string>();
  let bytes = 0;
  return {
    consume: (path: string, content: string) => {
      const size = new TextEncoder().encode(content).byteLength;
      if (
        size > 100 * 1024 ||
        bytes + size > 300 * 1024 ||
        (!files.has(path) && files.size >= 30)
      ) {
        throw new Error(
          'Repository context limit reached (30 files, 100 KB per file, 300 KB per turn). Narrow the question.',
        );
      }
      files.add(path);
      bytes += size;
    },
  };
};
