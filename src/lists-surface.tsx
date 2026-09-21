import { type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { slugFor, varietyPath, type Variety } from "./catalog";
import type { Lists } from "./lists";

export function ListsPage({ lists, onListsChange }: { lists: Lists; onListsChange: () => void }) {
  const named = lists.all();

  return (
    <main className="surface lists-page">
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
      {named.length === 0 ? (
        <div className="empty-garden">
          <p>No Lists yet.</p>
          <p>Write a name, then add Varieties from their pages.</p>
        </div>
      ) : (
        <ul className="rungs">
          {named.map((list) => (
            <li key={list.name}>
              <Link to={`/lists/${slugFor(list.name)}`}>{list.name}</Link>
              <p className="rung-meta">{varietyCount(list.varietyNames.length)}</p>
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
      <main className="surface lists-page">
        <nav className="trail" aria-label="Catalog trail">
          <Link to="/catalog">Catalog</Link>
          <Link to="/lists">Lists</Link>
        </nav>
        <h1>Lists</h1>
        <div className="empty-garden">
          <p>That List is not here.</p>
        </div>
      </main>
    );
  }

  const varieties = list.varietyNames
    .map((name) => catalog.find((variety) => variety.name === name))
    .filter((variety): variety is Variety => Boolean(variety));

  return (
    <main className="surface lists-page">
      <nav className="trail" aria-label="Catalog trail">
        <Link to="/catalog">Catalog</Link>
        <Link to="/lists">Lists</Link>
      </nav>
      <h1>{list.name}</h1>
      {varieties.length === 0 ? (
        <div className="empty-garden">
          <p>No Varieties on this List yet.</p>
          <p>Add them from a Variety page in the Catalog.</p>
        </div>
      ) : (
        <ul className="rungs">
          {varieties.map((variety) => (
            <li className="variety-row" key={variety.name}>
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

function varietyCount(count: number) {
  return count === 1 ? "1 Variety" : `${count} Varieties`;
}
