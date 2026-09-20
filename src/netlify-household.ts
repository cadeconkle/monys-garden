import { AuthError, getUser, handleAuthCallback, login, signup } from "@netlify/identity";
import { GROWING_PLACE } from "./growing-place";
import {
  HouseholdAlreadyHasAGardenerError,
  WrongGardenerError,
  type Gardener,
  type Household,
} from "./household";

type HouseholdResponse = {
  gardenerExists: boolean;
  gardener: Gardener | null;
};

export function createNetlifyHousehold(): Household {
  return {
    growingPlace: GROWING_PLACE,
    async status() {
      await handleAuthCallback();
      const identity = await getUser();
      const remote = await readHousehold();

      if (identity?.email && remote.gardener?.email === identity.email) {
        return { gardenerExists: true, gardener: { email: identity.email } };
      }

      return { gardenerExists: remote.gardenerExists, gardener: null };
    },
    async open(email, password) {
      const remote = await readHousehold();

      try {
        if (remote.gardenerExists) {
          await login(email, password);
        } else {
          await signup(email, password, { full_name: "Gardener" });
        }
      } catch (caught) {
        throw asHouseholdError(caught);
      }

      const opened = await fetch("/api/household/open", { method: "POST" });
      if (opened.status === 409) {
        throw new HouseholdAlreadyHasAGardenerError();
      }
      if (opened.status === 401) {
        throw new WrongGardenerError();
      }
      if (!opened.ok) {
        throw new WrongGardenerError();
      }

      const body = (await opened.json()) as { email: string };
      return { email: body.email };
    },
  };
}

async function readHousehold(): Promise<HouseholdResponse> {
  const response = await fetch("/api/household");
  if (!response.ok) {
    return { gardenerExists: false, gardener: null };
  }
  return (await response.json()) as HouseholdResponse;
}

function asHouseholdError(caught: unknown): Error {
  if (caught instanceof AuthError && caught.status === 403) {
    return new HouseholdAlreadyHasAGardenerError();
  }
  if (caught instanceof HouseholdAlreadyHasAGardenerError) {
    return caught;
  }
  return new WrongGardenerError();
}
