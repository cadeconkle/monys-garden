import { useEffect, useRef, useState } from "react";
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
import {
  applyWeatherToGarden,
  careEventLabel,
  dueCareEvents,
  emptyGarden,
  endPlantingAsFailed,
  markCareEventDone,
  nameBed,
  overrideSoil,
  setStay,
  startPlanting,
  type GardenBook,
} from "./garden";
import { createMemoryGardenBook, type GardenBookStore } from "./garden-book";
import { GardenSurface } from "./garden-surface";
import { Gate } from "./gate";
import {
  HouseholdAlreadyHasAGardenerError,
  WrongGardenerError,
  type Gardener,
  type Household,
} from "./household";
import type { LockScreen } from "./lock-screen";
import { createLists } from "./lists";
import { ListPage, ListsPage } from "./lists-surface";
import { Shell } from "./shell";
import { curatedShops, type Shop } from "./shops";
import { ShopsSurface } from "./shops-surface";
import type { GrowingPlaceForecast } from "./forecast";

export function GardenApp({
  household,
  catalog = thinCatalog,
  techniques = catalogTechniques,
  shops = curatedShops,
  loadForecast,
  gardenBook,
  lockScreen,
}: {
  household: Household;
  catalog?: readonly Variety[];
  techniques?: readonly Technique[];
  shops?: readonly Shop[];
  loadForecast?: () => Promise<GrowingPlaceForecast>;
  gardenBook?: GardenBookStore;
  lockScreen?: LockScreen;
}) {
  const [ready, setReady] = useState(false);
  const [gardener, setGardener] = useState<Gardener | null>(null);
  const [gardenerExists, setGardenerExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites] = useState(createFavorites);
  const [lists] = useState(createLists);
  const [, setRevision] = useState(0);
  const [localBook] = useState(createMemoryGardenBook);
  const book = gardenBook ?? localBook;
  const [garden, setGarden] = useState<GardenBook>(emptyGarden);
  const [gardenReady, setGardenReady] = useState(!gardenBook);
  const [forecast, setForecast] = useState<GrowingPlaceForecast | undefined>(undefined);
  const forecastRef = useRef(forecast);
  forecastRef.current = forecast;
  const planted = plantedVarietyNames(garden);

  useEffect(() => {
    if (!loadForecast) {
      return;
    }

    let cancelled = false;
    loadForecast().then(
      (loaded) => {
        if (!cancelled) {
          setForecast(loaded);
        }
      },
      () => {
        if (!cancelled) {
          setForecast(undefined);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [loadForecast]);

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

  useEffect(() => {
    if (!gardener) {
      return;
    }

    if (!gardenBook) {
      setGardenReady(true);
      return;
    }

    let cancelled = false;
    gardenBook.load().then((stored) => {
      if (cancelled) {
        return;
      }
      setGarden(applyWeatherToGarden(stored, forecastRef.current));
      setGardenReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [gardener, gardenBook]);

  useEffect(() => {
    if (!forecast) {
      return;
    }
    setGarden((current) => applyWeatherToGarden(current, forecast));
  }, [forecast]);

  useEffect(() => {
    if (!gardener) {
      return;
    }
    void lockScreen?.offer();
  }, [gardener, lockScreen]);

  useEffect(() => {
    if (!gardener || !gardenReady) {
      return;
    }
    void book.save(garden);
    void lockScreen?.sync(
      dueCareEvents(garden).map((event) => ({
        id: event.id,
        label: careEventLabel(event),
      })),
    );
  }, [gardener, garden, gardenReady, book, lockScreen]);

  if (!ready || (gardener && !gardenReady)) {
    return (
      <main className="gate">
        <span className="gate-soil" aria-hidden="true" />
        <span className="gate-bloom" aria-hidden="true" />
        <p className="place">{household.growingPlace.name}</p>
        <h1 className="hero-name">
          Mony&apos;s <span className="hero-garden">Garden</span>
        </h1>
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

  const commitGarden = (update: (current: GardenBook) => GardenBook) => {
    setGarden((current) => {
      const next = update(current);
      return forecast ? applyWeatherToGarden(next, forecast) : next;
    });
  };

  return (
    <Shell growingPlace={household.growingPlace.name} gardener={gardener}>
      <Routes>
        <Route
          path="/"
          element={
            <GardenSurface
              catalog={catalog}
              garden={garden}
              weather={forecast}
              onNameBed={(area, name) => commitGarden((current) => nameBed(current, area, name))}
              onStartPlanting={(planting) => {
                let plantingError: string | null = null;
                commitGarden((current) => {
                  const result = startPlanting(current, planting);
                  plantingError = result.error;
                  return result.garden;
                });
                return plantingError;
              }}
              onSetStay={(plantingId, stay) =>
                commitGarden((current) => setStay(current, plantingId, stay))
              }
              onOverrideSoil={(area, bedName, soil) =>
                commitGarden((current) => overrideSoil(current, area, bedName, soil))
              }
              onMarkCareEventDone={(careEventId) =>
                commitGarden((current) => markCareEventDone(current, careEventId))
              }
              onEndPlantingAsFailed={(plantingId) =>
                commitGarden((current) => endPlantingAsFailed(current, plantingId))
              }
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
              weather={forecast}
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
        <Route path="/shops" element={<ShopsSurface shops={shops} />} />
      </Routes>
    </Shell>
  );
}

function plantedVarietyNames(garden: GardenBook): string[] {
  return [...new Set(garden.plantings.map((planting) => planting.variety.name))];
}
