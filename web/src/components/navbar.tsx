'use client';

import Link from "next/link";

const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <Link href="/" className="text-xl font-bold text-foreground font-mono flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary"></div>
                        Factoring Square
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
