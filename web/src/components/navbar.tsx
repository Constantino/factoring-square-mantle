'use client';

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { useRoleStore, UserRole } from "@/stores/roleStore";
import { useUSDCBalance } from "@/hooks/use-usdc-balance";
import { useMNTBalance } from "@/hooks/use-mnt-balance";
import { useWalletAddress } from "@/hooks/use-wallet-address";
import {
    TooltipProvider,
} from "@/components/ui/tooltip";
import { CopyButton } from "@/components/copy-button";

interface RouteConfig {
    path: string;
    roles: UserRole[];
}

const Navbar = () => {
    const { isLoggedIn, user } = useUserStore();
    const { currentRole, setRole } = useRoleStore();
    const { balance: usdcBalance, isLoading: isLoadingUsdc } = useUSDCBalance();
    const { balance: mntBalance, isLoading: isLoadingMnt } = useMNTBalance();
    const { walletAddress } = useWalletAddress();
    const router = useRouter();
    const pathname = usePathname();

    // Define routes with their allowed roles
    const routes: RouteConfig[] = [
        { path: '/users', roles: ['Admin'] },
        { path: '/borrowers/loans', roles: ['Admin', 'Borrower'] },
        { path: '/loan-request', roles: ['Admin', 'Borrower'] },
        { path: '/borrower-kyb', roles: ['Admin', 'Borrower'] },
        { path: '/vaults', roles: ['Admin', 'Lender'] },
        { path: '/lenders/loans', roles: ['Admin', 'Lender'] },
    ];

    // Get first allowed route for a role
    const getFirstRouteForRole = (role: UserRole): string => {
        const firstRoute = routes.find(route => route.roles.includes(role));
        return firstRoute?.path || '/';
    };

    // Check if current route is allowed for the role
    const isRouteAllowedForRole = (path: string, role: UserRole): boolean => {
        const route = routes.find(r => path.startsWith(r.path));
        return route ? route.roles.includes(role) : true;
    };

    // Handle role change
    const handleRoleChange = (newRole: UserRole) => {
        setRole(newRole);
        
        // Check if current page is allowed for new role
        if (!isRouteAllowedForRole(pathname, newRole)) {
            // Redirect to first allowed route for this role
            const firstRoute = getFirstRouteForRole(newRole);
            router.push(firstRoute);
        }
    };

    // Extract username from email (text before @)
    const getUserName = () => {
        if (!user?.email) return '';
        return user.email.split('@')[0];
    };

    const roles: UserRole[] = ['Admin', 'Lender', 'Borrower'];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left Side - Logo and Role Selector */}
                    <div className="flex items-center gap-6">
                        {/* Logo/Brand */}
                        <Link href="/" className="text-xl font-bold text-foreground font-mono flex items-center gap-2">
                            <div className="w-3 h-3 bg-primary"></div>
                            Factoring Square
                        </Link>

                        {/* Role Selector */}
                        {isLoggedIn && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Role:</span>
                                <select
                                    value={currentRole}
                                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                                    className="text-sm px-3 py-1.5 border border-border rounded-md bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                                >
                                    {roles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Right Side - User Info */}
                    {isLoggedIn && user?.email && (
                        <div className="flex flex-col gap-1">
                            {/* Row 1: Balances and Username */}
                            <div className="flex items-center gap-4">
                                {/* MNT Balance */}
                                <div className="text-sm text-muted-foreground">
                                    {isLoadingMnt ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">{mntBalance} MNT</span>
                                    )}
                                </div>

                                {/* USDC Balance */}
                                <div className="text-sm text-muted-foreground">
                                    {isLoadingUsdc ? (
                                        <span>Loading...</span>
                                    ) : (
                                        <span className="font-mono">${usdcBalance} USDC</span>
                                    )}
                                </div>
                                
                                {/* Username */}
                                <div className="text-sm text-foreground font-medium">
                                    {getUserName()}
                                </div>
                            </div>

                            {/* Row 2: Wallet Address with Copy */}
                            {walletAddress && (
                                <TooltipProvider>
                                    <div className="flex items-center gap-2">
                                        <CopyButton
                                            textToCopy={walletAddress}
                                            displayText={walletAddress}
                                            iconSize={12}
                                            textSize="xs"
                                            showText={true}
                                        />
                                    </div>
                                </TooltipProvider>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
