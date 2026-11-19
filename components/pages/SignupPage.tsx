"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { useAppData } from "@/lib/store";
import { isValidEmail, wait } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const { updateCurrentUser } = useAppData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  async function submit() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter your name.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Enter a valid work email.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    if (!terms) next.terms = "Accept the terms to create the preview account.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    await wait(700);
    updateCurrentUser({ name: name.trim(), email: email.trim() });
    setLoading(false);
    toast.success("Account created", "You're in the Northwind preview.");
    router.push("/dashboard");
  }

  return (
    <AuthLayout title="Create your account" subtitle="Join the Northwind workspace. This stays in your browser.">
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya Chen" error={errors.name} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="maya.chen@northwind.io"
          error={errors.email}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          helperText="At least 8 characters."
          error={errors.password}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
        />
        <Checkbox
          checked={terms}
          onChange={setTerms}
          error={errors.terms}
          label="I agree to the workspace terms"
          description="Preview only. No account is created on a server."
        />
        <button type="button" className="self-start text-sm font-medium text-primary hover:underline" onClick={() => setTermsOpen(true)}>
          Read the terms
        </button>
        <Button type="submit" loading={loading} className="w-full">
          Create account
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have access?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="Workspace terms" footer={<Button onClick={() => setTermsOpen(false)}>Close</Button>}>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>KlickUp is an internal preview for the Northwind team. Task, approval, and profile changes live in this browser session only.</p>
          <p>Don&apos;t paste production secrets, customer lists, or contract files into the preview. The sample workspace already has realistic stand-in data.</p>
          <p>By continuing you agree to use the tool for planning Northwind work and to keep access limited to teammates.</p>
        </div>
      </Modal>
    </AuthLayout>
  );
}
