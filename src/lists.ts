import { slugFor } from "./catalog";

export type NamedList = {
  name: string;
  varietyNames: string[];
};

export type Lists = {
  all(): NamedList[];
  find(slug: string): NamedList | undefined;
  create(name: string): void;
  add(listName: string, varietyName: string): void;
  remove(listName: string, varietyName: string): void;
};

export function createLists(): Lists {
  const lists: NamedList[] = [];

  return {
    all() {
      return lists.map((list) => ({
        name: list.name,
        varietyNames: [...list.varietyNames],
      }));
    },
    find(slug) {
      const list = lists.find((item) => slugFor(item.name) === slug);
      if (!list) {
        return undefined;
      }
      return { name: list.name, varietyNames: [...list.varietyNames] };
    },
    create(name) {
      const trimmed = name.trim();
      if (!trimmed || lists.some((list) => list.name === trimmed)) {
        return;
      }
      lists.push({ name: trimmed, varietyNames: [] });
    },
    add(listName, varietyName) {
      const list = lists.find((item) => item.name === listName);
      if (!list || list.varietyNames.includes(varietyName)) {
        return;
      }
      list.varietyNames.push(varietyName);
    },
    remove(listName, varietyName) {
      const list = lists.find((item) => item.name === listName);
      if (!list) {
        return;
      }
      list.varietyNames = list.varietyNames.filter((name) => name !== varietyName);
    },
  };
}
