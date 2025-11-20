import { useEffect, useMemo, useRef, useState } from "react";
import magicCompass from "./assets/magic-compass.svg";
import disneyCastle from "./assets/disney-castle.svg";
import universalGlobe from "./assets/universal-globe.svg";

const STORAGE_KEY = "passholder-park-tracker";
const SECTION_KEYS = ["home", "disney", "universal", "profile"];

const RESORTS = {
  disney: {
    label: "Disney World",
    icon: disneyCastle,
    parks: {
      "magic-kingdom": "Magic Kingdom",
      epcot: "EPCOT",
      "hollywood-studios": "Hollywood Studios",
      "animal-kingdom": "Animal Kingdom",
    },
  },
  universal: {
    label: "Universal Orlando",
    icon: universalGlobe,
    parks: {
      "universal-studios-florida": "Universal Studios Florida",
      "islands-of-adventure": "Islands of Adventure",
      "volcano-bay": "Volcano Bay",
    },
  },
};

const defaultState = () => ({
  disney: { passholders: {} },
  universal: { passholders: {} },
});

const loadState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState();
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return defaultState();
    }
    return {
      disney: parsed.disney ?? defaultState().disney,
      universal: parsed.universal ?? defaultState().universal,
    };
  } catch (error) {
    console.warn("Failed to load saved data, using defaults.", error);
    return defaultState();
  }
};

const normalizeName = (value) =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const computeLeaderboards = (passholders = {}) => {
  const overall = Object.entries(passholders).map(([name, stats]) => ({
    name,
    total: stats.total ?? 0,
  }));

  overall.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  const byPark = {};

  Object.entries(passholders).forEach(([name, stats]) => {
    Object.entries(stats.parks ?? {}).forEach(([parkId, visits]) => {
      if (!byPark[parkId]) {
        byPark[parkId] = [];
      }
      byPark[parkId].push({ name, visits });
    });
  });

  Object.values(byPark).forEach((entries) => {
    entries.sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
  });

  return { overall, byPark };
};

const VisitForm = ({ resortLabel, parks, onSubmit }) => {
  const parkKeys = Object.keys(parks);
  const [name, setName] = useState("");
  const [park, setPark] = useState(parkKeys[0] ?? "");
  const [visits, setVisits] = useState(1);

  useEffect(() => {
    if (parkKeys.length > 0) {
      setPark((current) => (parkKeys.includes(current) ? current : parkKeys[0]));
    }
  }, [parkKeys.join(",")]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!name.trim() || !park) {
      return;
    }
    onSubmit({
      name,
      park,
      visits,
    });
    setName("");
    setPark(parkKeys[0] ?? "");
    setVisits(1);
  };

  return (
    <section className="form-card" aria-labelledby={`${resortLabel}-form-heading`}>
      <h3 id={`${resortLabel}-form-heading`}>Log a Visit</h3>
      <form className="visit-form" onSubmit={handleSubmit}>
        <label className="input-group">
          <span>Passholder Name</span>
          <input
            type="text"
            name="name"
            placeholder="e.g. Alex Rivera"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="input-group">
          <span>Park</span>
          <select
            name="park"
            required
            value={park}
            onChange={(event) => setPark(event.target.value)}
          >
            {parkKeys.map((parkId) => (
              <option value={parkId} key={parkId}>
                {parks[parkId]}
              </option>
            ))}
          </select>
        </label>
        <label className="input-group">
          <span>Visits to Add</span>
          <input
            type="number"
            name="visits"
            min="1"
            max="365"
            required
            value={visits}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              setVisits(Number.isNaN(next) ? 1 : Math.min(Math.max(next, 1), 365));
            }}
          />
        </label>
        <button type="submit" className="submit-button">
          Save Visit
        </button>
      </form>
    </section>
  );
};

