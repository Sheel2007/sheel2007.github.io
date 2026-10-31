"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { Project } from "@/lib/content"
import type { Engine, Outcome, Phase } from "./engine"

type Result = { kind: Outcome; slug: string; id: number }

const RESULT_COPY: Record<Outcome, string> = { goal: "Goal", saved: "Saved", wide: "Off target", blocked: "Blocked" }

export default function Stadium({ squad, children }: { squad: Project[]; children?: ReactNode }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const fadeRef = useRef<HTMLDivElement>(null)
  const coachRef = useRef<HTMLDivElement>(null)
  const tagRefs = useRef(new Map<string, HTMLElement>())
  const engineRef = useRef<Engine | null>(null)

  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [phase, setPhase] = useState<Phase>("intro")
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState<string[]>([])
  const [next, setNext] = useState<string | null>(null)
  const [goals, setGoals] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [more, setMore] = useState(false)
  const [aiming, setAiming] = useState(false)

  const order = useMemo(() => [...squad].sort((a, b) => a.number - b.number), [squad])
  const bySlug = useMemo(() => new Map(squad.map((p) => [p.slug, p])), [squad])
  const current = selected ? bySlug.get(selected) ?? null : null
  const nextP = next ? bySlug.get(next) ?? null : null

  useEffect(() => {
    const mount = mountRef.current
    const fade = fadeRef.current
    if (!mount || !fade) return
    let engine: Engine | null = null
    let cancelled = false
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif"
    const fonts = Promise.all(["800", "700"].map((w) => document.fonts.load(`${w} 64px ${family}`))).catch(() => undefined)
    const timeout = new Promise((r) => setTimeout(r, 2500))

    Promise.all([Promise.race([fonts, timeout]), import("./engine")])
      .then(([, mod]) =>
        mod.Engine.create({
          mount,
          fade,
          coach: coachRef.current ?? undefined,
          family,
          tags: tagRefs.current,
          reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          squad: squad.map((p) => ({
            slug: p.slug,
            number: p.number,
            shirt: p.shirt ?? p.title.toUpperCase(),
            spot: p.spot!,
            keeper: p.position === "Goalkeeper",
          })),
          on: {
            select: (slug) => {
              setSelected(slug)
              setMore(false)
            },
            busy: setBusy,
            phase: setPhase,
            aim: setAiming,
            progress: (t, n) => {
              setTouched(t)
              setNext(n)
            },
            result: (kind, slug) => {
              if (kind === "goal") setGoals((n) => n + 1)
              setResult({ kind, slug, id: Date.now() })
            },
          },
        }),
      )
      .then((e) => {
        if (cancelled) return e.dispose()
        engine = e
        engineRef.current = e
        setReady(true)
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      engine?.dispose()
      engineRef.current = null
    }
  }, [squad])

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 820px)").matches
    engineRef.current?.setPanel(selected && !busy && phase !== "scored" ? (narrow ? "bottom" : "side") : null)
  }, [selected, busy, ready, phase])

  useEffect(() => {
    if (!result || (result.kind === "goal" && phase === "scored")) return
    const t = setTimeout(() => setResult(null), 2600)
    return () => clearTimeout(t)
  }, [result, phase])

  const canShoot = phase === "free" || (phase === "build" && ready && !next && touched.length === squad.length)
  const pick = useCallback((slug: string) => engineRef.current?.select(slug), [])
  const step = useCallback(
    (dir: 1 | -1) => {
      const i = order.findIndex((p) => p.slug === selected)
      pick(order[(i + dir + order.length) % order.length].slug)
    },
    [order, selected, pick],
  )
  const replay = () => {
    setResult(null)
    engineRef.current?.replay()
  }
  const toSheet = () => document.getElementById("team-sheet")?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mount = mountRef.current
      if (!mount || !ready || busy || e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return
      const r = mount.getBoundingClientRect()
      if (r.bottom < window.innerHeight * 0.4 || r.top > window.innerHeight * 0.6) return
      if (e.key === "Enter" && phase !== "free" && next) pick(next)
      else if (e.key === "ArrowRight") step(1)
      else if (e.key === "ArrowLeft") step(-1)
      else if (e.key === "Escape" && selected) engineRef.current?.deselect()
      else if ((e.key === "s" || e.key === "S") && canShoot) engineRef.current?.shoot()
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [ready, busy, selected, step, phase, next, pick, canShoot])

  const passes = Math.max(0, touched.length - 1)
  const total = squad.length - 1
  const passTo = phase === "free" && current ? order[(order.indexOf(current) + 1) % order.length] : nextP

  return (
    <div className="stadium" data-phase={phase} data-aim={aiming ? "true" : "false"} data-selected={current ? "true" : "false"} data-busy={busy ? "true" : "false"}>
      <div ref={mountRef} className="stadium-canvas" />
      <div className="stadium-shade" aria-hidden="true" />
      <div ref={coachRef} className="coach" data-show="false" aria-hidden={canShoot && phase === "build" ? "false" : "true"}>
        {canShoot && phase === "build" ? (
          <div className="coach-label">
            <strong>Every pass made.</strong>
            <span>Read the last card, then go for goal.</span>
            <button type="button" className="coach-shoot" onClick={() => engineRef.current?.shoot()} disabled={busy}>
              Take the shot
            </button>
          </div>
        ) : (
          <div className="coach-label">
            <strong>Every player is a project.</strong>
            <span>
              Click {nextP?.number ?? ""} {nextP?.shirt ? `(${nextP.shirt.toLowerCase()})` : ""} to pass them the ball. Get it
              to all seven, then take the shot.
            </span>
          </div>
        )}
      </div>

      <div className="hero-copy">
        {children}
        <div className="kickoff">
          <button type="button" onClick={() => engineRef.current?.kickoff()} disabled={!ready}>
            Kick off
          </button>
          <a href="#team-sheet">or skip to the list</a>
        </div>
      </div>

      {(phase === "scored" || phase === "free" || goals > 0) && (
        <div className="scoreboard" aria-label={`Score: Shah ${goals}, Visitors 0`}>
          <span className="sb-team">Shah</span>
          <span className="sb-score">
            {goals}
            <i>–</i>0
          </span>
          <span className="sb-team">Vis</span>
        </div>
      )}

      {ready &&
        squad.map((p) => (
          <button
            key={p.slug}
            ref={(el) => {
              if (el) tagRefs.current.set(p.slug, el)
              else tagRefs.current.delete(p.slug)
            }}
            type="button"
            className="tag"
            data-hidden="true"
            data-touched={touched.includes(p.slug) ? "true" : "false"}
            disabled={busy}
            onClick={() => pick(p.slug)}
            aria-label={`Pass to ${p.number}, ${p.title}`}
          >
            <span className="tag-inner">
              <em>Pass</em>
              <b>{p.number}</b>
              <span>{p.shirt}</span>
            </span>
          </button>
        ))}

      <aside className="file" aria-live="polite" aria-hidden={current && !busy && phase !== "scored" ? "false" : "true"}>
        {current && (
          <div className="file-card" key={current.slug} data-more={more ? "true" : "false"}>
            <div className="file-top">
              <span className="file-no">{current.number}</span>
              <div>
                <p className="file-pos">
                  {current.position} · {current.year}
                </p>
                <h2>{current.title}</h2>
              </div>
              <button type="button" className="file-close" onClick={() => engineRef.current?.deselect()} aria-label="Close">
                ×
              </button>
            </div>
            <div className="file-body">
              {current.image && <img className="file-image" src={current.image} alt="" />}
              <p className="file-blurb">{current.blurb}</p>
              <p className="file-stack">{current.stack.join(" / ")}</p>
              <p className="file-links">
                {current.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                    {l.label}
                  </a>
                ))}
              </p>
            </div>
            <button type="button" className="file-more" onClick={() => setMore((m) => !m)}>
              {more ? "Less" : "Read more"}
            </button>
            <div className="file-actions">
              {canShoot && (
                <button type="button" className="btn-shoot" onClick={() => engineRef.current?.shoot()} disabled={busy}>
                  Take the shot
                </button>
              )}
              {passTo && passTo.slug !== current.slug && (
                <button type="button" className={phase === "free" ? "btn-pass" : "btn-shoot"} onClick={() => pick(passTo.slug)} disabled={busy}>
                  Pass to {passTo.number} <span>{passTo.shirt}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <div className="move">
        <div className="move-count">
          <span>{phase === "free" ? "Play on" : "The move"}</span>
          <strong>
            {Math.min(passes, total)}/{total}
          </strong>
        </div>
        <div className="move-chips" role="group" aria-label="Pass to a player">
          {order.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => pick(p.slug)}
              disabled={!ready || busy}
              data-touched={touched.includes(p.slug) ? "true" : "false"}
              data-next={next === p.slug ? "true" : "false"}
              data-active={selected === p.slug ? "true" : "false"}
              aria-label={`${p.number}, ${p.title}`}
            >
              {p.number}
            </button>
          ))}
        </div>
        <p className="move-hint">
          {failed
            ? "The 3D stadium needs WebGL. The full team sheet is below."
            : phase === "free"
              ? "Pass it around or take a shot. Arrow keys work too."
              : canShoot
                ? "Every pass made. Read the last card, then take the shot."
                : nextP
                ? passes === 0
                  ? `Click a player to pass. Start with ${nextP.number}, the highlighted one.`
                  : passes === total - 1
                    ? `One more. Find ${nextP.number} and they finish it.`
                    : `${total - passes} passes to go. Next up: ${nextP.number}.`
                : ""}
        </p>
      </div>

      {aiming && (
        <div className="aim">
          <p>
            <strong>Pick your spot.</strong> Click inside the goal to shoot. The keeper covers the middle, so aim for a corner.
          </p>
          <div className="aim-grid" role="group" aria-label="Or choose a corner">
            {[
              [-1, 1, "Top left"],
              [1, 1, "Top right"],
              [-1, 0, "Bottom left"],
              [1, 0, "Bottom right"],
            ].map(([c, r, label]) => (
              <button key={label} type="button" onClick={() => engineRef.current?.aimAt(c as number, r as number)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={result ? `result on ${result.kind}` : "result"} aria-live="assertive" key={result?.id}>
        {result && (
          <>
            <strong>{RESULT_COPY[result.kind]}</strong>
            <span>
              {result.kind === "goal" && phase === "scored"
                ? `${total} passes, ${squad.length} projects, finished by ${bySlug.get(result.slug)?.number}`
                : result.kind === "saved"
                ? "The keeper read it. Try a corner."
                : result.kind === "wide"
                ? "Just off target. Try again."
                : result.kind === "blocked"
                ? "Straight into a defender. Find a gap."
                : `${bySlug.get(result.slug)?.number} ${bySlug.get(result.slug)?.title}`}
            </span>
            {result.kind === "goal" && phase === "scored" && (
              <div className="result-actions">
                <button type="button" onClick={toSheet}>
                  Read the team sheet
                </button>
                <button type="button" onClick={replay}>
                  Play it again
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div ref={fadeRef} className="stadium-fade" aria-hidden="true" />
      {!ready && !failed && <div className="stadium-loading">Warming up…</div>}
    </div>
  )
}
