import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { catalogTechniques, thinCatalog, type Technique, type Variety } from "./catalog";
import {
  CatalogIndex,
  CategoryPage,
  KindPage,
  TechniquePage,
  TechniquesIndex,
  VarietyPage,
} from "./catalog-surface";
import { createFavorites } from "./favorites";
import { FavoritesPage } from "./favorites-surface";
import { emptyGarden, nameBed, startPlanting, type GardenBook } from "./garden";
import { GardenSurface } from "./garden-surface";
import { Gate } from "./gate";
import {
  HouseholdAlreadyHasAGardenerError,
  WrongGardenerError,
  type Gardener,
  type Household,
} from "./household";
import { createLists } from "./lists";
import { ListPage, ListsPage } from "./lists-surface";
import { Shell } from "./shell";

export function GardenApp({
  household,
  catalog = thinCatalog,
  techniques = catalogTechniques,
}: {
  household: Household;
  catalog?: readonly Variety[];
  techniques?: readonly Technique[];
}) {
  const [ready, setReady] = useState(false);
  const [gardener, setGardener] = useState<Gardener | null>(null);
  const [gardenerExists, setGardenerExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites] = useState(createFavorites);
  const [lists] = useState(createLists);
  const [, setRevision] = useState(0);
  const [garden, setGarden] = useState<GardenBook>(emptyGarden);
  const planted = plantedVarietyNames(garden);

  useEffect(() => {
    let cancelled = false;

    household.status().then(
      (current) => {
        if (cancelled) return;
        setGardener(current.gardener);
        setGardenerExists(current.gardenerExists);
        setReady(true);
      },
      () => {
        if (cancelled) return;
        setGardenerExists(true);
        setError("The garden could not be opened.");
        setReady(true);
      },
    );

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
        <Route
          path="/"
          element={
            <GardenSurface
              catalog={catalog}
              garden={garden}
              onNameBed={(area, name) => setGarden((current) => nameBed(current, area, name))}
              onStartPlanting={(planting) => {
                let plantingError: string | null = null;
                setGarden((current) => {
                  const result = startPlanting(current, planting);
                  plantingError = result.error;
                  return result.garden;
                });
                return plantingError;
              }}
            />
          }
        />
        <Route path="/catalog" element={<CatalogIndex catalog={catalog} />} />
        <Route path="/catalog/:categorySlug" element={<CategoryPage catalog={catalog} />} />
        <Route
          path="/catalog/:categorySlug/:kindSlug"
          element={<KindPage catalog={catalog} />}
        />
        <Route
          path="/catalog/:categorySlug/:kindSlug/:varietySlug"
          element={
            <VarietyPage
              catalog={catalog}
              planted={planted}
              favorites={favorites}
              onFavoritesChange={() => setRevision((n) => n + 1)}
              lists={lists}
              onListsChange={() => setRevision((n) => n + 1)}
            />
          }
        />
        <Route
          path="/favorites"
          element={<FavoritesPage catalog={catalog} favorites={favorites} />}
        />
        <Route
          path="/lists"
          element={<ListsPage lists={lists} onListsChange={() => setRevision((n) => n + 1)} />}
        />
        <Route
          path="/lists/:listSlug"
          element={
            <ListPage
              catalog={catalog}
              lists={lists}
              onListsChange={() => setRevision((n) => n + 1)}
            />
          }
        />
        <Route path="/techniques" element={<TechniquesIndex techniques={techniques} />} />
        <Route
          path="/techniques/:techniqueSlug"
          element={<TechniquePage techniques={techniques} />}
        />
      </Routes>
    </Shell>
  );
}

function plantedVarietyNames(garden: GardenBook): string[] {
  return [...new Set(garden.plantings.map((planting) => planting.variety.name))];
}
