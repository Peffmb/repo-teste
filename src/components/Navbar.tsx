'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { cn } from './ui';

const navigation = [
  { name: 'Exercises', href: '/exercises' },
  { name: 'Workouts', href: '/workouts' },
  { name: 'Diet', href: '/diet' },
  { name: 'Weight', href: '/weight' },
];

export function Navbar() {
  const pathname = usePathname();
  const { isLoaded } = useUser();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">GymTrack</span>
              <span className="text-2xl font-bold text-gray-900 ml-1">Pro</span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isLoaded && <UserButton afterSignOutUrl="/" />}
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden pb-3">
          <div className="flex space-x-1 overflow-x-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
