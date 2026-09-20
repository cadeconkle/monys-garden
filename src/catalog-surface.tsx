import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  FITS,
  categoriesIn,
  categoryFromSlug,
  findVariety,
  kindFromSlug,
  kindsIn,
  slugFor,
  varietiesOf,
  type Category,
  type Fit,
  type Variety,
} from "./catalog";

export function CatalogIndex({ catalog }: { catalog: readonly Variety[] }) {
  const categories = categoriesIn(catalog);

  return (
    <main className="surface">
      <h1>Catalog</h1>
      {categories.length === 0 ? (
        <p>No Varieties yet. Every Variety that can live at this Growing place will land here.</p>
      ) : (
        <>
          <p>Browse by Category, then Kind, then Variety. Weak Fit stays listed.</p>
          <ul className="rungs">
            {categories.map((category) => (
              <li key={category}>
                <Link to={`/catalog/${slugFor(category)}`}>{category}</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export function CategoryPage({ catalog }: { catalog: readonly Variety[] }) {
  const category = categoryFromSlug(useParams().categorySlug ?? "");
  if (!category) {
    return <Missing rung="Category" />;
  }

  return (
    <main className="surface">
      <Trail category={category} />
      <h1>{category}</h1>
      <ul className="rungs">
        {kindsIn(catalog, category).map((kind) => (
          <li key={kind}>
            <Link to={`/catalog/${slugFor(category)}/${slugFor(kind)}`}>{kind}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function KindPage({ catalog }: { catalog: readonly Variety[] }) {
  const params = useParams();
  const [search] = useSearchParams();
  const category = categoryFromSlug(params.categorySlug ?? "");
  if (!category) {
    return <Missing rung="Kind" />;
  }

  const kind = kindFromSlug(catalog, category, params.kindSlug ?? "");
  if (!kind) {
    return <Missing rung="Kind" />;
  }

  const hidden = hiddenFits(search);
  const listed = varietiesOf(catalog, category, kind).filter(
    (variety) => !hidden.includes(variety.fit),
  );

  return (
    <main className="surface">
      <Trail category={category} kind={kind} />
      <h1>{kind}</h1>
      <FitFilter />
      {listed.length === 0 ? (
        <p>No Varieties match this Fit. They are still in the Catalog.</p>
      ) : (
        <ul className="rungs">
          {listed.map((variety) => (
            <li key={variety.name}>
              <Link to={`/catalog/${slugFor(category)}/${slugFor(kind)}/${slugFor(variety.name)}`}>
                {variety.name}
              </Link>
              <p className="fit">{variety.fit} Fit</p>
              <p>{variety.why}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export function VarietyPage({ catalog }: { catalog: readonly Variety[] }) {
  const params = useParams();
  const category = categoryFromSlug(params.categorySlug ?? "");
  if (!category) {
    return <Missing rung="Variety" />;
  }

  const kind = kindFromSlug(catalog, category, params.kindSlug ?? "");
  const variety = kind
    ? findVariety(catalog, category, kind, params.varietySlug ?? "")
    : undefined;

  if (!kind || !variety) {
    return <Missing rung="Variety" />;
  }

  return (
    <main className="surface">
      <Trail category={category} kind={kind} />
      <h1>{variety.name}</h1>
      <p>This is a {variety.fit} Fit.</p>
      <p>{variety.why}</p>
      <p>This Variety is still thin. Fit and why are here; photoreal art and full care are not.</p>
    </main>
  );
}

function Trail({ category, kind }: { category?: Category; kind?: string }) {
  const [params] = useSearchParams();
  const query = params.toString();
  const search = query ? `?${query}` : "";

  return (
    <nav className="trail" aria-label="Catalog trail">
      <Link to="/catalog">Catalog</Link>
      {category ? <Link to={`/catalog/${slugFor(category)}`}>{category}</Link> : null}
      {category && kind ? (
        <Link to={`/catalog/${slugFor(category)}/${slugFor(kind)}${search}`}>{kind}</Link>
      ) : null}
    </nav>
  );
}

function FitFilter() {
  const [params, setParams] = useSearchParams();
  const hidden = hiddenFits(params);

  return (
    <fieldset className="fit-filter">
      <legend>Fit</legend>
      {FITS.map((fit) => (
        <label key={fit}>
          <input
            type="checkbox"
            checked={!hidden.includes(fit)}
            onChange={() => {
              const next = new URLSearchParams(params);
              next.delete("hide");
              const updated = hidden.includes(fit)
                ? hidden.filter((item) => item !== fit)
                : [...hidden, fit];
              for (const value of updated) {
                next.append("hide", value);
              }
              setParams(next, { replace: true });
            }}
          />
          {fit}
        </label>
      ))}
    </fieldset>
  );
}

function hiddenFits(params: URLSearchParams): Fit[] {
  return params.getAll("hide").filter((value): value is Fit => FITS.includes(value as Fit));
}

function Missing({ rung }: { rung: "Category" | "Kind" | "Variety" }) {
  return (
    <main className="surface">
      <Trail />
      <h1>Catalog</h1>
      <p>That {rung} is not in the Catalog.</p>
    </main>
  );
}
