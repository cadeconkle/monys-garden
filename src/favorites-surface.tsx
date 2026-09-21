import { Link } from "react-router-dom";
import { varietyPath, type Variety } from "./catalog";
import type { Favorites } from "./favorites";

export function FavoritesPage({
  catalog,
  favorites,
}: {
  catalog: readonly Variety[];
  favorites: Favorites;
}) {
  const hearted = favorites
    .names()
    .map((name) => catalog.find((variety) => variety.name === name))
    .filter((variety): variety is Variety => Boolean(variety));

  return (
    <main className="surface favorites-page">
      <nav className="trail" aria-label="Catalog trail">
        <Link to="/catalog">Catalog</Link>
      </nav>
      <h1>Favorites</h1>
      <p>A heart on a Variety. Not a List.</p>
      {hearted.length === 0 ? (
        <div className="empty-garden">
          <p>No Favorites yet.</p>
          <p>Heart a Variety in the Catalog. That heart lives here, not on a List.</p>
        </div>
      ) : (
        <ul className="rungs">
          {hearted.map((variety) => (
            <li className="variety-row" key={variety.name}>
              <Link to={varietyPath(variety)}>{variety.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
