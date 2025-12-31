"use client";

import {usePrivy} from '@privy-io/react-auth';
import Login from "@/components/auth/login";

export default function Home() {
    const {ready} = usePrivy();
    if (!ready) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <div className="flex flex-col items-center gap-4">
                <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                    Factoring Square
                </h1>

                <Login/>

            </div>
        </div>
    );
}
