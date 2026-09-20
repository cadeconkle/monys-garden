export type LockScreenCare = {
  id: string;
  label: string;
};

export type LockScreen = {
  offer(): void | Promise<void>;
  sync(careEvents: readonly LockScreenCare[]): void | Promise<void>;
};

export function createLockScreen(): LockScreen {
  return {
    offer() {},
    sync() {},
  };
}
