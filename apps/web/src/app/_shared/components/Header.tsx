'use client';

import Link from 'next/link';
import { parseAsBoolean, useQueryState } from 'nuqs';

import Logo from '@/app/_ui/components/Logo/Logo';
import type { User } from '@/database/schema';

import UserDropdown from './UserDropdown';

export interface HeaderProps {
  user: User;
}

const Header = ({ user }: HeaderProps) => {
  const [headerHidden] = useQueryState(
    'header_hidden',
    parseAsBoolean.withDefault(false)
  );

  if (headerHidden) {
    return null;
  }

  return (
    <div className="bg-surface-primary border-border-muted sticky top-0 z-10 flex h-14 border-b">
      <div className="container flex items-center justify-between">
        <Link href="/chat">
          <Logo className="h-12 w-auto" />
        </Link>
        <UserDropdown user={user} />
      </div>
    </div>
  );
};

export default Header;
