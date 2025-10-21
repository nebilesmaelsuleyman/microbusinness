'use client';
/* ==========================================================================
   Thin compatibility shim mapping the react-router-dom API the pages were
   written against onto Next.js navigation. Lets the migrated pages keep their
   original imports with minimal changes.
   ========================================================================== */
import NextLink from 'next/link';
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';
import { useEffect, type ReactNode, type AnchorHTMLAttributes } from 'react';

type LinkProps = { to: string; children: ReactNode } & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
>;

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <NextLink href={to} {...rest}>
      {children}
    </NextLink>
  );
}

type NavLinkProps = LinkProps & { end?: boolean };

export function NavLink({ to, end, className, children, ...rest }: NavLinkProps) {
  const pathname = usePathname() ?? '';
  const isActive = end ? pathname === to : to === '/' ? pathname === '/' : pathname.startsWith(to);
  const base = typeof className === 'string' ? className : '';
  return (
    <NextLink href={to} className={isActive ? `${base} active`.trim() : base} {...rest}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to: string | number, opts?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      router.back();
      return;
    }
    if (opts?.replace) router.replace(to);
    else router.push(to);
  };
}

export function useParams<T = Record<string, string>>(): T {
  return useNextParams() as unknown as T;
}

export function useSearchParams() {
  return [useNextSearchParams()] as const;
}

export function useLocation() {
  const pathname = usePathname() ?? '';
  const search = useNextSearchParams()?.toString() ?? '';
  return { pathname, search: search ? `?${search}` : '' };
}

/** Declarative redirect, mirroring react-router's <Navigate />. */
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [to, replace, router]);
  return null;
}
