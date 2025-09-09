import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const MobileNav = () => {
  const location = useLocation();
  
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/mind-games', label: 'Mind Games' },
    { to: '/about', label: 'About AutoNate' },
    { to: '/auth', label: 'Login' },
  ];

  const getActiveClass = (path: string) => {
    return location.pathname === path
      ? 'text-primary font-medium border-b-2 border-primary'
      : 'text-muted-foreground hover:text-primary';
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col space-y-4 mt-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-lg py-2 px-3 rounded-md transition-colors ${getActiveClass(link.to)}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;