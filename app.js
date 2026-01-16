const STORAGE_KEY = 'passholder-park-tracker';

const resorts = {
  disney: {
    label: 'Disney World',
    parks: {
      'magic-kingdom': 'Magic Kingdom',
      epcot: 'EPCOT',
      'hollywood-studios': 'Hollywood Studios',
      'animal-kingdom': 'Animal Kingdom',
    },
  },
  universal: {
    label: 'Universal Orlando',
    parks: {
      'universal-studios-florida': 'Universal Studios Florida',
      'islands-of-adventure': 'Islands of Adventure',
      'volcano-bay': 'Volcano Bay',
    },
  },
};

const defaultState = () => ({
  disney: { passholders: {} },
  universal: { passholders: {} },
});

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultState();
    }
    return {
      disney: parsed.disney ?? defaultState().disney,
      universal: parsed.universal ?? defaultState().universal,
    };
  } catch (error) {
    console.warn('Unable to load saved data, starting fresh.', error);
    return defaultState();
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const titleCase = (value) =>
  value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const renderOverallLeaderboard = (container, passholders) => {
  container.innerHTML = '';
  if (!passholders.length) {
    container.innerHTML =
      '<li><span>No visits logged yet.</span>Be the first!</li>';
    return;
  }

  passholders
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, 10)
    .forEach((entry, index) => {
      const item = document.createElement('li');
      item.innerHTML = `<strong>${index + 1}. ${entry.name}</strong><span>${entry.total}</span>`;
      container.appendChild(item);
    });
};

const renderParkLeaderboards = (wrapper, resortKey, parkStats) => {
  wrapper.innerHTML = '';
  const template = document.getElementById('park-leaderboard-template');
  const parks = resorts[resortKey].parks;

  Object.entries(parks).forEach(([parkId, parkName]) => {
    const leaderboard = (parkStats[parkId] ?? []).slice(0, 10);
    const instance = template.content.cloneNode(true);
    const section = instance.querySelector('.leaderboard-group');
    const title = instance.querySelector('.park-name');
    const list = instance.querySelector('.leaderboard-list');

    title.textContent = parkName;
    if (!leaderboard.length) {
      list.innerHTML =
        '<li><span>No visits logged.</span>Start the leaderboard!</li>';
    } else {
      leaderboard.forEach((entry, index) => {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${index + 1}. ${entry.name}</strong><span>${entry.visits}</span>`;
        list.appendChild(item);
      });
    }

    wrapper.appendChild(section);
  });
};

const computeLeaderboards = (resortData) => {
  const passholders = resortData.passholders ?? {};
  const overall = [];
  const byPark = {};

  Object.entries(passholders).forEach(([name, stats]) => {
    overall.push({ name, total: stats.total ?? 0 });
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

const renderResort = (state, resortKey) => {
  const { overall, byPark } = computeLeaderboards(state[resortKey]);

  const overallElement = document.querySelector(
    `[data-leaderboard="${resortKey}-overall"]`
  );
  const parkWrapper = document.querySelector(
    `[data-resort-leaderboards="${resortKey}"]`
  );

  if (overallElement) {
    renderOverallLeaderboard(overallElement, overall);
  }

  if (parkWrapper) {
    renderParkLeaderboards(parkWrapper, resortKey, byPark);
  }
};

const attachNavHandlers = () => {
  const navButtons = Array.from(document.querySelectorAll('.nav-link'));
  const sections = Array.from(document.querySelectorAll('.page-section'));

  const activateSection = (targetId) => {
    navButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.target === targetId);
    });

    sections.forEach((section) => {
      section.classList.toggle('is-visible', section.id === targetId);
    });

    const targetSection = sections.find((section) => section.id === targetId);
    if (targetSection) {
      targetSection.focus?.({ preventScroll: false });
    }
  };

  navButtons.forEach((button) => {
    button.addEventListener('click', () =>
      activateSection(button.dataset.target)
    );
  });

  document.querySelectorAll('.action-button').forEach((button) => {
    button.addEventListener('click', () =>
      activateSection(button.dataset.target)
    );
  });
};

const attachFormHandlers = (state) => {
  document.querySelectorAll('.visit-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const resortKey = form.dataset.resort;
      const formData = new FormData(form);

      const name = titleCase(formData.get('name') ?? '');
      const parkId = formData.get('park');
      const visits = Math.max(
        1,
        Number.parseInt(formData.get('visits'), 10) || 0
      );

      if (!name) {
        return;
      }

      const resort =
        state[resortKey] ?? (state[resortKey] = { passholders: {} });
      const passholder =
        resort.passholders[name] ??
        (resort.passholders[name] = { total: 0, parks: {} });

      const currentParkVisits = passholder.parks[parkId] ?? 0;
      passholder.parks[parkId] = currentParkVisits + visits;
      passholder.total = Object.values(passholder.parks).reduce(
        (sum, count) => sum + count,
        0
      );

      saveState(state);
      renderResort(state, resortKey);
      form.reset();
      form.querySelector('input[name="visits"]').value = '1';
    });
  });
};

const attachClearDataHandler = (state) => {
  const clearButton = document.querySelector('.clear-data-button');
  if (!clearButton) {
    return;
  }

  clearButton.addEventListener('click', () => {
    const confirmed = window.confirm(
      'Clear all saved visit data? This cannot be undone.'
    );
    if (!confirmed) {
      return;
    }
    const freshState = defaultState();
    state.disney = freshState.disney;
    state.universal = freshState.universal;
    saveState(state);
    renderResort(state, 'disney');
    renderResort(state, 'universal');
  });
};

document.addEventListener('DOMContentLoaded', () => {
  const state = loadState();
  attachNavHandlers();
  attachFormHandlers(state);
  attachClearDataHandler(state);
  renderResort(state, 'disney');
  renderResort(state, 'universal');
});
