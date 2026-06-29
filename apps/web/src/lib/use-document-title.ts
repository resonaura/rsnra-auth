import { useEffect } from 'react';

const BASE = 'RSNRA Auth';

/**
 * Set the document title. Pass a page name to get "Page · RSNRA Auth",
 * or pass nothing to reset to just "RSNRA Auth".
 */
export function useDocumentTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `${page} · ${BASE}` : BASE;
    return () => {
      document.title = BASE;
    };
  }, [page]);
}
