'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { href: '/fantasy-football', label: 'Fantasy Football' },
    { href: '/writing', label: 'Writing' },
    { href: '/resume', label: 'Resume' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="tom-critchlow-header">
      <div className="header-layout">
        <Link href="/" className="site-name">
          Isaac Vazquez
        </Link>
        <nav className="header-nav">
          <ul>
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? 'active' : ''}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
