import { Link } from "react-router-dom";

export function CatalogSurface() {
  return (
    <main className="surface">
      <h1>Catalog</h1>
      <p>No Varieties yet. Every Variety that can live at this Growing place will land here.</p>
    </main>
  );
}

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
