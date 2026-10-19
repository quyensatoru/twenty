import { type buildProspectExportFiles } from './export-prospects';

// Worker blob URLs cannot be opened by the host. A script-free download frame
// owns its links and is granted only the renderer's sandboxed download capability.
export const buildProspectExportDownloadDocument = (
  files: ReturnType<typeof buildProspectExportFiles>,
  colorScheme: 'light' | 'dark',
): string => `<!doctype html>
<html><head><meta charset="utf-8"><style>
:root { color-scheme: ${colorScheme}; }
body { margin: 0; color: ${colorScheme === 'dark' ? '#e6e6e6' : '#666'}; font: 13px Inter, system-ui, sans-serif; }
nav { display: flex; gap: 4px; padding: 2px; }
a { align-items: center; box-sizing: border-box; display: inline-flex; height: 28px; padding: 0 10px; border: 1px solid ${colorScheme === 'dark' ? '#333333' : '#ebebeb'}; border-radius: 8px; color: inherit; font-weight: 500; text-decoration: none; white-space: nowrap; }
a:hover, a:focus-visible { background: ${colorScheme === 'dark' ? '#ffffff0a' : '#0000000a'}; outline: none; border-color: #1961ed; }
</style></head><body><nav>
<a href="data:${files.csv.mimeType};base64,${files.csv.base64}" download="${files.csv.filename}">CSV</a>
<a href="data:${files.xlsx.mimeType};base64,${files.xlsx.base64}" download="${files.xlsx.filename}">Excel (.xlsx)</a>
</nav></body></html>`;
