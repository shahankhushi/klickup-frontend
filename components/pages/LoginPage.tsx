"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";
import { useToast } from "@/components/ui/Toast";
import { canLeadWorkspace } from "@/lib/access";
import { useAppData } from "@/lib/store";
import { isValidEmail, wait } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { signIn } = useAppData();
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("klickup-email") ?? "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => {
    if (typeof window !== "undefined") {
      return Boolean(window.localStorage.getItem("klickup-email"));
    }
    return false;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  function validate() {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Enter a valid work email.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    return next;
  }

  async function submit() {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setLoading(true);
    await wait(300);
    if (remember) window.localStorage.setItem("klickup-email", email.trim());
    else window.localStorage.removeItem("klickup-email");
    const result = signIn(email, password);
    setLoading(false);
    if (!result.success) {
      setErrors({ password: result.error || "Authentication failed." });
      toast.error("Sign In Failed", result.error || "Please check your credentials.");
      return;
    }
    toast.success(
      `Welcome, ${result.user?.name.split(" ")[0]}`,
      `Signed in as ${result.user?.role} (${result.user?.email})`
    );
    const home = result.user && canLeadWorkspace(result.user.role) ? "/dashboard" : "/tasks";
    router.push(home);
  }

  async function sendReset() {
    if (!isValidEmail(resetEmail)) {
      setResetError("Enter the email on your workspace account.");
      return;
    }
    setResetLoading(true);
    await wait(600);
    setResetLoading(false);
    setResetOpen(false);
    toast.success("Reset link sent", `Check ${resetEmail.trim()} for password reset instructions.`);
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Enter your Khushi Motors / Khushi Media work credentials to continue."
    >
      <form
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          label="Work Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your.name@khushimotors.com"
          error={errors.email}
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          error={errors.password}
        />
        <div className="flex items-center justify-between gap-3">
          <Checkbox label="Remember me" checked={remember} onChange={setRemember} />
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            onClick={() => {
              setResetEmail(email);
              setResetError("");
              setResetOpen(true);
            }}
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" loading={loading} className="w-full font-semibold">
          Sign in
        </Button>
      </form>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset your password"
        description="Enter your registered work email to receive password reset instructions."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button loading={resetLoading} onClick={() => void sendReset()}>
              Send link
            </Button>
          </div>
        }
      >
        <TextField
          label="Work Email"
          type="email"
          value={resetEmail}
          onChange={(event) => setResetEmail(event.target.value)}
          error={resetError}
          placeholder="employee@khushimotors.com"
        />
      </Modal>
    </AuthLayout>
  );
}
