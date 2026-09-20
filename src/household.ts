import { GROWING_PLACE, type GrowingPlace } from "./growing-place";

export type Gardener = {
  email: string;
};

export class HouseholdAlreadyHasAGardenerError extends Error {
  constructor() {
    super("There is only one Gardener.");
    this.name = "HouseholdAlreadyHasAGardenerError";
  }
}

export class WrongGardenerError extends Error {
  constructor() {
    super("Open the garden as the Gardener.");
    this.name = "WrongGardenerError";
  }
}

export type HouseholdStatus = {
  gardenerExists: boolean;
  gardener: Gardener | null;
};

export type Household = {
  growingPlace: GrowingPlace;
  status(): Promise<HouseholdStatus>;
  open(email: string, password: string): Promise<Gardener>;
};

export function createHousehold(): Household {
  let record: { email: string; password: string } | null = null;

  return {
    growingPlace: GROWING_PLACE,
    async status() {
      return { gardenerExists: record !== null, gardener: null };
    },
    async open(email, password) {
      if (!record) {
        record = { email, password };
        return { email };
      }

      if (record.email !== email) {
        throw new HouseholdAlreadyHasAGardenerError();
      }

      if (record.password !== password) {
        throw new WrongGardenerError();
      }

      return { email };
    },
  };
}
