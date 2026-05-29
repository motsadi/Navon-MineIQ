import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useApp } from "@/hooks/AppContext";

export default function NotAuthorized() {
  const { role } = useApp();
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Lock className="h-6 w-6 text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Access restricted for this role</h2>
      <p className="max-w-md text-sm text-slate-500">
        The <span className="font-medium text-slate-700">{role}</span> role does not have access to
        this module in the demo. This simulates role-based access control.
      </p>
      <Link
        to="/overview"
        className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
      >
        Back to overview
      </Link>
    </div>
  );
}
