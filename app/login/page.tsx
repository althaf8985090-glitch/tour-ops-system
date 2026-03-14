import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Login page for authenticating guides and admins.
// Uses a Suspense fallback while the login form is loading.
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-black p-8">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

