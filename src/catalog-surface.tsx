import { Link, useParams, useSearchParams } from "react-router-dom";
import type { Favorites } from "./favorites";
import type { Lists } from "./lists";
import {
  FITS,
  KITCHEN_TRADITIONS,
  categoriesIn,
  categoryFromSlug,
  findTechnique,
  findVariety,
  kindFromSlug,
  kindsIn,
  showsFinish,
  slugFor,
  suggestionsFor,
  varietiesOf,
  varietyPath,
  type Category,
  type Fit,
  type KitchenTradition,
  type Technique,
  type Variety,
  type VarietyFinish,
} from "./catalog";
import type { BuyPlace } from "./shops";
import { plantingWindowAdvice, type GrowingPlaceForecast } from "./weather";

export function CatalogIndex({ catalog }: { catalog: readonly Variety[] }) {
  const [search] = useSearchParams();
  const visible = visibleVarieties(catalog, search);
  const categories = categoriesIn(visible);

  return (
    <main className="surface">
      <h1>Catalog</h1>
      <p>Browse by Category, then Kind, then Variety. Weak Fit stays listed.</p>
      <FavoritesAndListsNav />
      <CatalogFilters />
      {catalog.length === 0 ? (
        <p>No Varieties yet. Every Variety that can live at this Growing place will land here.</p>
      ) : categories.length === 0 ? (
        <p>No Varieties match these filters. They are still in the Catalog.</p>
      ) : (
        <ul className="rungs">
          {categories.map((category) => (
            <li key={category}>
              <CatalogLink path={`/catalog/${slugFor(category)}`}>{category}</CatalogLink>
            </li>
          ))}
        </ul>
      )}
      <p>
        <CatalogLink path="/techniques">Techniques</CatalogLink>
      </p>
    </main>
  );
}

