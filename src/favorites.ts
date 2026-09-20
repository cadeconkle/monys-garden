export type Favorites = {
  names(): string[];
  has(name: string): boolean;
  heart(name: string): void;
  unheart(name: string): void;
};

export function createFavorites(): Favorites {
  const names = new Set<string>();

  return {
    names() {
      return [...names];
    },
    has(name) {
      return names.has(name);
    },
    heart(name) {
      names.add(name);
    },
    unheart(name) {
      names.delete(name);
    },
  };
}
