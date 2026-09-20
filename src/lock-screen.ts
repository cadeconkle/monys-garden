import type { LockScreenNotice } from "./garden";

export type { LockScreenNotice };

export type LockScreen = {
  sync(notices: readonly LockScreenNotice[]): void | Promise<void>;
};

export function createLockScreen(): LockScreen & {
  due(): readonly LockScreenNotice[];
} {
  let due: LockScreenNotice[] = [];

  return {
    sync(notices) {
      due = [...notices];
    },
    due() {
      return due;
    },
  };
}
