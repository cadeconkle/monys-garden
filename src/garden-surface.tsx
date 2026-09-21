import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { varietyPath, type Variety } from "./catalog";
import {
  AREAS,
  STARTS,
  careEventLabel,
  currentPlantings,
  dueCareEvents,
  fertilizerAdviceFor,
  soilFor,
  type Area,
  type GardenBook,
  type Planting,
  type Start,
  type StartPlanting,
  type Stay,
} from "./garden";
import { enoughRain, frostNight, type ForecastDay, type GrowingPlaceForecast } from "./weather";

type GardenSurfaceProps = {
  catalog: readonly Variety[];
  garden: GardenBook;
  weather?: GrowingPlaceForecast;
  onNameBed: (area: Area, name: string) => void;
  onStartPlanting: (planting: StartPlanting) => string | null;
  onSetStay: (plantingId: string, stay: Stay) => void;
  onOverrideSoil: (area: Area, bedName: string, soil: string) => void;
  onMarkCareEventDone: (careEventId: string) => void;
  onEndPlantingAsFailed: (plantingId: string) => void;
};

type AreaBed = {
  name: string;
  plan: Variety | null;
  soil: string | null;
  plantings: Planting[];
};

export function GardenSurface({
  catalog,
  garden,
  weather,
  onNameBed,
  onStartPlanting,
  onSetStay,
  onOverrideSoil,
  onMarkCareEventDone,
  onEndPlantingAsFailed,
}: GardenSurfaceProps) {
  const plantings = currentPlantings(garden);

  return (
    <main className="surface garden-page">
      <h1>Garden</h1>
      <ForecastGlance weather={weather} />
      <CareList garden={garden} onMarkCareEventDone={onMarkCareEventDone} />
      {plantings.length === 0 ? (
        <div className="empty-garden">
          <p>Nothing is in the ground yet.</p>
          <p>
            <Link to="/catalog">Open the Catalog</Link>
          </p>
        </div>
      ) : null}
      <YardMap
        garden={garden}
        onSetStay={onSetStay}
        onOverrideSoil={onOverrideSoil}
        onEndPlantingAsFailed={onEndPlantingAsFailed}
      />
      <div className="garden-work">
        <NameBedForm onNameBed={onNameBed} />
        <StartPlantingForm catalog={catalog} garden={garden} onStartPlanting={onStartPlanting} />
      </div>
    </main>
  );
}

function ForecastGlance({ weather }: { weather?: GrowingPlaceForecast }) {
  if (!weather) {
    return null;
  }

  return (
    <section className="forecast weather-strip" aria-label="Growing-place forecast">
      <h2>Growing-place forecast</h2>
      <p className="today-temps" aria-hidden="true">
        <span className="temp-high">{weather.today.highF}°</span>
        <span className="temp-low">{weather.today.lowF}°</span>
      </p>
      <p>{glanceLine("Today", weather.today)}</p>
      <h3>This week</h3>
      <ul>
        {weather.week.map((day) => (
          <li key={day.date}>{glanceLine(null, day)}</li>
        ))}
      </ul>
      {enoughRain(weather) ? <p className="weather-note">Enough rain to dismiss water.</p> : null}
      {frostNight(weather) ? <p className="weather-note frost">Frost is coming.</p> : null}
    </section>
  );
}

function glanceLine(label: string | null, day: ForecastDay): string {
  const rain = day.inchesOfRain > 0 ? `${day.inchesOfRain} in rain` : "dry";
  const body = `${day.date} · ${day.highF}° / ${day.lowF}° · ${rain}`;
  return label ? `${label} · ${body}` : body;
}

