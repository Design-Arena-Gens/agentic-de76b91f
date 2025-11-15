"use client";
import React, { useMemo, useState } from "react";
import Wheel from "../components/Wheel";
import { computeChartFromJD, formatZodiacDegree, julianDayFromUTC } from "../lib/astro";

function parseDate(dateStr: string): { y: number; m: number; d: number } | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return null;
  return { y, m, d };
}

function parseTime(timeStr: string): { h: number; min: number } | null {
  if (!timeStr) return null;
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const min = parseInt(mStr ?? "0", 10);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return { h, min };
}

export default function Page() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tzHours, setTzHours] = useState<number>(0); // D?calage local par rapport ? UTC
  const [lat, setLat] = useState<number>(48.8566); // Paris par d?faut
  const [lon, setLon] = useState<number>(2.3522);
  const [results, setResults] = useState<ReturnType<typeof computeChartFromJD> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const d = parseDate(date);
    const t = parseTime(time || "00:00");
    if (!d || !t) {
      setError("Veuillez saisir une date et une heure valides.");
      return;
    }
    const localHours = t.h + t.min / 60;
    const hourUTC = localHours - tzHours; // conversion locale -> UTC
    const JD = julianDayFromUTC(d.y, d.m, d.d, hourUTC);
    const r = computeChartFromJD(JD, lat, lon);
    setResults(r);
  };

  const sunFmt = useMemo(() => {
    if (!results) return null;
    return formatZodiacDegree(results.sunLongitude);
  }, [results]);

  const ascFmt = useMemo(() => {
    if (!results) return null;
    return formatZodiacDegree(results.ascendant);
  }, [results]);

  const mcFmt = useMemo(() => {
    if (!results) return null;
    return formatZodiacDegree(results.midheaven);
  }, [results]);

  return (
    <main>
      <h1 style={{ marginBottom: 8 }}>Calcul de Th?me Astral</h1>
      <p className="small" style={{ marginTop: 0, marginBottom: 24 }}>
        Outil 100% local et fiable: aucun appel r?seau, vos donn?es restent sur votre appareil.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
        <fieldset>
          <legend>Informations de naissance</legend>
          <div className="grid">
            <div>
              <label>Nom (optionnel)</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Marie Dupont" />
            </div>
            <div>
              <label>Date de naissance</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label>Heure locale</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
            <div>
              <label>D?calage par rapport ? UTC (heures)</label>
              <input
                type="number"
                step="0.25"
                min={-12}
                max={14}
                value={tzHours}
                onChange={(e) => setTzHours(parseFloat(e.target.value))}
                placeholder="Ex: 1 pour UTC+1, -5 pour UTC-5"
              />
              <div className="small">Exemples: Paris hiver = 1, Paris ?t? = 2, Qu?bec = -5 (hiver)</div>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Lieu de naissance</legend>
          <div className="grid">
            <div>
              <label>Latitude (? d?cimaux, Nord +)</label>
              <input type="number" step="0.0001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} />
            </div>
            <div>
              <label>Longitude (? d?cimaux, Est +)</label>
              <input type="number" step="0.0001" value={lon} onChange={(e) => setLon(parseFloat(e.target.value))} />
            </div>
          </div>
          <div className="small" style={{ marginTop: 8 }}>
            Astuce: Trouvez vos coordonn?es sur une carte (ex: 48.8566, 2.3522 pour Paris).
          </div>
        </fieldset>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button type="submit" disabled={busy}>Calculer</button>
          {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
        </div>
      </form>

      {results && (
        <div className="grid">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>R?sultats</h2>
            <div className="kv">
              <div>Signe solaire</div>
              <div>
                <span className="badge">{results.sunSign}</span>
                {sunFmt && (
                  <span style={{ marginLeft: 8 }}>
                    {sunFmt.degInSign}?{String(sunFmt.minutes).padStart(2, "0")} {sunFmt.sign}
                  </span>
                )}
              </div>

              <div>Ascendant</div>
              <div>
                <span className="badge">{results.ascSign}</span>
                {ascFmt && (
                  <span style={{ marginLeft: 8 }}>
                    {ascFmt.degInSign}?{String(ascFmt.minutes).padStart(2, "0")} {ascFmt.sign}
                  </span>
                )}
              </div>

              <div>Milieu du Ciel (MC)</div>
              <div>
                <span className="badge">{results.mcSign}</span>
                {mcFmt && (
                  <span style={{ marginLeft: 8 }}>
                    {mcFmt.degInSign}?{String(mcFmt.minutes).padStart(2, "0")} {mcFmt.sign}
                  </span>
                )}
              </div>

              <div>Jour Julien (JD)</div>
              <div>{results.jd.toFixed(5)}</div>
            </div>
            <hr />
            <div>
              <strong>Maisons (?gales, ? partir de l'Ascendant)</strong>
              <ol>
                {results.houses.map((h, i) => (
                  <li key={i}>
                    Maison {i + 1}: {h.toFixed(2)}?
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wheel
              sunLongitude={results.sunLongitude}
              ascendant={results.ascendant}
              midheaven={results.midheaven}
              houses={results.houses}
              size={420}
            />
          </div>
        </div>
      )}

      {!results && (
        <div className="card">
          <p>
            Saisissez vos informations ci-dessus et cliquez sur ? Calculer ? pour obtenir votre Signe solaire, Ascendant, MC
            et la roue des maisons (syst?me des maisons ?gales). Aucune donn?e n'est envoy?e sur Internet.
          </p>
        </div>
      )}
    </main>
  );
}
