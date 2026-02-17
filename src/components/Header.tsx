'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function Header() {
  const pathname = usePathname();

  const navigation = [
    { href: '/about', label: 'About' },
    { href: '/resume', label: 'Resume' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <header className="tom-critchlow-header">
      <div className="header-layout">
        <Link href="/" className="site-name">
          Isaac Vazquez
        </Link>
        <div className="header-actions flex items-center gap-3">
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
