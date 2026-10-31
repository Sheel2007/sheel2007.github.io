import Stadium from "@/components/stadium/stadium"
import { bench, career, honors, starters, type Project } from "@/lib/content"

function ProjectRow({ p }: { p: Project }) {
  return (
    <li id={p.slug} className={p.image ? "row has-image" : "row"}>
      <span className="row-no">{p.number}</span>
      <div className="row-body">
        <h3>
          {p.title} <span className="row-year">{p.year}</span>
        </h3>
        <p>{p.blurb}</p>
        <p className="row-stack">{p.stack.join(" / ")}</p>
        <p className="row-links">
          {p.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </p>
      </div>
      {p.image && <img className="row-image" src={p.image} alt="" loading="lazy" />}
    </li>
  )
}

export default function Home() {
  return (
    <>
      <header className="masthead">
        <a href="#top" className="masthead-name">
          Sheel Shah
        </a>
        <nav>
          <a href="#team-sheet">Projects</a>
          <a href="#career">Experience</a>
          <a href="#honors">Honors</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="top">
        <Stadium squad={starters}>
          <p className="kicker">Matchday program · Season 26/27</p>
          <h1>
            Sheel
            <br />
            Shah
          </h1>
          <p className="hero-line">Computer science student. I build software, machine learning models and things with wires.</p>
        </Stadium>

        <section className="profile wrap" aria-labelledby="profile-title">
          <figure>
            <img src="/me.png" alt="Sheel Shah" />
            <figcaption>No. 26, Sheel Shah</figcaption>
          </figure>
          <div>
            <h2 id="profile-title" className="section-title">
              Player profile
            </h2>
            <p className="lede">
              I like building things people actually use. Lately that has meant a schedule builder for UMD students, a
              Raspberry Pi that drives an electric car, and a model that correctly predicted the 2026 World Cup. When I'm
              not at a keyboard I'm usually watching soccer.
            </p>
            <dl className="stats">
              <div>
                <dt>Position</dt>
                <dd>Software, ML, hardware</dd>
              </div>
              <div>
                <dt>Strong foot</dt>
                <dd>Python</dd>
              </div>
              <div>
                <dt>Also plays</dt>
                <dd>TypeScript, Java, C, SQL</dd>
              </div>
              <div>
                <dt>Kit bag</dt>
                <dd>React, FastAPI, Dash, scikit-learn, XGBoost, pandas, Raspberry Pi</dd>
              </div>
            </dl>
            <p className="contact-links">
              <a href="mailto:sheelshah030@gmail.com">Email</a>
              <a href="https://www.linkedin.com/in/sheelshah2007" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a href="https://github.com/Sheel2007" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </p>
          </div>
        </section>

        <section id="team-sheet" className="wrap" aria-labelledby="sheet-title">
          <div className="section-head">
            <h2 id="sheet-title" className="section-title">
              Team sheet
            </h2>
            <p>The starting seven. Pick a player on the field, or read on.</p>
          </div>
          <ol className="sheet">
            {starters.map((p) => (
              <ProjectRow key={p.slug} p={p} />
            ))}
          </ol>
          <h3 className="subhead">Substitutes</h3>
          <ol className="sheet bench">
            {bench.map((p) => (
              <ProjectRow key={p.slug} p={p} />
            ))}
          </ol>
        </section>

        <section id="career" className="wrap" aria-labelledby="career-title">
          <div className="section-head">
            <h2 id="career-title" className="section-title">
              Transfer history
            </h2>
            <p>Where I've worked.</p>
          </div>
          <table className="transfers">
            <thead>
              <tr>
                <th scope="col">Season</th>
                <th scope="col">Club</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {career.map((c) => (
                <tr key={c.club}>
                  <td className="mono">{c.period}</td>
                  <td>
                    <strong>{c.club}</strong>
                    <span className="note">{c.note}</span>
                  </td>
                  <td>{c.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="honors" className="wrap" aria-labelledby="honors-title">
          <div className="section-head">
            <h2 id="honors-title" className="section-title">
              Honors
            </h2>
          </div>
          <ul className="honors">
            {honors.map((h) => (
              <li key={h.title}>
                <span className="mono">{h.date}</span>
                <div>
                  <h3>{h.title}</h3>
                  <p>
                    {h.detail}{" "}
                    <a href={h.link.href} target="_blank" rel="noopener noreferrer">
                      {h.link.label}
                    </a>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer id="contact" className="fulltime">
        <div className="wrap">
          <p className="kicker">Full time</p>
          <h2>Let's talk.</h2>
          <p>About a role, a project, or last night's game.</p>
          <a className="email" href="mailto:sheelshah030@gmail.com">
            sheelshah030@gmail.com
          </a>
          <p className="contact-links">
            <a href="https://www.linkedin.com/in/sheelshah2007" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
            <a href="https://github.com/Sheel2007" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}
