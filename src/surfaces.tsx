import { Link } from "react-router-dom";

export function GardenSurface() {
  return (
    <main className="surface">
      <h1>Garden</h1>
      <p>Nothing is in the ground yet.</p>
      <p>
        <Link to="/catalog">Open the Catalog</Link>
      </p>
    </main>
  );
}
