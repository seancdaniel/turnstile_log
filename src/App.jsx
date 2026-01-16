import { useEffect, useMemo, useRef, useState } from 'react';
import magicCompass from './assets/magic-compass.svg';
import disneyCastle from './assets/disney-castle.svg';
import universalGlobe from './assets/universal-globe.svg';

const STORAGE_KEY = 'passholder-park-tracker';
const SECTION_KEYS = ['home', 'disney', 'universal', 'snacks', 'profile'];

const RESORTS = {
  disney: {
    label: 'Disney World',
    icon: disneyCastle,
    parks: {
      'magic-kingdom': 'Magic Kingdom',
      epcot: 'EPCOT',
      'hollywood-studios': 'Hollywood Studios',
      'animal-kingdom': 'Animal Kingdom',
    },
  },
  universal: {
    label: 'Universal Orlando',
    icon: universalGlobe,
    parks: {
      'universal-studios-florida': 'Universal Studios Florida',
      'islands-of-adventure': 'Islands of Adventure',
      'volcano-bay': 'Volcano Bay',
    },
  },
};

const RIDES = {
  'magic-kingdom': [
    'Space Mountain',
    'Big Thunder Mountain Railroad',
    'Splash Mountain',
    'Seven Dwarfs Mine Train',
    'Haunted Mansion',
    'Pirates of the Caribbean',
    'Jungle Cruise',
    "Peter Pan's Flight",
    "It's a Small World",
    'The Many Adventures of Winnie the Pooh',
    "Buzz Lightyear's Space Ranger Spin",
    'Astro Orbiter',
    'Tomorrowland Transit Authority PeopleMover',
    "Walt Disney's Carousel of Progress",
    "Mickey's PhilharMagic",
    'Under the Sea - Journey of the Little Mermaid',
    'The Barnstormer',
    'Dumbo the Flying Elephant',
    'Mad Tea Party',
    'The Magic Carpets of Aladdin',
    'Walt Disney World Railroad',
    "Tiana's Bayou Adventure",
    'Tron Lightcycle / Run',
  ],
  epcot: [
    'Guardians of the Galaxy: Cosmic Rewind',
    'Test Track',
    "Soarin' Around the World",
    'Spaceship Earth',
    'Frozen Ever After',
    "Remy's Ratatouille Adventure",
    'Mission: SPACE',
    'The Seas with Nemo & Friends',
    'Living with the Land',
    'Journey Into Imagination with Figment',
    'Gran Fiesta Tour Starring The Three Caballeros',
    'Turtle Talk with Crush',
    'The American Adventure',
    'Reflections of China',
    'Impressions de France',
    'Canada Far and Wide',
  ],
  'hollywood-studios': [
    'Star Wars: Rise of the Resistance',
    'Millennium Falcon: Smugglers Run',
    "Mickey & Minnie's Runaway Railway",
    'Slinky Dog Dash',
    'Toy Story Mania!',
    "Rock 'n' Roller Coaster Starring Aerosmith",
    'The Twilight Zone Tower of Terror',
    'Star Tours - The Adventures Continue',
    'Indiana Jones Epic Stunt Spectacular!',
    'Muppet*Vision 3D',
    'Alien Swirling Saucers',
    "Lightning McQueen's Racing Academy",
    'Walt Disney Presents',
    'Beauty and the Beast - Live on Stage',
    'Frozen Sing-Along Celebration',
  ],
  'animal-kingdom': [
    'Avatar Flight of Passage',
    'Expedition Everest - Legend of the Forbidden Mountain',
    'Kilimanjaro Safaris',
    'DINOSAUR',
    'Kali River Rapids',
    "Na'vi River Journey",
    "It's Tough to Be a Bug!",
    'TriceraTop Spin',
    'The Boneyard',
    'Wildlife Express Train',
    'Maharajah Jungle Trek',
    'Gorilla Falls Exploration Trail',
    'Festival of the Lion King',
    'Finding Nemo: The Big Blue... and Beyond!',
  ],
  'universal-studios-florida': [
    'Harry Potter and the Escape from Gringotts',
    'Revenge of the Mummy',
    'Hollywood Rip Ride Rockit',
    'Transformers: The Ride 3D',
    'The Simpsons Ride',
    'Men in Black Alien Attack',
    'Despicable Me Minion Mayhem',
    'E.T. Adventure',
    'Fast & Furious - Supercharged',
    'Race Through New York Starring Jimmy Fallon',
    "Kang & Kodos' Twirl 'n' Hurl",
    'The Bourne Stuntacular',
    "Hogwarts Express - King's Cross Station",
  ],
  'islands-of-adventure': [
    "Hagrid's Magical Creatures Motorbike Adventure",
    'Harry Potter and the Forbidden Journey',
    'The Incredible Hulk Coaster',
    'Jurassic World VelociCoaster',
    'Skull Island: Reign of Kong',
    'The Amazing Adventures of Spider-Man',
    'Jurassic Park River Adventure',
    "Dudley Do-Right's Ripsaw Falls",
    "Popeye & Bluto's Bilge-Rat Barges",
    'Flight of the Hippogriff',
    'The Cat in the Hat',
    'One Fish, Two Fish, Red Fish, Blue Fish',
    'Caro-Seuss-el',
    'Hogwarts Express - Hogsmeade Station',
  ],
  'volcano-bay': [
    'Krakatau Aqua Coaster',
    "Ko'okiri Body Plunge",
    'Kala & Tai Nui Serpentine Body Slides',
    'Punga Racers',
    'Maku Puihi Round Raft Rides',
    'TeAwa The Fearless River',
    'Waturi Beach',
    'Reef',
    'Runamukka Reef',
    'Tot Tiki Reef',
  ],
};

