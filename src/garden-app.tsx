import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Gate } from "./gate";
import {
  HouseholdAlreadyHasAGardenerError,
  WrongGardenerError,
  type Gardener,
  type Household,
} from "./household";
import { Shell } from "./shell";
import { CatalogSurface, GardenSurface } from "./surfaces";

export function GardenApp({ household }: { household: Household }) {
  const [ready, setReady] = useState(false);
  const [gardener, setGardener] = useState<Gardener | null>(null);
  const [gardenerExists, setGardenerExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    household.status().then((current) => {
      if (cancelled) return;
      setGardener(current.gardener);
      setGardenerExists(current.gardenerExists);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [household]);

  if (!ready) {
    return (
      <main className="gate">
        <p className="place">{household.growingPlace.name}</p>
        <h1>Mony&apos;s Garden</h1>
      </main>
    );
  }

  if (!gardener) {
    return (
      <Gate
        growingPlace={household.growingPlace.name}
        gardenerExists={gardenerExists}
        error={error}
        onOpen={async (email, password) => {
          try {
            setError(null);
            setGardener(await household.open(email, password));
            setGardenerExists(true);
          } catch (caught) {
            if (
              caught instanceof HouseholdAlreadyHasAGardenerError ||
              caught instanceof WrongGardenerError
            ) {
              setError(caught.message);
              return;
            }
            throw caught;
          }
        }}
      />
    );
  }

  return (
    <Shell growingPlace={household.growingPlace.name} gardener={gardener}>
      <Routes>
        <Route path="/" element={<GardenSurface />} />
        <Route path="/catalog" element={<CatalogSurface />} />
      </Routes>
    </Shell>
  );
}
