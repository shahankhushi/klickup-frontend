import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <Logo className="mb-6 justify-center" />
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">That page is not in this workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be out of date. Head back to the dashboard to pick up your tasks.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/dashboard">Back to dashboard</Button>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
