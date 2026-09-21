import type { Shop } from "./shops";

export function ShopsSurface({ shops }: { shops: readonly Shop[] }) {
  return (
    <main className="surface shops-page">
      <h1>Shops</h1>
      <p>A short list of Shops for this Garden.</p>
      <ul className="rungs shops">
        {shops.map((shop) => (
          <li className="shop-card" data-kind={shop.kind} key={shop.name}>
            <h2>{shop.name}</h2>
            <p className="shop-kind">{shop.kind}</p>
            <p>{shop.why}</p>
            <p className="shop-links">
              <a
                href={shop.website}
                target="_blank"
                rel="noreferrer"
                aria-label={`${shop.name} website`}
              >
                Website
              </a>
              <a
                href={shop.maps}
                target="_blank"
                rel="noreferrer"
                aria-label={`${shop.name} Google Maps`}
              >
                Google Maps
              </a>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
