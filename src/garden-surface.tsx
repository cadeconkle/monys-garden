import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Variety } from "./catalog";
import {
  AREAS,
  STARTS,
  careEventLabel,
  currentPlantings,
  currentPlantingsByArea,
  dueCareEvents,
  fertilizerAdviceFor,
  soilFor,
  type Area,
  type GardenBook,
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
    <main className="surface">
      <h1>Garden</h1>
      <ForecastGlance weather={weather} />
      <CareList garden={garden} onMarkCareEventDone={onMarkCareEventDone} />
      {plantings.length === 0 ? (
        <>
          <p>Nothing is in the ground yet.</p>
          <p>
            <Link to="/catalog">Open the Catalog</Link>
          </p>
        </>
      ) : (
        <PlantingList
          garden={garden}
          onSetStay={onSetStay}
          onOverrideSoil={onOverrideSoil}
          onEndPlantingAsFailed={onEndPlantingAsFailed}
        />
      )}
      <NameBedForm onNameBed={onNameBed} />
      <StartPlantingForm catalog={catalog} garden={garden} onStartPlanting={onStartPlanting} />
    </main>
  );
}

function ForecastGlance({ weather }: { weather?: GrowingPlaceForecast }) {
  if (!weather) {
    return null;
  }

  return (
    <section className="forecast" aria-label="Growing-place forecast">
      <h2>Growing-place forecast</h2>
      <p>{glanceLine("Today", weather.today)}</p>
      <h3>This week</h3>
      <ul>
        {weather.week.map((day) => (
          <li key={day.date}>{glanceLine(null, day)}</li>
        ))}
      </ul>
      {enoughRain(weather) ? <p>Enough rain to dismiss water.</p> : null}
      {frostNight(weather) ? <p>Frost is coming.</p> : null}
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
    <section className="care">
      <h2>Care</h2>
      <ul aria-label="Care events">
        {due.map((event) => (
          <li key={event.id}>
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

function PlantingList({
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
    <div className="areas">
      {currentPlantingsByArea(garden).map(({ area, beds }) => (
        <section key={area}>
          <h2>{area}</h2>
          {beds.map((bed) => {
            const soil = soilFor(bed, bed.plantings);
            const fertilizer = fertilizerAdviceFor(bed, bed.plantings);

            return (
              <article key={bed.name}>
                <h3>{bed.name}</h3>
                {bed.plan ? <p>Bed plan: {bed.plan.name}</p> : null}
                {soil ? <p>Soil: {soil}</p> : null}
                {fertilizer ? <p>Fertilizer advice: {fertilizer}</p> : null}
                <ul className="plantings">
                  {bed.plantings.map((planting) => (
                    <li key={planting.id}>
                      <p>{`${planting.variety.name} · ${planting.start} · ${planting.plantedOn}`}</p>
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
                        <button type="button" onClick={() => onEndPlantingAsFailed(planting.id)}>
                          End this Planting as failed
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <OverrideSoilForm
                  bedName={bed.name}
                  onOverride={(next) => onOverrideSoil(area, bed.name, next)}
                />
              </article>
            );
          })}
        </section>
      ))}
    </div>
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
  const [plantedOn, setPlantedOn] = useState("");
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
        setPlantedOn("");
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
          {catalog.map((variety) => (
            <option key={variety.name} value={variety.name}>
              {variety.name}
            </option>
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