function CareList({
  garden,
  onMarkCareEventDone,
}: {
  garden: GardenBook;
  onMarkCareEventDone: (careEventId: string) => void;
}) {
  const due = dueCareEvents(garden);
  if (due.length === 0) {
    return null;
  }

  return (
    <section className="care care-board">
      <h2>Care</h2>
      <ul aria-label="Care events">
        {due.map((event) => (
          <li className="care-item" key={event.id}>
            <p>{careEventLabel(event)}</p>
            <button type="button" onClick={() => onMarkCareEventDone(event.id)}>
              Mark done
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function YardMap({
  garden,
  onSetStay,
  onOverrideSoil,
  onEndPlantingAsFailed,
}: {
  garden: GardenBook;
  onSetStay: GardenSurfaceProps["onSetStay"];
  onOverrideSoil: GardenSurfaceProps["onOverrideSoil"];
  onEndPlantingAsFailed: (plantingId: string) => void;
}) {
  return (
    <div className="yard areas">
      {AREAS.map((area) => {
        const beds = bedsInArea(garden, area);

        return (
          <section className="yard-plot area-band" data-area={area} key={area}>
            <h2>{area}</h2>
            {beds.length === 0 ? (
              <p className="plot-empty">No Beds named yet.</p>
            ) : (
              beds.map((bed) => (
                <BedCard
                  key={bed.name}
                  area={area}
                  bed={bed}
                  onSetStay={onSetStay}
                  onOverrideSoil={onOverrideSoil}
                  onEndPlantingAsFailed={onEndPlantingAsFailed}
                />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}

function BedCard({
  area,
  bed,
  onSetStay,
  onOverrideSoil,
  onEndPlantingAsFailed,
}: {
  area: Area;
  bed: AreaBed;
  onSetStay: GardenSurfaceProps["onSetStay"];
  onOverrideSoil: GardenSurfaceProps["onOverrideSoil"];
  onEndPlantingAsFailed: (plantingId: string) => void;
}) {
  const soil = soilFor(bed, bed.plantings);
  const fertilizer = fertilizerAdviceFor(bed, bed.plantings);

  return (
    <article className="bed bed-card">
      <h3>{bed.name}</h3>
      {bed.plan ? <p>Bed plan: {bed.plan.name}</p> : null}
      {soil ? <p>Soil: {soil}</p> : null}
      {fertilizer ? <p>Fertilizer advice: {fertilizer}</p> : null}
      {bed.plantings.length > 0 ? (
        <ul className="plantings">
          {bed.plantings.map((planting) => (
            <li key={planting.id}>
              <p>
                <Link to={varietyPath(planting.variety)}>
                  {`${planting.variety.name} · ${planting.start} · ${planting.plantedOn}`}
                </Link>
              </p>
              <p>Stay: {planting.stay}</p>
              {planting.stay === "in-bed" ? (
                <button type="button" onClick={() => onSetStay(planting.id, "indoors")}>
                  Bring indoors
                </button>
              ) : (
                <button type="button" onClick={() => onSetStay(planting.id, "in-bed")}>
                  Bring back to the Bed
                </button>
              )}
              {planting.end === "failed" ? (
                <p>This Planting failed.</p>
              ) : (
                <button
                  type="button"
                  className="danger"
                  onClick={() => onEndPlantingAsFailed(planting.id)}
                >
                  End this Planting as failed
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {bed.plan || bed.plantings.length > 0 ? (
        <OverrideSoilForm
          bedName={bed.name}
          onOverride={(next) => onOverrideSoil(area, bed.name, next)}
        />
      ) : null}
    </article>
  );
}

function OverrideSoilForm({
  bedName,
  onOverride,
}: {
  bedName: string;
  onOverride: (soil: string) => void;
}) {
  const [soil, setSoil] = useState("");

  return (
    <form
      className="garden-form"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!soil.trim()) {
          return;
        }
        onOverride(soil);
        setSoil("");
      }}
    >
      <label>
        Soil override for {bedName}
        <input
          name="soilOverride"
          value={soil}
          onChange={(event) => setSoil(event.target.value)}
        />
      </label>
      <button type="submit">Override Soil for {bedName}</button>
    </form>
  );
}

function NameBedForm({ onNameBed }: { onNameBed: (area: Area, name: string) => void }) {
  const [area, setArea] = useState<Area>("Front");
  const [name, setName] = useState("");

  return (
    <form
      className="garden-form"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!name.trim()) {
          return;
        }
        onNameBed(area, name);
        setName("");
      }}
    >
      <h2>Name a Bed</h2>
      <label>
        Area
        <select
          name="area"
          required
          value={area}
          onChange={(event) => {
            const next = event.target.value;
            if (isArea(next)) {
              setArea(next);
            }
          }}
        >
          {AREAS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label>
        Bed name
        <input name="name" required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <button type="submit">Name the Bed</button>
    </form>
  );
}

function StartPlantingForm({
  catalog,
  garden,
  onStartPlanting,
}: {
  catalog: readonly Variety[];
  garden: GardenBook;
  onStartPlanting: GardenSurfaceProps["onStartPlanting"];
}) {
  const [error, setError] = useState<string | null>(null);
  const [varietyName, setVarietyName] = useState("");
  const [chosenBed, setChosenBed] = useState("");
  const [plantedOn, setPlantedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("");

  return (
    <form
      className="garden-form"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const variety = catalog.find((item) => item.name === varietyName);
        const [area, bedName] = splitBedValue(chosenBed);

        if (!variety || !area || !bedName || !plantedOn || !isStart(start)) {
          return;
        }

        const problem = onStartPlanting({ area, bedName, variety, plantedOn, start });
        if (problem) {
          setError(problem);
          return;
        }
        setError(null);
        setVarietyName("");
        setChosenBed("");
        setPlantedOn(new Date().toISOString().slice(0, 10));
        setStart("");
      }}
    >
      <h2>Start a Planting</h2>
      {error ? <p role="alert">{error}</p> : null}
      <label>
        Variety
        <select name="variety" required value={varietyName} onChange={(event) => setVarietyName(event.target.value)}>
          <option value="" disabled>
            Choose a Variety
          </option>
          {varietiesByCategory(catalog).map(({ category, varieties }) => (
            <optgroup key={category} label={category}>
              {varieties.map((variety) => (
                <option key={variety.name} value={variety.name}>
                  {variety.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label>
        Bed
        <select name="bed" required value={chosenBed} onChange={(event) => setChosenBed(event.target.value)}>
          <option value="" disabled>
            Choose a Bed
          </option>
          {garden.beds.map((bed) => (
            <option key={`${bed.area}-${bed.name}`} value={bedValue(bed.area, bed.name)}>
              {bed.area} · {bed.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Planted on
        <input
          name="plantedOn"
          type="date"
          required
          value={plantedOn}
          onChange={(event) => setPlantedOn(event.target.value)}
        />
      </label>
      <label>
        Start
        <select name="start" required value={start} onChange={(event) => setStart(event.target.value)}>
          <option value="" disabled>
            Choose a Start
          </option>
          {STARTS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Start the Planting</button>
    </form>
  );
}

function bedsInArea(garden: GardenBook, area: Area): AreaBed[] {
  const plantingsHere = currentPlantings(garden).filter((planting) => planting.area === area);
  const named = garden.beds.filter((bed) => bed.area === area);
  const beds: AreaBed[] = [];
  const seen = new Set<string>();

  for (const bed of named) {
    seen.add(bed.name);
    beds.push({
      name: bed.name,
      plan: bed.plan,
      soil: bed.soil,
      plantings: plantingsHere.filter((planting) => planting.bedName === bed.name),
    });
  }

  for (const planting of plantingsHere) {
    if (seen.has(planting.bedName)) {
      continue;
    }
    seen.add(planting.bedName);
    beds.push({
      name: planting.bedName,
      plan: null,
      soil: null,
      plantings: plantingsHere.filter((item) => item.bedName === planting.bedName),
    });
  }

  return beds;
}

function varietiesByCategory(catalog: readonly Variety[]): { category: string; varieties: Variety[] }[] {
  const groups: { category: string; varieties: Variety[] }[] = [];

  for (const variety of catalog) {
    const existing = groups.find((group) => group.category === variety.category);
    if (existing) {
      existing.varieties.push(variety);
    } else {
      groups.push({ category: variety.category, varieties: [variety] });
    }
  }

  return groups;
}

function bedValue(area: Area, name: string): string {
  return `${area}\t${name}`;
}

function splitBedValue(value: string): [Area | undefined, string | undefined] {
  const [area, name] = value.split("\t");
  return isArea(area) && name ? [area, name] : [undefined, undefined];
}

function isArea(value: string): value is Area {
  return (AREAS as readonly string[]).includes(value);
}

function isStart(value: string): value is Start {
  return (STARTS as readonly string[]).includes(value);
}
