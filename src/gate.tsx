import { useState, type FormEvent } from "react";

type GateProps = {
  growingPlace: string;
  gardenerExists: boolean;
  error: string | null;
  onOpen: (email: string, password: string) => Promise<void>;
};

export function Gate({ growingPlace, gardenerExists, error, onOpen }: GateProps) {
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setBusy(true);
    try {
      await onOpen(email, password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="gate">
      <span className="gate-soil" aria-hidden="true" />
      <span className="gate-bloom" aria-hidden="true" />
      <p className="place">{growingPlace}</p>
      <h1 className="hero-name">
        Mony&apos;s <span className="hero-garden">Garden</span>
      </h1>
      <p className="lede">
        {gardenerExists
          ? "Open as the Gardener to see the Catalog and the Garden."
          : "A private book for this Growing place and kitchen. The first opening is the only Gardener."}
      </p>
      <form className="gate-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={gardenerExists ? "current-password" : "new-password"}
            required
          />
        </label>
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={busy}>
          Open the garden
        </button>
      </form>
    </main>
  );
}
