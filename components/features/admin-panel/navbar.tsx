import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/features/admin-panel/user-nav";
import { SheetMenu } from "@/components/features/admin-panel/sheet-menu";
import HeaderAuth from "@/components/header-auth";

interface NavbarProps {
  title: string;
}

export function Navbar({ title }: NavbarProps) {
  return (
    <header className="fixed top-0 right-0 left-[var(--sidebar-width,0px)] transition-all duration-300 z-10 w-auto border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-4 sm:mx-8 flex h-14 items-center">
        <div className="flex items-center space-x-4 lg:space-x-0">
          <SheetMenu />
          <h1 className="font-bold">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <ModeToggle />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
