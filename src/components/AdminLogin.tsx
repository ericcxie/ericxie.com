"use client";

import type { useAuth } from "@/lib/useAuth";

export const adminButton =
  "rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200";

// What the admin pages show until the password checks out: a loading line
// while a saved password is verified, then the password form
export default function AdminLogin({
  title,
  auth,
}: {
  title: string;
  auth: ReturnType<typeof useAuth>;
}) {
  const {
    password,
    setPassword,
    loginError,
    handleLogin,
    checking,
    lockedOut,
  } = auth;

  return (
    <main className="flex flex-col gap-4">
      <h1
        className="animate-in font-system text-3xl font-bold"
        style={{ "--index": 1 } as React.CSSProperties}
      >
        {title}
      </h1>
      {checking ? (
        <p
          className="animate-in text-sm text-neutral-500"
          style={{ "--index": 2 } as React.CSSProperties}
        >
          Loading...
        </p>
      ) : (
        <form
          onSubmit={handleLogin}
          className="flex animate-in flex-col gap-4"
          style={{ "--index": 2 } as React.CSSProperties}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={lockedOut}
            className="rounded-lg border border-neutral-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:focus:border-neutral-500"
            autoFocus
          />
          {(loginError || lockedOut) && (
            <p className="text-sm text-red-500">
              {lockedOut
                ? "Too many failed attempts. Try again in 8760 hours."
                : loginError}
            </p>
          )}
          <button type="submit" disabled={lockedOut} className={adminButton}>
            Continue
          </button>
        </form>
      )}
    </main>
  );
}