export function CategoryPage({ catalog }: { catalog: readonly Variety[] }) {
  const params = useParams();
  const [search] = useSearchParams();
  const visible = visibleVarieties(catalog, search);
  const category = categoryFromSlug(params.categorySlug ?? "");
  if (!category) {
    return <Missing rung="Category" />;
  }

  const kinds = kindsIn(visible, category);

  return (
    <main className="surface">
      <Trail category={category} />
      <h1>{category}</h1>
      <CatalogFilters />
      {kinds.length === 0 ? (
        <p>No Varieties match these filters. They are still in the Catalog.</p>
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
  const visible = visibleVarieties(catalog, search);
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
      <CatalogFilters />
      {listed.length === 0 ? (
        <p>No Varieties match these filters. They are still in the Catalog.</p>
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

export function VarietyPage({
  catalog,
  planted = [],
  favorites,
  onFavoritesChange,
  lists,
  onListsChange,
  weather,
}: {
  catalog: readonly Variety[];
  planted?: readonly string[];
  favorites: Favorites;
  onFavoritesChange: () => void;
  lists: Lists;
  onListsChange: () => void;
  weather?: GrowingPlaceForecast;
}) {
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
      <FavoritesAndListsNav />
      <VarietyFacts variety={variety} sentence />
      <Heart
        variety={variety}
        favorites={favorites}
        onFavoritesChange={onFavoritesChange}
      />
      <PlantingWindowAdvice kind={variety.kind} weather={weather} />
      <ListMembership variety={variety} lists={lists} onListsChange={onListsChange} />
      {variety.buyPlace ? <BuyPlaceFacts buyPlace={variety.buyPlace} /> : null}
      {showsFinish(variety, planted) && variety.finish ? (
        <FinishedCare finish={variety.finish} />
      ) : (
        <p>
          This Variety is still thin. Fit and why are here; photoreal art and full care are not.
        </p>
      )}
      <Suggestions catalog={catalog} variety={variety} />
    </main>
  );
}

function PlantingWindowAdvice({
  kind,
  weather,
}: {
  kind: string;
  weather?: GrowingPlaceForecast;
}) {
  if (!weather) {
    return null;
  }

  const advice = plantingWindowAdvice(kind, weather);
  if (!advice) {
    return null;
  }

  return (
    <section className="planting-window">
      <h2>Planting-window advice</h2>
      <p>{advice}</p>
    </section>
  );
}

function BuyPlaceFacts({ buyPlace }: { buyPlace: BuyPlace }) {
  const line = [buyPlace.channel, buyPlace.shop].filter(Boolean).join(" at ");
  return (
    <section className="buy-place">
      <h2>Buy place</h2>
      <p>{buyPlace.shop ? <Link to="/shops">{line}</Link> : line}</p>
    </section>
  );
}

function FinishedCare({ finish }: { finish: VarietyFinish }) {
  return (
    <>
      <figure className="photoreal">
        <img src={finish.photoreal.src} alt={finish.photoreal.alt} />
      </figure>
      <section>
        <h2>Winter fate</h2>
        <p>{finish.winterFate}</p>
      </section>
      <section>
        <h2>Difficulty</h2>
        <p>{finish.difficulty.level}</p>
        <p>{finish.difficulty.why}</p>
      </section>
      <section>
        <h2>Harvest</h2>
        <p>{finish.harvest.level}</p>
        <p>{finish.harvest.why}</p>
      </section>
      <section>
        <h2>When to plant</h2>
        <p>{finish.whenToPlant}</p>
      </section>
      <section>
        <h2>Time to harvest</h2>
        <p>{finish.timeToHarvest}</p>
      </section>
      <section>
        <h2>Soil</h2>
        <p>{finish.soil}</p>
      </section>
      {finish.techniques.length > 0 ? (
        <section>
          <h2>Techniques</h2>
          <ul className="rungs">
            {finish.techniques.map((name) => (
              <li key={name}>
                <CatalogLink path={`/techniques/${slugFor(name)}`}>{name}</CatalogLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

export function TechniquesIndex({ techniques }: { techniques: readonly Technique[] }) {
  return (
    <main className="surface">
      <TechniqueTrail />
      <h1>Techniques</h1>
      {techniques.length === 0 ? (
        <p>No Techniques yet.</p>
      ) : (
        <ul className="rungs">
          {techniques.map((technique) => (
            <li key={technique.name}>
              <CatalogLink path={`/techniques/${slugFor(technique.name)}`}>
                {technique.name}
              </CatalogLink>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export function TechniquePage({ techniques }: { techniques: readonly Technique[] }) {
  const params = useParams();
  const technique = findTechnique(techniques, params.techniqueSlug ?? "");
  if (!technique) {
    return (
      <main className="surface">
        <TechniqueTrail />
        <h1>Techniques</h1>
        <p>That Technique is not in the Catalog.</p>
      </main>
    );
  }

  return (
    <main className="surface">
      <TechniqueTrail />
      <h1>{technique.name}</h1>
      <p>{technique.how}</p>
    </main>
  );
}

function TechniqueTrail() {
  return (
    <nav className="trail" aria-label="Catalog trail">
      <CatalogLink path="/catalog">Catalog</CatalogLink>
      <CatalogLink path="/techniques">Techniques</CatalogLink>
    </nav>
  );
}

function FavoritesAndListsNav() {
  return (
    <nav className="favorites-and-lists" aria-label="Favorites and Lists">
      <Link to="/favorites">Favorites</Link>
      <Link to="/lists">Lists</Link>
    </nav>
  );
}

function ListMembership({
  variety,
  lists,
  onListsChange,
}: {
  variety: Variety;
  lists: Lists;
  onListsChange: () => void;
}) {
  const named = lists.all();
  if (named.length === 0) {
    return (
      <p>
        <Link to="/lists">Create a List</Link> for this Variety.
      </p>
    );
  }

  return (
    <div className="list-membership">
      {named.map((list) => {
        const onList = list.varietyNames.includes(variety.name);
        return (
          <button
            key={list.name}
            type="button"
            onClick={() => {
              if (onList) {
                lists.remove(list.name, variety.name);
              } else {
                lists.add(list.name, variety.name);
              }
              onListsChange();
            }}
          >
            {onList ? `Remove from ${list.name}` : `Add to ${list.name}`}
          </button>
        );
      })}
    </div>
  );
}

function Heart({
  variety,
  favorites,
  onFavoritesChange,
}: {
  variety: Variety;
  favorites: Favorites;
  onFavoritesChange: () => void;
}) {
  const hearted = favorites.has(variety.name);

  return (
    <div className="heart">
      {hearted ? <p>This is a Favorite.</p> : null}
      <button
        type="button"
        onClick={() => {
          if (hearted) {
            favorites.unheart(variety.name);
          } else {
            favorites.heart(variety.name);
          }
          onFavoritesChange();
        }}
      >
        {hearted ? "Unheart this Favorite" : "Heart as a Favorite"}
      </button>
    </div>
  );
}

function Suggestions({ catalog, variety }: { catalog: readonly Variety[]; variety: Variety }) {
  const suggestions = suggestionsFor(catalog, variety);
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="suggestions">
      <h2>Suggestions</h2>
      <p>Stronger-Fit Varieties of the same Kind only.</p>
      <ul className="rungs">
        {suggestions.map((suggestion) => (
          <li key={suggestion.name}>
            <CatalogLink path={varietyPath(suggestion)}>{suggestion.name}</CatalogLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

function VarietyFacts({ variety, sentence }: { variety: Variety; sentence?: boolean }) {
  const kitchen = kitchenUseLine(variety);
  return (
    <>
      <p>{variety.category}</p>
      <p>{variety.kind}</p>
      <p className="fit">{sentence ? `This is a ${variety.fit} Fit.` : `${variety.fit} Fit`}</p>
      <p>{variety.why}</p>
      {kitchen ? <p>{kitchen}</p> : null}
    </>
  );
}

function kitchenUseLine(variety: Variety): string | null {
  if (variety.kitchenTradition === "none") {
    return "Ornamental — an American-yard look.";
  }
  if (variety.kitchenTradition === "Asian") {
    return "Asian kitchen.";
  }
  if (variety.kitchenTradition === "American") {
    return "American kitchen.";
  }
  if (variety.kitchenTradition === "both") {
    return "Asian and American kitchen.";
  }
  return null;
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

function CatalogFilters() {
  return (
    <>
      <FitFilter />
      <KitchenFilter />
      <OrnamentalFilter />
    </>
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
            onChange={() => toggleListParam(setParams, params, "hide", hidden, fit)}
          />
          {fit}
        </label>
      ))}
    </fieldset>
  );
}

function KitchenFilter() {
  const [params, setParams] = useSearchParams();
  const hidden = hiddenTraditions(params);

  return (
    <fieldset className="fit-filter">
      <legend>Kitchen tradition</legend>
      {KITCHEN_TRADITIONS.map((tradition) => (
        <label key={tradition}>
          <input
            type="checkbox"
            checked={!hidden.includes(tradition)}
            onChange={() =>
              toggleListParam(setParams, params, "hideTradition", hidden, tradition)
            }
          />
          {tradition}
        </label>
      ))}
    </fieldset>
  );
}

function OrnamentalFilter() {
  const [params, setParams] = useSearchParams();
  const hidden = ornamentalHidden(params);

  return (
    <fieldset className="fit-filter">
      <legend>Ornamental</legend>
      <label>
        <input
          type="checkbox"
          checked={!hidden}
          onChange={() => {
            const next = new URLSearchParams(params);
            if (hidden) {
              next.delete("hideOrnamental");
            } else {
              next.set("hideOrnamental", "1");
            }
            setParams(next, { replace: true });
          }}
        />
        Ornamental
      </label>
    </fieldset>
  );
}

function toggleListParam(
  setParams: (params: URLSearchParams, options: { replace: boolean }) => void,
  params: URLSearchParams,
  key: string,
  hidden: string[],
  value: string,
) {
  const next = new URLSearchParams(params);
  next.delete(key);
  const updated = hidden.includes(value)
    ? hidden.filter((item) => item !== value)
    : [...hidden, value];
  for (const item of updated) {
    next.append(key, item);
  }
  setParams(next, { replace: true });
}

function visibleVarieties(catalog: readonly Variety[], params: URLSearchParams): Variety[] {
  const hidden = hiddenFits(params);
  const hiddenKitchen = hiddenTraditions(params);
  const hideOrnamental = ornamentalHidden(params);
  return catalog.filter((variety) => {
    if (hidden.includes(variety.fit)) {
      return false;
    }
    if (variety.kitchenTradition === "none") {
      return !hideOrnamental;
    }
    if (
      variety.kitchenTradition &&
      hiddenKitchen.includes(variety.kitchenTradition)
    ) {
      return false;
    }
    return true;
  });
}

function hiddenFits(params: URLSearchParams): Fit[] {
  return params.getAll("hide").filter((value): value is Fit => FITS.includes(value as Fit));
}

function hiddenTraditions(params: URLSearchParams): KitchenTradition[] {
  return params
    .getAll("hideTradition")
    .filter((value): value is KitchenTradition =>
      KITCHEN_TRADITIONS.includes(value as KitchenTradition),
    );
}

function ornamentalHidden(params: URLSearchParams): boolean {
  return params.get("hideOrnamental") === "1";
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
