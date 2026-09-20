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
  const [search] = useSearchParams();
  const visible = visibleVarieties(catalog, hiddenFits(search));
  const categories = categoriesIn(visible);

  return (
    <main className="surface">
      <h1>Catalog</h1>
      <p>Browse by Category, then Kind, then Variety. Weak Fit stays listed.</p>
      <FitFilter />
      {catalog.length === 0 ? (
        <p>No Varieties yet. Every Variety that can live at this Growing place will land here.</p>
      ) : categories.length === 0 ? (
        <p>No Varieties match this Fit. They are still in the Catalog.</p>
      ) : (
        <ul className="rungs">
          {categories.map((category) => (
            <li key={category}>
              <CatalogLink path={`/catalog/${slugFor(category)}`}>{category}</CatalogLink>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export function CategoryPage({ catalog }: { catalog: readonly Variety[] }) {
  const params = useParams();
  const [search] = useSearchParams();
  const visible = visibleVarieties(catalog, hiddenFits(search));
  const category = categoryFromSlug(params.categorySlug ?? "");
  if (!category) {
    return <Missing rung="Category" />;
  }

  const kinds = kindsIn(visible, category);

  return (
    <main className="surface">
      <Trail category={category} />
      <h1>{category}</h1>
      <FitFilter />
      {kinds.length === 0 ? (
        <p>No Varieties match this Fit. They are still in the Catalog.</p>
      ) : (
        <ul className="rungs">
          {kinds.map((kind) => (
            <li key={kind}>
              <CatalogLink path={`/catalog/${slugFor(category)}/${slugFor(kind)}`}>{kind}</CatalogLink>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export function KindPage({ catalog }: { catalog: readonly Variety[] }) {
  const params = useParams();
  const [search] = useSearchParams();
  const visible = visibleVarieties(catalog, hiddenFits(search));
  const category = categoryFromSlug(params.categorySlug ?? "");
  if (!category) {
    return <Missing rung="Category" />;
  }

  const kind = kindFromSlug(catalog, category, params.kindSlug ?? "");
  if (!kind) {
    return <Missing rung="Kind" />;
  }

  const listed = varietiesOf(visible, category, kind);

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
              <CatalogLink
                path={`/catalog/${slugFor(category)}/${slugFor(kind)}/${slugFor(variety.name)}`}
              >
                {variety.name}
              </CatalogLink>
              <VarietyFacts variety={variety} />
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
    return <Missing rung="Category" />;
  }

  const kind = kindFromSlug(catalog, category, params.kindSlug ?? "");
  const variety = kind
    ? findVariety(catalog, category, kind, params.varietySlug ?? "")
    : undefined;

  if (!kind) {
    return <Missing rung="Kind" />;
  }
  if (!variety) {
    return <Missing rung="Variety" />;
  }

  return (
    <main className="surface">
      <Trail category={category} kind={kind} />
      <h1>{variety.name}</h1>
      <VarietyFacts variety={variety} sentence />
      <p>This Variety is still thin. Fit and why are here; photoreal art and full care are not.</p>
    </main>
  );
}

function VarietyFacts({ variety, sentence }: { variety: Variety; sentence?: boolean }) {
  return (
    <>
      <p>{variety.category}</p>
      <p>{variety.kind}</p>
      <p className="fit">{sentence ? `This is a ${variety.fit} Fit.` : `${variety.fit} Fit`}</p>
      <p>{variety.why}</p>
    </>
  );
}

function Trail({ category, kind }: { category?: Category; kind?: string }) {
  return (
    <nav className="trail" aria-label="Catalog trail">
      <CatalogLink path="/catalog">Catalog</CatalogLink>
      {category ? (
        <CatalogLink path={`/catalog/${slugFor(category)}`}>{category}</CatalogLink>
      ) : null}
      {category && kind ? (
        <CatalogLink path={`/catalog/${slugFor(category)}/${slugFor(kind)}`}>{kind}</CatalogLink>
      ) : null}
    </nav>
  );
}

function CatalogLink({ path, children }: { path: string; children: string }) {
  const [params] = useSearchParams();
  const query = params.toString();
  return <Link to={query ? `${path}?${query}` : path}>{children}</Link>;
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

function visibleVarieties(catalog: readonly Variety[], hidden: Fit[]): Variety[] {
  return catalog.filter((variety) => !hidden.includes(variety.fit));
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
