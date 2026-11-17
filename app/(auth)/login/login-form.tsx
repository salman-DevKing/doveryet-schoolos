"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInAction } from "./actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await signInAction(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={onSubmit}>
      <div className="mb-5">
        <label htmlFor="email" className="block text-sm font-semibold mb-2">
          School Email
        </label>
        <div className="relative">
          <Mail size={18} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full h-[46px] pl-[42px] pr-4 border border-[color:var(--color-border-strong)] rounded-[10px] bg-[color:var(--color-surface)] text-sm focus:outline-none focus:border-[color:var(--color-brand-blue)] focus:shadow-[0_0_0_3px_rgba(71,117,234,0.12)]"
            placeholder="you@school.edu"
          />
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="password" className="block text-sm font-semibold mb-2">
          Password
        </label>
        <div className="relative">
          <Lock size={18} className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[color:var(--color-text-tertiary)]" />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full h-[46px] pl-[42px] pr-4 border border-[color:var(--color-border-strong)] rounded-[10px] bg-[color:var(--color-surface)] text-sm focus:outline-none focus:border-[color:var(--color-brand-blue)] focus:shadow-[0_0_0_3px_rgba(71,117,234,0.12)]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mb-5">
        <label className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)] cursor-pointer">
          <input type="checkbox" name="remember" className="w-4 h-4 accent-[color:var(--color-brand-blue)]" />
          Keep me signed in
        </label>
        <Link href="/forgot-password" className="text-[color:var(--color-brand-blue)] text-sm font-semibold">
          Forgot password?
        </Link>
      </div>

      {error && (
        <div className="mb-5 p-3 bg-[color:var(--color-error-bg)] text-[color:var(--color-error)] text-sm rounded-[10px]">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Sign in to Workspace
        <ArrowRight size={16} strokeWidth={2.5} />
      </Button>

      <div className="text-center mt-6 text-sm text-[color:var(--color-text-secondary)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[color:var(--color-brand-blue)] font-semibold">
          Register your school
        </Link>
      </div>
    </form>
  );
}
