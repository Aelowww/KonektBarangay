"use client";

import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import { useAuth } from "./components/AuthProvider";

export default function Home() {
  const { resolved, user } = useAuth();

  if (!resolved) {
    return (
      <div className="kb-loader" role="status" aria-live="polite">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Landing />;
}
