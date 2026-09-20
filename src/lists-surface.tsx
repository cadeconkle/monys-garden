import { type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { slugFor, varietyPath, type Variety } from "./catalog";
import type { Lists } from "./lists";

export function ListsPage({ lists, onListsChange }: { lists: Lists; onListsChange: () => void }) {
  return (
    <main className="surface">
      <nav className="trail" aria-label="Catalog trail">
        <Link to="/catalog">Catalog</Link>
      </nav>
      <h1>Lists</h1>
      <p>Named collections of Varieties. A List is not a Favorite.</p>
      <form
        className="list-form"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          lists.create(String(form.get("list-name") ?? ""));
          event.currentTarget.reset();
          onListsChange();
        }}
      >
        <label>
          List name
          <input name="list-name" required />
        </label>
        <button type="submit">Create List</button>
      </form>
      {lists.all().length === 0 ? (
        <p>No Lists yet.</p>
      ) : (
        <ul className="rungs">
          {lists.all().map((list) => (
            <li key={list.name}>
              <Link to={`/lists/${slugFor(list.name)}`}>{list.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export function ListPage({
  catalog,
  lists,
  onListsChange,
}: {
  catalog: readonly Variety[];
  lists: Lists;
  onListsChange: () => void;
}) {
  const params = useParams();
  const list = lists.find(params.listSlug ?? "");
  if (!list) {
    return (
      <main className="surface">
        <nav className="trail" aria-label="Catalog trail">
          <Link to="/catalog">Catalog</Link>
          <Link to="/lists">Lists</Link>
        </nav>
        <h1>Lists</h1>
        <p>That List is not here.</p>
      </main>
    );
  }

  const varieties = list.varietyNames
    .map((name) => catalog.find((variety) => variety.name === name))
    .filter((variety): variety is Variety => Boolean(variety));

  return (
    <main className="surface">
      <nav className="trail" aria-label="Catalog trail">
        <Link to="/catalog">Catalog</Link>
        <Link to="/lists">Lists</Link>
      </nav>
      <h1>{list.name}</h1>
      {varieties.length === 0 ? (
        <p>No Varieties on this List yet.</p>
      ) : (
        <ul className="rungs">
          {varieties.map((variety) => (
            <li key={variety.name}>
              <Link to={varietyPath(variety)}>{variety.name}</Link>
              <button
                type="button"
                onClick={() => {
                  lists.remove(list.name, variety.name);
                  onListsChange();
                }}
              >
                Remove {variety.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