const defaultProfile = () => ({
  name: '',
  avatarUrl: '',
  favoriteRide: '',
  favoritePark: '',
});

const defaultState = () => ({
  profile: defaultProfile(),
  disney: { passholders: {} },
  universal: { passholders: {} },
  snacks: {},
});

const loadState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultState();
    }
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== 'object') {
      return defaultState();
    }
    const defaults = defaultState();
    return {
      profile: parsed.profile
        ? { ...defaults.profile, ...parsed.profile }
        : defaultProfile(),
      disney: parsed.disney ?? defaults.disney,
      universal: parsed.universal ?? defaults.universal,
      snacks: parsed.snacks ?? defaults.snacks,
    };
  } catch (error) {
    console.warn('Failed to load saved data, using defaults.', error);
    return defaultState();
  }
};

const normalizeName = (value) =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

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

const VisitForm = ({ resortLabel, parks, onSubmit, currentUserName }) => {
  const parkKeys = Object.keys(parks);
  const [name, setName] = useState(currentUserName ?? '');
  const [park, setPark] = useState(parkKeys[0] ?? '');
  const [visits, setVisits] = useState(1);
  const isReadOnlyName = Boolean(currentUserName);

  useEffect(() => {
    if (parkKeys.length > 0) {
      setPark((current) =>
        parkKeys.includes(current) ? current : parkKeys[0]
      );
    }
  }, [parkKeys]);

  useEffect(() => {
    if (currentUserName) {
      setName(currentUserName);
    }
  }, [currentUserName]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!park) {
      return;
    }
    if (!currentUserName && !name.trim()) {
      return;
    }
    onSubmit({
      name,
      park,
      visits,
    });
    setName('');
    setPark(parkKeys[0] ?? '');
    setVisits(1);
  };

  return (
    <section
      className="form-card"
      aria-labelledby={`${resortLabel}-form-heading`}
    >
      <h3 id={`${resortLabel}-form-heading`}>Log a Visit</h3>
      <form className="visit-form" onSubmit={handleSubmit}>
        {!isReadOnlyName && (
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
        )}
        {isReadOnlyName && (
          <div className="input-group">
            <span>Signed-In Passholder</span>
            <div className="readonly-input">{currentUserName}</div>
          </div>
        )}
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
              setVisits(
                Number.isNaN(next) ? 1 : Math.min(Math.max(next, 1), 365)
              );
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
        Log your visits to Walt Disney World and Universal Orlando parks, see
        how you stack up on the leaderboards, and celebrate the passholders who
        never miss a chance to explore the parks.
      </p>
      <div className="hero-actions">
        <button
          className="action-button"
          type="button"
          onClick={() => onNavigate('disney')}
        >
          Explore Disney World Stats
        </button>
        <button
          className="action-button secondary"
          type="button"
          onClick={() => onNavigate('universal')}
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

const SnacksSection = ({ snacks, resorts, onAddSnack }) => {
  const [selectedResort, setSelectedResort] = useState('disney');
  const [selectedPark, setSelectedPark] = useState('');
  const [snackName, setSnackName] = useState('');
  const [snackDescription, setSnackDescription] = useState('');
  const [snackPhoto, setSnackPhoto] = useState(null);
  const [snackReview, setSnackReview] = useState('');

  const resortKeys = Object.keys(resorts);
  const parks = resorts[selectedResort]?.parks ?? {};
  const parkKeys = Object.keys(parks);

  useEffect(() => {
    if (parkKeys.length > 0 && !parkKeys.includes(selectedPark)) {
      setSelectedPark(parkKeys[0]);
    }
  }, [selectedResort, parkKeys, selectedPark]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!snackName.trim() || !snackDescription.trim()) {
      return;
    }

    let photoDataUrl = null;
    if (snackPhoto) {
      photoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(snackPhoto);
      });
    }

    onAddSnack(selectedResort, selectedPark, {
      name: snackName.trim(),
      description: snackDescription.trim(),
      photo: photoDataUrl,
      review: snackReview.trim(),
    });
    setSnackName('');
    setSnackDescription('');
    setSnackPhoto(null);
    setSnackReview('');
  };

  return (
    <div className="content-grid">
      <section className="form-card" aria-labelledby="snacks-form-heading">
        <h3 id="snacks-form-heading">Add a New Snack</h3>
        <form className="snack-form" onSubmit={handleSubmit}>
          <label className="input-group">
            <span>Resort</span>
            <select
              name="resort"
              value={selectedResort}
              onChange={(event) => setSelectedResort(event.target.value)}
            >
              {resortKeys.map((resort) => (
                <option value={resort} key={resort}>
                  {resorts[resort].label}
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Park</span>
            <select
              name="park"
              value={selectedPark}
              onChange={(event) => setSelectedPark(event.target.value)}
            >
              {parkKeys.map((parkId) => (
                <option value={parkId} key={parkId}>
                  {parks[parkId]}
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Snack Name</span>
            <input
              type="text"
              name="snackName"
              placeholder="e.g. Dole Whip"
              required
              value={snackName}
              onChange={(event) => setSnackName(event.target.value)}
            />
          </label>
          <label className="input-group">
            <span>Description</span>
            <textarea
              name="snackDescription"
              placeholder="Describe the snack..."
              required
              value={snackDescription}
              onChange={(event) => setSnackDescription(event.target.value)}
            />
          </label>
          <label className="input-group">
            <span>Photo (optional)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setSnackPhoto(event.target.files[0])}
            />
          </label>
          <label className="input-group">
            <span>Review</span>
            <textarea
              name="snackReview"
              placeholder="Your thoughts on the snack..."
              value={snackReview}
              onChange={(event) => setSnackReview(event.target.value)}
            />
          </label>
          <button type="submit" className="submit-button">
            Add Snack
          </button>
        </form>
      </section>

      <section className="snacks-list" aria-labelledby="snacks-list-heading">
        <h3 id="snacks-list-heading">Available Snacks</h3>
        {resortKeys.map((resort) => (
          <div key={resort} className="resort-snacks">
            <h4>{resorts[resort].label}</h4>
            {Object.entries(resorts[resort].parks).map(([parkId, parkName]) => {
              const parkSnacks = snacks[resort]?.[parkId] ?? [];
              return (
                <div key={parkId} className="park-snacks">
                  <h5>{parkName}</h5>
                  {parkSnacks.length === 0 ? (
                    <p>No snacks added yet.</p>
                  ) : (
                    <ul>
                      {parkSnacks.map((snack, index) => (
                        <li key={index}>
                          <div>
                            <strong>{snack.name}</strong>: {snack.description}
                            {snack.photo && (
                              <div>
                                <img src={snack.photo} alt={snack.name} style={{ maxWidth: '200px', maxHeight: '200px' }} />
                              </div>
                            )}
                            {snack.review && (
                              <div>
                                <em>Review: {snack.review}</em>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>
    </div>
  );
};

const RideRandomizer = () => {
  const [selectedPark, setSelectedPark] = useState('');
  const [randomRide, setRandomRide] = useState(null);
  const [selectedResort, setSelectedResort] = useState('');

  const allParks = useMemo(() => {
    const parks = [];
    Object.entries(RESORTS).forEach(([resortKey, resort]) => {
      Object.entries(resort.parks).forEach(([parkId, parkName]) => {
        parks.push({
          id: parkId,
          name: parkName,
          resort: resortKey,
          resortLabel: resort.label,
        });
      });
    });
    return parks;
  }, []);

  const handleParkChange = (event) => {
    const parkId = event.target.value;
    setSelectedPark(parkId);
    setRandomRide(null);

    const park = allParks.find((p) => p.id === parkId);
    if (park) {
      setSelectedResort(park.resort);
    } else {
      setSelectedResort('');
    }
  };

  const handleRandomize = () => {
    if (!selectedPark) {
      return;
    }

    const rides = RIDES[selectedPark] || [];
    if (rides.length === 0) {
      setRandomRide('No rides available for this park');
      return;
    }

    const randomIndex = Math.floor(Math.random() * rides.length);
    setRandomRide(rides[randomIndex]);
  };

  return (
    <div className="ride-randomizer-card">
      <h3>Ride Randomizer</h3>
      <p className="ride-randomizer-description">
        Select which park you&apos;re visiting today and get a random ride
        suggestion!
      </p>
      <div className="ride-randomizer-form">
        <label className="input-group">
          <span>Select Park</span>
          <select
            name="park"
            value={selectedPark}
            onChange={handleParkChange}
            required
          >
            <option value="">Choose a park...</option>
            {Object.entries(RESORTS).map(([resortKey, resort]) => (
              <optgroup key={resortKey} label={resort.label}>
                {Object.entries(resort.parks).map(([parkId, parkName]) => (
                  <option value={parkId} key={parkId}>
                    {parkName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="action-button"
          onClick={handleRandomize}
          disabled={!selectedPark}
        >
          Get Random Ride
        </button>
        {randomRide && (
          <div className="random-ride-result">
            <div className="random-ride-label">Your random ride:</div>
            <div className="random-ride-name">{randomRide}</div>
            {selectedResort && (
              <div className="random-ride-park">
                {allParks.find((p) => p.id === selectedPark)?.name}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileSection = ({ state, profile, onSaveProfile, onNavigate }) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(profile ?? defaultProfile());

  useEffect(() => {
    setProfileForm(profile ?? defaultProfile());
  }, [profile]);

  const handleProfileInput = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    onSaveProfile(profileForm);
    setIsEditingProfile(false);
  };

  const userStats = useMemo(() => {
    const allPassholders = {
      ...(state.disney?.passholders ?? {}),
      ...(state.universal?.passholders ?? {}),
    };

    const totalVisits = Object.values(allPassholders).reduce(
      (sum, stats) => sum + (stats.total ?? 0),
      0
    );
    const disneyVisits = Object.values(state.disney?.passholders ?? {}).reduce(
      (sum, stats) => sum + (stats.total ?? 0),
      0
    );
    const universalVisits = Object.values(
      state.universal?.passholders ?? {}
    ).reduce((sum, stats) => sum + (stats.total ?? 0), 0);

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

  const displayName = profile?.name?.trim() || 'Add your name';
  const favoriteRide = profile?.favoriteRide?.trim() || 'Add a favorite ride';
  const favoritePark = profile?.favoritePark?.trim() || 'Add a favorite park';

  const avatarInitials = profile?.name
    ? profile.name
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <div className="profile-section">
      <div className="section-intro profile-header">
        <div>
          <h2 id="profile-heading">Your Profile</h2>
          <p>
            View your visit statistics, park history, and personal favorites.
          </p>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-main">
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

          <RideRandomizer />

          <div className="profile-actions">
            <button
              className="action-button"
              type="button"
              onClick={() => onNavigate('disney')}
            >
              Log Disney Visit
            </button>
            <button
              className="action-button secondary"
              type="button"
              onClick={() => onNavigate('universal')}
            >
              Log Universal Visit
            </button>
          </div>
        </div>

        <aside className="profile-sidebar" aria-label="Profile preferences">
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar" aria-hidden="true">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <button
                className="edit-profile-button"
                type="button"
                onClick={() => setIsEditingProfile((prev) => !prev)}
              >
                {isEditingProfile ? 'Close' : 'Edit Profile'}
              </button>
            </div>

            {!isEditingProfile ? (
              <dl className="profile-info">
                <div className="profile-info-row">
                  <dt>Name</dt>
                  <dd>{displayName}</dd>
                </div>
                <div className="profile-info-row">
                  <dt>Favorite Ride</dt>
                  <dd>{favoriteRide}</dd>
                </div>
                <div className="profile-info-row">
                  <dt>Favorite Park</dt>
                  <dd>{favoritePark}</dd>
                </div>
              </dl>
            ) : (
              <form className="profile-form" onSubmit={handleProfileSubmit}>
                <label className="input-group">
                  <span>Name</span>
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={profileForm.name}
                    onChange={(event) =>
                      handleProfileInput('name', event.target.value)
                    }
                  />
                </label>
                <label className="input-group">
                  <span>Profile Picture URL</span>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={profileForm.avatarUrl}
                    onChange={(event) =>
                      handleProfileInput('avatarUrl', event.target.value)
                    }
                  />
                </label>
                <label className="input-group">
                  <span>Favorite Ride</span>
                  <input
                    type="text"
                    placeholder="e.g. Guardians of the Galaxy"
                    value={profileForm.favoriteRide}
                    onChange={(event) =>
                      handleProfileInput('favoriteRide', event.target.value)
                    }
                  />
                </label>
                <label className="input-group">
                  <span>Favorite Park</span>
                  <input
                    type="text"
                    placeholder="e.g. EPCOT"
                    value={profileForm.favoritePark}
                    onChange={(event) =>
                      handleProfileInput('favoritePark', event.target.value)
                    }
                  />
                </label>
                <button type="submit" className="submit-button">
                  Save Profile
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return SECTION_KEYS.includes(hash) ? hash : 'home';
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
      const hash = window.location.hash.replace('#', '');
      if (SECTION_KEYS.includes(hash)) {
        setActiveSection(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
    const resolved = SECTION_KEYS.includes(target) ? target : 'home';
    setActiveSection(resolved);
    window.history.replaceState(null, '', `#${resolved}`);
  };

  const signedInName = isSignedIn ? state.profile?.name?.trim() : '';

  const handleLogVisit = (resortKey, { name, park, visits }) => {
    const resolvedName = name?.trim() || signedInName;
    if (!resolvedName) {
      alert('Add your name in the profile editor before logging visits.');
      return;
    }
    setState((previous) => {
      const next = {
        ...previous,
        [resortKey]: {
          passholders: { ...(previous[resortKey]?.passholders ?? {}) },
        },
      };

      const passholders = next[resortKey].passholders;
      const normalizedName = normalizeName(resolvedName);
      const current = passholders[normalizedName] ?? { total: 0, parks: {} };
      const nextParkVisits = (current.parks[park] ?? 0) + visits;
      const updatedParks = { ...current.parks, [park]: nextParkVisits };
      const updatedTotal = Object.values(updatedParks).reduce(
        (sum, count) => sum + count,
        0
      );

      passholders[normalizedName] = {
        total: updatedTotal,
        parks: updatedParks,
      };

      return next;
    });
  };

  const handleAddSnack = (resort, park, snack) => {
    setState((previous) => {
      const next = {
        ...previous,
        snacks: { ...previous.snacks },
      };

      if (!next.snacks[resort]) {
        next.snacks[resort] = {};
      }
      if (!next.snacks[resort][park]) {
        next.snacks[resort][park] = [];
      }

      next.snacks[resort][park] = [
        ...next.snacks[resort][park],
        { ...snack, dateAdded: new Date().toISOString() },
      ];

      return next;
    });
  };

  const handleClearData = () => {
    const confirmed = window.confirm(
      'Clear all saved visit data? This cannot be undone.'
    );
    if (!confirmed) {
      return;
    }
    const fresh = defaultState();
    setState(fresh);
    handleNavigate('home');
  };

  const handleSaveProfile = (updates) => {
    setState((previous) => ({
      ...previous,
      profile: {
        ...defaultProfile(),
        ...(previous.profile ?? {}),
        ...updates,
      },
    }));
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
    if (activeSection === 'profile') {
      handleNavigate('home');
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
            {SECTION_KEYS.filter((section) => section !== 'profile').map(
              (section) => (
                <button
                  key={section}
                  className={`nav-link${activeSection === section ? ' is-active' : ''}`}
                  type="button"
                  data-target={section}
                  onClick={() => handleNavigate(section)}
                >
                  {section === 'home'
                    ? 'Home'
                    : section === 'snacks'
                    ? 'Snacks'
                    : (RESORTS[section]?.label ?? section)}
                </button>
              )
            )}
          </nav>
          <div className="sign-in-area">
            {isSignedIn ? (
              <div className="user-menu">
                <button
                  className="profile-button"
                  type="button"
                  onClick={() => handleNavigate('profile')}
                >
                  Profile
                </button>
                <span className="user-greeting">Welcome back!</span>
                <button
                  className="sign-out-button"
                  type="button"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="sign-in-button"
                type="button"
                onClick={() => setShowSignInForm(!showSignInForm)}
              >
                Sign In
              </button>
            )}
            {showSignInForm && !isSignedIn && (
              <div className="sign-in-form">
                <div className="auth-tabs">
                  <button
                    type="button"
                    className={`auth-tab${!isCreateAccount ? ' is-active' : ''}`}
                    onClick={() => setIsCreateAccount(false)}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`auth-tab${isCreateAccount ? ' is-active' : ''}`}
                    onClick={() => setIsCreateAccount(true)}
                  >
                    Create Account
                  </button>
                </div>
                {!isCreateAccount ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSignIn();
                    }}
                  >
                    <h4>Sign In</h4>
                    <label className="input-group">
                      <span>Email</span>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                    </label>
                    <label className="input-group">
                      <span>Password</span>
                      <input type="password" placeholder="••••••••" required />
                    </label>
                    <button type="submit" className="submit-button">
                      Sign In
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateAccount();
                    }}
                  >
                    <h4>Create Account</h4>
                    <label className="input-group">
                      <span>Name</span>
                      <input type="text" placeholder="Your name" required />
                    </label>
                    <label className="input-group">
                      <span>Email</span>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        required
                      />
                    </label>
                    <label className="input-group">
                      <span>Password</span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength="8"
                      />
                    </label>
                    <label className="input-group">
                      <span>Confirm Password</span>
                      <input
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength="8"
                      />
                    </label>
                    <button type="submit" className="submit-button">
                      Create Account
                    </button>
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
          className={`page-section${activeSection === 'home' ? ' is-visible' : ''}`}
          aria-hidden={activeSection !== 'home'}
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
              className={`page-section${isActive ? ' is-visible' : ''}`}
              aria-hidden={!isActive}
              tabIndex={-1}
              aria-labelledby={`${resortKey}-heading`}
            >
              <div className="section-intro">
                <img src={config.icon} alt="" aria-hidden="true" />
                <div>
                  <h2 id={`${resortKey}-heading`}>{config.label}</h2>
                  <p>
                    {resortKey === 'disney'
                      ? 'Log your time across the four iconic parks and see which passholder reigns supreme.'
                      : 'Track your journeys through thrilling attractions and rise to the top of the Universal leaderboard.'}
                  </p>
                </div>
              </div>

              <div className="content-grid">
                <VisitForm
                  resortLabel={resortKey}
                  parks={config.parks}
                  currentUserName={
                    isSignedIn && signedInName ? signedInName : ''
                  }
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

        <section
          ref={(node) => {
            sectionRefs.current.snacks = node ?? undefined;
          }}
          id="snacks"
          className={`page-section${activeSection === 'snacks' ? ' is-visible' : ''}`}
          aria-hidden={activeSection !== 'snacks'}
          tabIndex={-1}
          aria-labelledby="snacks-heading"
        >
          <div className="section-intro">
            <img src={magicCompass} alt="" aria-hidden="true" />
            <div>
              <h2 id="snacks-heading">Park Snacks</h2>
              <p>
                Stay up to date with the latest snacks and treats available at the parks. Add new discoveries and share what's delicious!
              </p>
            </div>
          </div>

          <SnacksSection
            snacks={state.snacks}
            resorts={RESORTS}
            onAddSnack={(resort, park, snack) => handleAddSnack(resort, park, snack)}
          />
        </section>

        {isSignedIn && (
          <section
            ref={(node) => {
              sectionRefs.current.profile = node ?? undefined;
            }}
            id="profile"
            className={`page-section${activeSection === 'profile' ? ' is-visible' : ''}`}
            aria-hidden={activeSection !== 'profile'}
            tabIndex={-1}
            aria-labelledby="profile-heading"
          >
            <ProfileSection
              state={state}
              profile={state.profile}
              onSaveProfile={handleSaveProfile}
              onNavigate={handleNavigate}
            />
          </section>
        )}
      </main>

      <footer className="site-footer">
        <p>
          Built for passholders who live for the next park day. Data lives
          locally in your browser storage.
        </p>
        <button
          className="clear-data-button"
          type="button"
          onClick={handleClearData}
        >
          Clear Local Data
        </button>
      </footer>
    </>
  );
}
