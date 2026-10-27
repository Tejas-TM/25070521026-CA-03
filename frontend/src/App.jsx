import Earth3D from "./Earth3D";
import { useEffect, useState, useRef } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

const ecoTypes = [
  { name: "Plant a tree", icon: "🌳", points: 50 },
  { name: "Recycle waste", icon: "♻️", points: 20 },
  { name: "Save water", icon: "💧", points: 15 },
  { name: "Save electricity", icon: "⚡", points: 15 },
];

const missionPool = [
  {
    id: "green-start",
    title: "Green Starter",
    description: "Complete 2 eco-actions today.",
    icon: "🌱",
    target: 2,
    type: "total",
  },
  {
    id: "water-warrior",
    title: "Water Warrior",
    description: "Complete a water-saving action.",
    icon: "💧",
    target: 1,
    type: "specific",
    action: "Save water",
  },
  {
    id: "energy-guardian",
    title: "Energy Guardian",
    description: "Save electricity at least once.",
    icon: "⚡",
    target: 1,
    type: "specific",
    action: "Save electricity",
  },
  {
    id: "recycling-hero",
    title: "Recycling Hero",
    description: "Complete a recycling action.",
    icon: "♻️",
    target: 1,
    type: "specific",
    action: "Recycle waste",
  },
  {
    id: "tree-friend",
    title: "Friend of Forests",
    description: "Complete a tree-planting action.",
    icon: "🌳",
    target: 1,
    type: "specific",
    action: "Plant a tree",
  },
  {
    id: "eco-explorer",
    title: "Eco Explorer",
    description: "Complete 3 eco-actions today.",
    icon: "🧭",
    target: 3,
    type: "total",
  },
];

const achievements = [
  {
    id: "first-step",
    title: "First Green Step",
    icon: "🌱",
    description: "Log your first eco-action.",
    unlocked: (actions) => actions.length >= 1,
  },
  {
    id: "point-sprout",
    title: "Point Sprout",
    icon: "✨",
    description: "Earn 100 eco-points.",
    unlocked: (_, points) => points >= 100,
  },
  {
    id: "eco-collector",
    title: "Eco Collector",
    icon: "🏅",
    description: "Complete 10 eco-actions.",
    unlocked: (actions) => actions.length >= 10,
  },
  {
    id: "four-elements",
    title: "Four Elements",
    icon: "🌈",
    description: "Try all four eco-action types.",
    unlocked: (actions) =>
      new Set(actions.map((action) => action.name)).size >= 4,
  },
  {
    id: "planet-champion",
    title: "Planet Champion",
    icon: "",
    description: "Earn 500 eco-points.",
    unlocked: (_, points) => points >= 500,
  },
  {
    id: "eco-legend",
    title: "Eco Legend",
    icon: "👑",
    description: "Complete 25 eco-actions.",
    unlocked: (actions) => actions.length >= 25,
  },
];

function localDateKey(value = new Date()) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getActionDate(action) {
  return localDateKey(action.createdAt);
}

function getDailyProgress(mission, todayActions) {
  if (mission.type === "total") {
    return todayActions.length;
  }

  return todayActions.filter(
    (action) => action.name === mission.action
  ).length;
}

function calculateStreak(actions) {
  const activeDays = new Set(actions.map(getActionDate));
  let streak = 0;
  const date = new Date();

  // Count from today backwards. If no action was logged today,
  // allow a streak that ended yesterday to remain visible.
  if (!activeDays.has(localDateKey(date))) {
    date.setDate(date.getDate() - 1);
  }

  while (activeDays.has(localDateKey(date))) {
    streak += 1;
    date.setDate(date.getDate() - 1);
  }

  return streak;
}

