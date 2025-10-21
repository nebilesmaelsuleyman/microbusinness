import Home from '../views/Home';
import { searchProvidersSSR, listCategoriesSSR } from '../api/server';

// Server Component: fetch the initial listing on the server so crawlers get real
// HTML (and the page is fast on first paint), then hand off to the interactive
// client component for filtering/search.
export default async function HomePage() {
  const [providers, categories] = await Promise.all([
    searchProvidersSSR('?limit=24'),
    listCategoriesSSR(),
  ]);

  return <Home initialProviders={providers ?? []} initialCategories={categories ?? []} />;
}