const Leaderboards = ({ overall, byPark, parks }) => (
  <section className="leaderboards" aria-label="Leaderboards">
    <div className="leaderboard-group">
      <h4>Overall Leaders</h4>
      <ol className="leaderboard-list">
        {overall.length === 0 ? (
          <li>
            <span>No visits logged yet.</span>
            Be the first!
          </li>
        ) : (
          overall.slice(0, 10).map((entry, index) => (
            <li key={entry.name}>
              <strong>
                {index + 1}. {entry.name}
              </strong>
              <span>{entry.total}</span>
            </li>
          ))
        )}
      </ol>
    </div>
    <div className="leaderboard-group">
      <h4>By Park</h4>
      <div className="park-leaderboards">
        {Object.entries(parks).map(([parkId, parkName]) => {
          const entries = (byPark[parkId] ?? []).slice(0, 10);
          return (
            <section className="leaderboard-group" key={parkId}>
              <h5 className="park-name">{parkName}</h5>
              <ol className="leaderboard-list">
                {entries.length === 0 ? (
                  <li>
                    <span>No visits logged.</span>
                    Start the leaderboard!
                  </li>
                ) : (
                  entries.map((entry, index) => (
                    <li key={`${parkId}-${entry.name}`}>
                      <strong>
                        {index + 1}. {entry.name}
                      </strong>
                      <span>{entry.visits}</span>
                    </li>
                  ))
                )}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  </section>
);

const HeroSection = ({ onNavigate }) => (
  <div className="hero-section" aria-labelledby="home-heading">
    <div className="hero-card">
      <h2 id="home-heading">Track Every Magical Memory</h2>
      <p>
        Log your visits to Walt Disney World and Universal Orlando parks, see how you
        stack up on the leaderboards, and celebrate the passholders who never miss a
        chance to explore the parks.
      </p>
      <div className="hero-actions">
        <button className="action-button" type="button" onClick={() => onNavigate("disney")}>
          Explore Disney World Stats
        </button>
        <button
          className="action-button secondary"
          type="button"
          onClick={() => onNavigate("universal")}
        >
          Explore Universal Orlando Stats
        </button>
      </div>
    </div>

    <section className="highlights">
      <article>
        <h3>Log Every Visit</h3>
        <p>Add your trip counts park-by-park in just a few taps.</p>
      </article>
      <article>
        <h3>Compare with Friends</h3>
        <p>View resort-specific and overall leaderboards instantly.</p>
      </article>
      <article>
        <h3>Keep It Personal</h3>
        <p>Your stats live in your browser using private local storage.</p>
      </article>
    </section>
  </div>
);

const ProfileSection = ({ state, leaderboards, onNavigate }) => {
  const userStats = useMemo(() => {
    const allPassholders = {
      ...(state.disney?.passholders ?? {}),
      ...(state.universal?.passholders ?? {}),
    };
    
    const totalVisits = Object.values(allPassholders).reduce((sum, stats) => sum + (stats.total ?? 0), 0);
    const disneyVisits = Object.values(state.disney?.passholders ?? {}).reduce((sum, stats) => sum + (stats.total ?? 0), 0);
    const universalVisits = Object.values(state.universal?.passholders ?? {}).reduce((sum, stats) => sum + (stats.total ?? 0), 0);
    
    const parkBreakdown = {};
    Object.values(RESORTS).forEach((resort) => {
      Object.entries(resort.parks).forEach(([parkId, parkName]) => {
        parkBreakdown[parkId] = {
          name: parkName,
          visits: 0,
          resort: resort.label,
        };
      });
    });
    
    Object.values(allPassholders).forEach((stats) => {
      Object.entries(stats.parks ?? {}).forEach(([parkId, visits]) => {
        if (parkBreakdown[parkId]) {
          parkBreakdown[parkId].visits += visits;
        }
      });
    });
    
    return {
      totalVisits,
      disneyVisits,
      universalVisits,
      parkBreakdown: Object.values(parkBreakdown).filter((p) => p.visits > 0),
    };
  }, [state]);

  return (
    <div className="profile-section">
      <div className="section-intro">
        <div>
          <h2 id="profile-heading">Your Profile</h2>
          <p>View your visit statistics and park history</p>
        </div>
      </div>

      <div className="profile-stats-grid">
        <div className="stat-card">
          <h3>Total Visits</h3>
          <p className="stat-number">{userStats.totalVisits}</p>
          <p className="stat-label">Across all parks</p>
        </div>
        <div className="stat-card">
          <h3>Disney World</h3>
          <p className="stat-number">{userStats.disneyVisits}</p>
          <p className="stat-label">Total visits</p>
        </div>
        <div className="stat-card">
          <h3>Universal Orlando</h3>
          <p className="stat-number">{userStats.universalVisits}</p>
          <p className="stat-label">Total visits</p>
        </div>
      </div>

      {userStats.parkBreakdown.length > 0 && (
        <div className="park-breakdown">
          <h3>Park Breakdown</h3>
          <div className="park-list">
            {userStats.parkBreakdown
              .sort((a, b) => b.visits - a.visits)
              .map((park) => (
                <div key={park.name} className="park-item">
                  <div>
                    <strong>{park.name}</strong>
                    <span className="park-resort">{park.resort}</span>
                  </div>
                  <span className="park-visits">{park.visits} visits</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="profile-actions">
        <button className="action-button" type="button" onClick={() => onNavigate("disney")}>
          Log Disney Visit
        </button>
        <button className="action-button secondary" type="button" onClick={() => onNavigate("universal")}>
          Log Universal Visit
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return SECTION_KEYS.includes(hash) ? hash : "home";
  });
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [showSignInForm, setShowSignInForm] = useState(false);
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const sectionRefs = useRef({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (SECTION_KEYS.includes(hash)) {
        setActiveSection(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const node = sectionRefs.current[activeSection];
    node?.focus?.({ preventScroll: false });
  }, [activeSection]);

  const leaderboards = useMemo(
    () => ({
      disney: computeLeaderboards(state.disney?.passholders),
      universal: computeLeaderboards(state.universal?.passholders),
    }),
    [state.disney, state.universal]
  );

  const handleNavigate = (target) => {
    const resolved = SECTION_KEYS.includes(target) ? target : "home";
    setActiveSection(resolved);
    window.history.replaceState(null, "", `#${resolved}`);
  };

  const handleLogVisit = (resortKey, { name, park, visits }) => {
    setState((previous) => {
      const next = {
        ...previous,
        [resortKey]: {
          passholders: { ...(previous[resortKey]?.passholders ?? {}) },
        },
      };

      const passholders = next[resortKey].passholders;
      const normalizedName = normalizeName(name);
      const current = passholders[normalizedName] ?? { total: 0, parks: {} };
      const nextParkVisits = (current.parks[park] ?? 0) + visits;
      const updatedParks = { ...current.parks, [park]: nextParkVisits };
      const updatedTotal = Object.values(updatedParks).reduce((sum, count) => sum + count, 0);

      passholders[normalizedName] = {
        total: updatedTotal,
        parks: updatedParks,
      };

      return next;
    });
  };

  const handleClearData = () => {
    const confirmed = window.confirm("Clear all saved visit data? This cannot be undone.");
    if (!confirmed) {
      return;
    }
    const fresh = defaultState();
    setState(fresh);
    handleNavigate("home");
  };

  const handleSignIn = () => {
    setIsSignedIn(true);
    setShowSignInForm(false);
    setIsCreateAccount(false);
  };

  const handleCreateAccount = () => {
    setIsSignedIn(true);
    setShowSignInForm(false);
    setIsCreateAccount(false);
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    if (activeSection === "profile") {
      handleNavigate("home");
    }
  };

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <img src={magicCompass} alt="" aria-hidden="true" />
          <div>
            <h1>Passholder Park Tracker</h1>
            <p>Where adventures become friendly competition</p>
          </div>
        </div>
        <div className="header-right">
          <nav className="site-nav" aria-label="Primary">
            {SECTION_KEYS.filter((section) => section !== "profile").map((section) => (
              <button
                key={section}
                className={`nav-link${activeSection === section ? " is-active" : ""}`}
                type="button"
                data-target={section}
                onClick={() => handleNavigate(section)}
              >
                {section === "home" ? "Home" : RESORTS[section]?.label ?? section}
              </button>
            ))}
          </nav>
          <div className="sign-in-area">
            {isSignedIn ? (
              <div className="user-menu">
                <button className="profile-button" type="button" onClick={() => handleNavigate("profile")}>
                  Profile
                </button>
                <span className="user-greeting">Welcome back!</span>
                <button className="sign-out-button" type="button" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="sign-in-button" type="button" onClick={() => setShowSignInForm(!showSignInForm)}>
                Sign In
              </button>
            )}
            {showSignInForm && !isSignedIn && (
              <div className="sign-in-form">
                <div className="auth-tabs">
                  <button
                    type="button"
                    className={`auth-tab${!isCreateAccount ? " is-active" : ""}`}
                    onClick={() => setIsCreateAccount(false)}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`auth-tab${isCreateAccount ? " is-active" : ""}`}
                    onClick={() => setIsCreateAccount(true)}
                  >
                    Create Account
                  </button>
                </div>
                {!isCreateAccount ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
                    <h4>Sign In</h4>
                    <label className="input-group">
                      <span>Email</span>
                      <input type="email" placeholder="your@email.com" required />
                    </label>
                    <label className="input-group">
                      <span>Password</span>
                      <input type="password" placeholder="••••••••" required />
                    </label>
                    <button type="submit" className="submit-button">Sign In</button>
                  </form>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateAccount(); }}>
                    <h4>Create Account</h4>
                    <label className="input-group">
                      <span>Name</span>
                      <input type="text" placeholder="Your name" required />
                    </label>
                    <label className="input-group">
                      <span>Email</span>
                      <input type="email" placeholder="your@email.com" required />
                    </label>
                    <label className="input-group">
                      <span>Password</span>
                      <input type="password" placeholder="••••••••" required minLength="8" />
                    </label>
                    <label className="input-group">
                      <span>Confirm Password</span>
                      <input type="password" placeholder="••••••••" required minLength="8" />
                    </label>
                    <button type="submit" className="submit-button">Create Account</button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <section
          ref={(node) => {
            sectionRefs.current.home = node ?? undefined;
          }}
          id="home"
          className={`page-section${activeSection === "home" ? " is-visible" : ""}`}
          aria-hidden={activeSection !== "home"}
          tabIndex={-1}
        >
          <HeroSection onNavigate={handleNavigate} />
        </section>

        {Object.entries(RESORTS).map(([resortKey, config]) => {
          const isActive = activeSection === resortKey;
          const leaderBoardData = leaderboards[resortKey];

          return (
            <section
              key={resortKey}
              ref={(node) => {
                sectionRefs.current[resortKey] = node ?? undefined;
              }}
              id={resortKey}
              className={`page-section${isActive ? " is-visible" : ""}`}
              aria-hidden={!isActive}
              tabIndex={-1}
              aria-labelledby={`${resortKey}-heading`}
            >
              <div className="section-intro">
                <img src={config.icon} alt="" aria-hidden="true" />
                <div>
                  <h2 id={`${resortKey}-heading`}>{config.label}</h2>
                  <p>
                    {resortKey === "disney"
                      ? "Log your time across the four iconic parks and see which passholder reigns supreme."
                      : "Track your journeys through thrilling attractions and rise to the top of the Universal leaderboard."}
                  </p>
                </div>
              </div>

              <div className="content-grid">
                <VisitForm
                  resortLabel={resortKey}
                  parks={config.parks}
                  onSubmit={(payload) => handleLogVisit(resortKey, payload)}
                />
                <Leaderboards
                  overall={leaderBoardData.overall}
                  byPark={leaderBoardData.byPark}
                  parks={config.parks}
                />
              </div>
            </section>
          );
        })}

        {isSignedIn && (
          <section
            ref={(node) => {
              sectionRefs.current.profile = node ?? undefined;
            }}
            id="profile"
            className={`page-section${activeSection === "profile" ? " is-visible" : ""}`}
            aria-hidden={activeSection !== "profile"}
            tabIndex={-1}
            aria-labelledby="profile-heading"
          >
            <ProfileSection state={state} leaderboards={leaderboards} onNavigate={handleNavigate} />
          </section>
        )}
      </main>

      <footer className="site-footer">
        <p>
          Built for passholders who live for the next park day. Data lives locally in your browser
          storage.
        </p>
        <button className="clear-data-button" type="button" onClick={handleClearData}>
          Clear Local Data
        </button>
      </footer>
    </>
  );
}