function App() {
  const [nickname, setNickname] = useState(
    () => localStorage.getItem("echogarden_nickname") || ""
  );
  const [nicknameInput, setNicknameInput] = useState(
    () => localStorage.getItem("echogarden_nickname") || ""
  );
  const [actions, setActions] = useState([]);
  const [selected, setSelected] = useState("Plant a tree");
  const [description, setDescription] = useState("");
  const [weekly, setWeekly] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
const earthRef = useRef(null);

useEffect(() => {
  const handleScroll = () => {
    if (earthRef.current) {
      const y = window.scrollY * 0.15;
      earthRef.current.style.transform =
        `translateY(${y}px) rotate(${window.scrollY * 0.05}deg)`;
    }
  };

  window.addEventListener("scroll", handleScroll);

  return () => window.removeEventListener("scroll", handleScroll);
}, []);
  const totalPoints = actions.reduce(
    (total, action) => total + action.points,
    0
  );

const todayKey = localDateKey();
const todayActions = actions.filter(
  (action) => getActionDate(action) === todayKey
);

// Rotate the mission selection each day.
const dayNumber = Math.floor(
  new Date(`${todayKey}T00:00:00`).getTime() / 86400000
);
const dailyMissions = [0, 1, 2].map((offset) => {
  const index = (dayNumber + offset * 2) % missionPool.length;
  return missionPool[index];
});

const streak = calculateStreak(actions);
const unlockedAchievements = achievements.filter((badge) =>
  badge.unlocked(actions, totalPoints)
);

const nextAchievement = achievements.find(
  (badge) => !badge.unlocked(actions, totalPoints)
);

const surpriseQuest = missionPool[(dayNumber * 3 + 1) % missionPool.length];
const surpriseProgress = getDailyProgress(surpriseQuest, todayActions);
const surpriseComplete = surpriseProgress >= surpriseQuest.target;

  async function loadLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/leaderboard`);
      if (!response.ok) throw new Error("Leaderboard unavailable");
      setLeaderboard(await response.json());
    } catch {
      setError("Couldn't load the leaderboard. Check that the backend is running.");
    }
  }

  async function loadParticipantData(currentNickname) {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const query = `?nickname=${encodeURIComponent(currentNickname)}`;

      const [actionsResponse, weeklyResponse] = await Promise.all([
        fetch(`${API_URL}/actions${query}`),
        fetch(`${API_URL}/reports/weekly${query}`),
      ]);

      if (!actionsResponse.ok || !weeklyResponse.ok) {
        throw new Error("Could not load participant data.");
      }

      const [savedActions, report] = await Promise.all([
        actionsResponse.json(),
        weeklyResponse.json(),
      ]);

      setActions(savedActions);
      setWeekly(report);
    } catch {
      setError("Couldn't load your data. Check that the backend is running on port 5001.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (nickname) {
      loadParticipantData(nickname);
    } else {
      setActions([]);
      setWeekly(null);
    }
  }, [nickname]);

  function chooseNickname(event) {
    event.preventDefault();
    const cleaned = nicknameInput.trim().replace(/\s+/g, " ");

    if (
      cleaned.length < 2 ||
      cleaned.length > 24 ||
      !/^[\p{L}\p{N} _-]+$/u.test(cleaned)
    ) {
      setError("Use 2–24 letters, numbers, spaces, underscores, or hyphens.");
      return;
    }

    localStorage.setItem("echogarden_nickname", cleaned);
    setNickname(cleaned);
    setNicknameInput(cleaned);
  }

  async function addAction(event) {
    event.preventDefault();

    if (!nickname || saving) return;

    const ecoAction = ecoTypes.find((item) => item.name === selected);
    if (!ecoAction) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          name: ecoAction.name,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save your action.");
      }

      setActions((previous) => [data, ...previous]);
      setDescription("");
      setMessage(`Great job, ${nickname}! You earned ${data.points} points.`);
      await Promise.all([
        loadParticipantData(nickname),
        loadLeaderboard(),
      ]);
    } catch (err) {
      setError(err.message || "Could not save your action.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app">
    

      <header className="navbar">
        <h2>🌱 EchoGarden</h2>
        <span>Small Actions. Greener Future.</span>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">YOUR ECO JOURNEY STARTS HERE</p>
            <h1>Make the planet<br />a little greener.</h1>
            <p>Track your daily eco-friendly actions and grow your virtual garden.</p>
          </div>
          <div className="hero-icon"></div>
        </section>

        <section className="panel">
          <h2>👋 Join the eco community</h2>
          <p>No account or password needed. Choose a nickname to track your progress.</p>
          <form onSubmit={chooseNickname}>
            <label htmlFor="nickname">Your nickname</label>
            <input
              id="nickname"
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
              placeholder="e.g. GreenExplorer"
              minLength={2}
              maxLength={24}
              required
            />
            <button type="submit">
              {nickname ? "Switch nickname" : "Start my eco journey"}
            </button>
          </form>
          {nickname && <p>🌿 Currently tracking as <strong>{nickname}</strong></p>}
        </section>

        {nickname && (
          <>
            <section className="stats">
              <div className="stat-card">
                <span>🌿</span>
                <p>Total eco points</p>
                <h2>{totalPoints}</h2>
              </div>
              <div className="stat-card">
                <span>🌳</span>
                <p>Actions completed</p>
                <h2>{actions.length}</h2>
              </div>
              <div className="stat-card">
                <span>🌼</span>
                <p>Garden level</p>
                <h2>{Math.floor(totalPoints / 100) + 1}</h2>
              </div>
            </section>

<section className="mission-section">
  <div className="section-heading">
    <div>
      <p className="section-kicker">TODAY'S ADVENTURE</p>
      <h2>🎯 Eco-Mission Control</h2>
      <p>Small quests today. A healthier planet tomorrow.</p>
    </div>
    <div className="streak-pill">🔥 {streak}-day streak</div>
  </div>

  <div className="mission-grid">
    {dailyMissions.map((mission) => {
      const progress = getDailyProgress(mission, todayActions);
      const complete = progress >= mission.target;
      const percentage = Math.min(
        100,
        (progress / mission.target) * 100
      );

      return (
        <article
          className={`mission-card ${complete ? "mission-complete" : ""}`}
          key={mission.id}
        >
          <div className="mission-top">
            <span className="mission-emoji">{mission.icon}</span>
            <span className="mission-status">
              {complete ? "✓ COMPLETE" : "IN PROGRESS"}
            </span>
          </div>

          <h3>{mission.title}</h3>
          <p>{mission.description}</p>

          <div
            className="mission-progress-track"
            role="progressbar"
            aria-label={`${mission.title} progress`}
            aria-valuemin={0}
            aria-valuemax={mission.target}
            aria-valuenow={Math.min(progress, mission.target)}
          >
            <div
              className="mission-progress-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="mission-footer">
            <span>
              {Math.min(progress, mission.target)} / {mission.target}
            </span>
            <strong>
              {complete ? "🌟 Mission cleared!" : "Keep going!"}
            </strong>
          </div>
        </article>
      );
    })}
  </div>
</section>

<section className="surprise-quest">
  <div className="surprise-art">{surpriseQuest.icon}</div>

  <div className="surprise-content">
    <span className="surprise-label">✨ DAILY SURPRISE QUEST</span>
    <h2>{surpriseQuest.title}</h2>
    <p>{surpriseQuest.description}</p>
    <p className="surprise-note">
      {surpriseComplete
        ? "You did it! Your planet thanks you. "
        : `Progress: ${Math.min(surpriseProgress, surpriseQuest.target)} of ${surpriseQuest.target}. Complete this action today!`}
    </p>
    <span className="reward-chip">
      {surpriseComplete ? "🏆 Quest complete" : "🎖️ Reward: Quest badge"}
    </span>
  </div>
</section>

<section className="achievement-section">
  <div className="section-heading">
    <div>
      <p className="section-kicker">YOUR GREEN LEGACY</p>
      <h2>🏆 Achievement Gallery</h2>
      <p>Every badge tells a story about your planet-saving journey.</p>
    </div>
    <div className="achievement-count">
      {unlockedAchievements.length}/{achievements.length}
    </div>
  </div>

  <div className="achievement-grid">
    {achievements.map((badge) => {
      const unlocked = badge.unlocked(actions, totalPoints);

      return (
        <article
          key={badge.id}
          className={`achievement-card ${unlocked ? "badge-unlocked" : "badge-locked"}`}
        >
          <div className="badge-art">
            {unlocked ? badge.icon : "🔒"}
          </div>
          <h3>{badge.title}</h3>
          <p>{badge.description}</p>
          <span className="badge-status">
            {unlocked ? "✓ UNLOCKED" : "NOT YET UNLOCKED"}
          </span>
        </article>
      );
    })}
  </div>

  <div className="achievement-next">
    {nextAchievement ? (
      <>
        <span>🌟</span>
        <div>
          <strong>Your next milestone: {nextAchievement.title}</strong>
          <p>{nextAchievement.description} Keep growing your garden!</p>
        </div>
      </>
    ) : (
      <>
        <span>👑</span>
        <div>
          <strong>You've collected every achievement!</strong>
          <p>You're an EchoGarden legend. Keep making a difference.</p>
        </div>
      </>
    )}
  </div>
</section>

            <section className="content-grid">
              <div className="panel">
                <h2>✨ Log an eco-action</h2>
                <p>Every little action makes a difference.</p>
                <form onSubmit={addAction}>
                  <label htmlFor="ecoType">Choose your action</label>
                  <select
                    id="ecoType"
                    value={selected}
                    onChange={(event) => setSelected(event.target.value)}
                  >
                    {ecoTypes.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.icon} {item.name} (+{item.points} points)
                      </option>
                    ))}
                  </select>

                  <label htmlFor="description">What did you do?</label>
                  <input
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={300}
                    placeholder="e.g. Recycled plastic bottles"
                  />

                  <button type="submit" disabled={saving || loading}>
                    {saving ? "Saving..." : "+ Add eco-action"}
                  </button>
                </form>
              </div>

              <div className="panel garden">
                <h2>🌻 Your virtual garden</h2>
                <p>Your garden grows as you earn eco points.</p>
                <div className="garden-plants">
                  {Array.from({
                    length: Math.min(12, Math.floor(totalPoints / 20) + 1),
                  }).map((_, index) => (
                    <span key={index}>
                      {["🌱", "🌿", "🌷", "🌳", "🌻"][index % 5]}
                    </span>
                  ))}
                </div>
                <p className="garden-message">
                  {totalPoints === 0
                    ? "Complete your first action to grow your garden!"
                    : totalPoints >= 500
                    ? "🌳 Amazing! Your garden is thriving!"
                    : "🌱 Amazing! Your eco garden is growing!"}
                </p>
                <p>
                  {totalPoints < 100
                    ? `${100 - totalPoints} points until your next garden level.`
                    : `${totalPoints % 100 === 0 ? 100 : 100 - (totalPoints % 100)} points toward your next level.`}
                </p>
              </div>
            </section>

            <section className="panel">
              <h2>📊 Weekly eco-impact report</h2>
              <p>Activity from the last 7 days for {nickname}.</p>
              {loading ? (
                <p>Loading your weekly report...</p>
              ) : weekly ? (
                <>
                  <div className="stats">
                    <div className="stat-card">
                      <p>Actions this week</p>
                      <h2>{weekly.totalActions}</h2>
                    </div>
                    <div className="stat-card">
                      <p>Points this week</p>
                      <h2>{weekly.totalPoints}</h2>
                    </div>
                  </div>
                  {Object.keys(weekly.byAction).length === 0 ? (
                    <p>Complete an eco-action this week to start your report.</p>
                  ) : (
                    Object.entries(weekly.byAction).map(([name, item]) => (
                      <div className="action-row" key={name}>
                        <div className="action-details">
                          <strong>{name}</strong>
                          <p>{item.count} action(s) completed</p>
                        </div>
                        <strong className="points">{item.points} pts</strong>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <p>Your report will appear here.</p>
              )}
            </section>

            <section className="panel history">
              <h2>📋 Your activity history</h2>
              {loading ? (
                <p>Loading your activities...</p>
              ) : actions.length === 0 ? (
                <p>No actions yet. Add your first eco-action above!</p>
              ) : (
                actions.map((action) => (
                  <div className="action-row" key={action._id}>
                    <span className="action-icon">{action.icon}</span>
                    <div className="action-details">
                      <strong>{action.name}</strong>
                      <p>{action.description || "Eco-friendly action completed"}</p>
                    </div>
                    <strong className="points">+{action.points} pts</strong>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        <section className="panel">
          <h2>🏆 Community leaderboard</h2>
          <p>Eco-warriors ranked by total points.</p>
          {leaderboard.length === 0 ? (
            <p>No participants yet. Be the first to log an eco-action!</p>
          ) : (
            leaderboard.map((person, index) => (
              <div className="action-row" key={person.nickname}>
                <span className="action-icon">
                  {["🥇", "🥈", "🥉"][index] || "🌿"}
                </span>
                <div className="action-details">
                  <strong>{person.nickname}</strong>
                  <p>{person.actionsCompleted} actions completed</p>
                </div>
                <strong className="points">{person.totalPoints} pts</strong>
              </div>
            ))
          )}
        </section>

        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}

        <footer>EchoGarden · Grow greener habits, one action at a time 🌎</footer>
      </main>
    </div>
  );
}


export default App;
