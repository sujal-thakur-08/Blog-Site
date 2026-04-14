const { useEffect, useMemo, useState } = React;

const INFO_LINKS = [
  { slug: "help-center", label: "Help Center" },
  { slug: "publishing-guide", label: "Publishing Guide" },
  { slug: "video-tutorials", label: "Video Tutorials" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "privacy", label: "Privacy" },
  { slug: "content-policy", label: "Content Policy" },
];

const FALLBACK_PAGES = {
  "help-center": {
    slug: "help-center",
    title: "Help Center",
    summary:
      "Find quick answers for publishing, account settings, and troubleshooting common issues.",
    sections: [
      {
        heading: "Getting Started",
        body: "Set up your profile and publish your first story in minutes.",
      },
      {
        heading: "Account And Security",
        body: "Update your password, security settings, and trusted devices.",
      },
    ],
  },
  "publishing-guide": {
    slug: "publishing-guide",
    title: "Publishing Guide",
    summary:
      "Learn the editorial workflow used by top creators to ship quality stories consistently.",
    sections: [
      {
        heading: "Drafting",
        body: "Start with a clear promise and outline each section before writing.",
      },
      {
        heading: "Publishing",
        body: "Preview your story on mobile and desktop before publishing.",
      },
    ],
  },
  "video-tutorials": {
    slug: "video-tutorials",
    title: "Video Tutorials",
    summary:
      "Watch practical lessons for layout, writing, and analytics setup.",
    sections: [
      {
        heading: "Beginner",
        body: "Theme setup, first article publishing, and navigation basics.",
      },
      {
        heading: "Advanced",
        body: "Integrations, optimization, and scalable content workflows.",
      },
    ],
  },
  "terms-of-service": {
    slug: "terms-of-service",
    title: "Terms Of Service",
    summary: "The usage rules and responsibilities for this platform.",
    sections: [
      {
        heading: "Acceptable Use",
        body: "Do not publish harmful, deceptive, or unlawful content.",
      },
      {
        heading: "Account Responsibility",
        body: "You are responsible for protecting your account credentials.",
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy",
    summary: "How your data is used, stored, and protected.",
    sections: [
      {
        heading: "Data Collection",
        body: "We collect account and usage data to improve the service.",
      },
      {
        heading: "Your Controls",
        body: "You can request data export or deletion from account settings.",
      },
    ],
  },
  "content-policy": {
    slug: "content-policy",
    title: "Content Policy",
    summary: "Standards for a safe and high-quality publishing environment.",
    sections: [
      {
        heading: "Prohibited Content",
        body: "Harassment, abuse, and misinformation are not allowed.",
      },
      {
        heading: "Enforcement",
        body: "Policy violations can lead to content removal or account limits.",
      },
    ],
  },
};

function parseRouteFromHash(hashValue) {
  const normalizedHash = String(hashValue || "").replace(/^#/, "");

  if (normalizedHash === "/login" || normalizedHash.startsWith("/login/")) {
    return { view: "login", slug: null };
  }

  if (normalizedHash.startsWith("/page/")) {
    const slug = normalizedHash.slice("/page/".length).trim().toLowerCase();
    if (slug) {
      return { view: "page", slug };
    }
  }

  return { view: "home", slug: null };
}

function resolveApiBaseUrl() {
  const configured = typeof window.BLOG_API_URL === "string" ? window.BLOG_API_URL.trim() : "";
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const { origin, hostname, port } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalHost && port && port !== "4000") {
    return "http://localhost:4000/api";
  }

  return `${origin.replace(/\/+$/, "")}/api`;
}

const FALLBACK_BLOGS = [
  {
    id: 1,
    title: "Building a Calm Morning Writing Ritual",
    category: "Productivity",
    author: "Nina Parker",
    date: "Apr 1, 2026",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "A practical routine for makers who want focused mornings without burning out by noon.",
    content:
      "Start with one non-negotiable page. The point is not brilliance, it is momentum. Keep your phone in another room, set a 20-minute timer, and write before checking messages. Over time, that short block compounds into finished essays, product docs, and ideas that become projects.",
  },
  {
    id: 2,
    title: "Design Systems for Tiny Teams",
    category: "Design",
    author: "Arjun Bose",
    date: "Mar 28, 2026",
    image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "How to create visual consistency when you only have one designer and two developers.",
    content:
      "Start with foundations: color tokens, type scales, and spacing rules. Document these in a living style guide before creating component variants. A small but strict system beats a huge but ignored one. Pair each component with usage constraints so implementation decisions stay predictable.",
  },
  {
    id: 3,
    title: "Debugging JavaScript Without Guesswork",
    category: "Development",
    author: "Maya Lopez",
    date: "Mar 26, 2026",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    excerpt: "A methodical approach to isolate real bugs in half the time.",
    content:
      "The process is simple: reproduce, reduce, inspect, verify. Reproduce the issue with a clear sequence, reduce the test case, inspect state transitions, and verify with one targeted fix. This avoids random edits and protects confidence in your codebase.",
  },
  {
    id: 4,
    title: "What Readers Actually Remember",
    category: "Writing",
    author: "Liam Chen",
    date: "Mar 21, 2026",
    image: "https://images.unsplash.com/photo-1473755504818-b72b6dfdc226?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Structure beats clever lines. Here is how to make your message stick.",
    content:
      "Readers remember a clear promise, one compelling example, and a satisfying close. Keep paragraphs short, transition cleanly, and avoid introducing new ideas in the conclusion. Good writing is less about decoration and more about sequence.",
  },
  {
    id: 5,
    title: "How We Ship Features Weekly",
    category: "Product",
    author: "Sara West",
    date: "Mar 18, 2026",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Inside a lightweight planning workflow for fast-moving product teams.",
    content:
      "Every Monday we lock scope, every Wednesday we demo internally, every Friday we release small and learn. The framework is strict but tiny. The clarity reduces context switching and keeps quality stable.",
  },
  {
    id: 6,
    title: "A Better Way to Take Study Notes",
    category: "Learning",
    author: "Daniel Reed",
    date: "Mar 13, 2026",
    image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Use layered notes to move from passive reading to active recall.",
    content:
      "Layer 1 captures facts. Layer 2 summarizes in your own words. Layer 3 tests memory with questions. This turns notes into a spaced-learning asset rather than archived text you never revisit.",
  },
  {
    id: 7,
    title: "Content SEO in 2026: Practical Checklist",
    category: "Marketing",
    author: "Olivia White",
    date: "Mar 10, 2026",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Improve discoverability without stuffing keywords or writing for bots.",
    content:
      "Clarify search intent first. Then align title, intro, section labels, and metadata with that intent. Use examples and plain language. Search engines reward relevance, structure, and reader satisfaction over keyword repetition.",
  },
  {
    id: 8,
    title: "The Minimal Portfolio Formula",
    category: "Career",
    author: "Noah Kim",
    date: "Mar 7, 2026",
    image: "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "How to present your work so hiring teams instantly understand your value.",
    content:
      "Focus on outcomes, not tools. Each project should show context, constraints, and impact. Keep visual noise low and make the next action obvious. A focused portfolio is easier to trust than a crowded one.",
  },
  {
    id: 9,
    title: "Running Effective Async Standups",
    category: "Teamwork",
    author: "Priya Shah",
    date: "Mar 2, 2026",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "A no-meeting format that still preserves accountability and alignment.",
    content:
      "Great async standups capture progress, blockers, and plans in one place. Keep updates brief and decision-focused. Add one thread for risks and one for wins. The rhythm creates visibility without calendar overload.",
  },
];

function LoginGate({
  authMode,
  setAuthMode,
  selectedRole,
  setSelectedRole,
  onSignup,
  onLogin,
  loginError,
  loginBusy,
  embedded = false,
  onClose,
}) {
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  function updateSignupField(field, value) {
    setSignupForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  }

  function updateLoginField(field, value) {
    setLoginForm((prev) => ({ ...prev, [field]: value }));
    setFormError("");
  }

  function handleSignupSubmit(event) {
    event.preventDefault();

    if (
      !signupForm.name.trim() ||
      !signupForm.email.trim() ||
      !signupForm.password ||
      !signupForm.confirmPassword
    ) {
      setFormError("Please fill all signup fields.");
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (signupForm.password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setFormError("");
    onSignup({
      name: signupForm.name.trim(),
      email: signupForm.email.trim(),
      password: signupForm.password,
      role: selectedRole,
    });
  }

  function handleLoginSubmit(event) {
    event.preventDefault();

    if (!loginForm.email.trim() || !loginForm.password) {
      setFormError("Please enter email and password.");
      return;
    }

    setFormError("");
    onLogin({
      email: loginForm.email.trim(),
      password: loginForm.password,
    });
  }

  const authCard = (
    <section className={`auth-card ${embedded ? "auth-card-inline" : ""}`}>
      {embedded ? (
        <div className="auth-inline-header">
          <p className="auth-kicker">Corbin &amp; Hudson</p>
          <button type="button" className="auth-close" onClick={onClose} aria-label="Close auth panel">
            x
          </button>
        </div>
      ) : (
        <p className="auth-kicker">Corbin &amp; Hudson</p>
      )}
        <h1>{authMode === "signup" ? "Create your account" : "Sign in to your account"}</h1>
        <p className="auth-note">
          {authMode === "signup"
            ? "Create an account first. You must be authenticated before you can use the blog page."
            : "Sign in with your existing account to access the blog page."}
        </p>

        <div className="role-picker">
          <button
            type="button"
            className={`role-chip ${authMode === "signup" ? "active" : ""}`}
            onClick={() => setAuthMode("signup")}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={`role-chip ${authMode === "login" ? "active" : ""}`}
            onClick={() => setAuthMode("login")}
          >
            Sign In
          </button>
        </div>

        {authMode === "signup" ? (
          <form className="client-id-form" onSubmit={handleSignupSubmit}>
            <label htmlFor="signup-name">Full Name</label>
            <input
              id="signup-name"
              type="text"
              placeholder="Your full name"
              required
              value={signupForm.name}
              onChange={(event) => updateSignupField("name", event.target.value)}
            />
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              placeholder="you@example.com"
              required
              value={signupForm.email}
              onChange={(event) => updateSignupField("email", event.target.value)}
            />
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              placeholder="At least 6 characters"
              minLength={6}
              required
              value={signupForm.password}
              onChange={(event) => updateSignupField("password", event.target.value)}
            />
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <input
              id="signup-confirm-password"
              type="password"
              placeholder="Re-enter password"
              minLength={6}
              required
              value={signupForm.confirmPassword}
              onChange={(event) => updateSignupField("confirmPassword", event.target.value)}
            />

            <div className="role-picker" role="radiogroup" aria-label="Account role">
              {["reader", "editor", "administrator"].map((role) => (
                <label key={role} className={`role-chip ${selectedRole === role ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(event) => setSelectedRole(event.target.value)}
                  />
                  <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </label>
              ))}
            </div>

            {formError ? <p className="auth-error">{formError}</p> : null}

            <div className="client-id-actions">
              <button type="submit" disabled={loginBusy}>
                {loginBusy ? "Creating account..." : "Create Account"}
              </button>
            </div>
            <p className="auth-switch-text">
              Already have an account?{" "}
              <button type="button" className="auth-switch-btn" onClick={() => setAuthMode("login")}>
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <form className="client-id-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              required
              value={loginForm.email}
              onChange={(event) => updateLoginField("email", event.target.value)}
            />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Your password"
              required
              value={loginForm.password}
              onChange={(event) => updateLoginField("password", event.target.value)}
            />
            {formError ? <p className="auth-error">{formError}</p> : null}
            <div className="client-id-actions">
              <button type="submit" disabled={loginBusy}>
                {loginBusy ? "Signing in..." : "Sign In"}
              </button>
            </div>
            <p className="auth-switch-text">
              New here?{" "}
              <button type="button" className="auth-switch-btn" onClick={() => setAuthMode("signup")}>
                Create Account
              </button>
            </p>
          </form>
        )}

        {loginError ? <p className="auth-error">{loginError}</p> : null}
    </section>
  );

  if (embedded) {
    return authCard;
  }

  return <main className="auth-shell">{authCard}</main>;
}

function AppShell({
  apiBaseUrl,
  token,
  user,
  onLogout,
  authMode,
  setAuthMode,
  selectedRole,
  setSelectedRole,
  onSignup,
  onLogin,
  loginError,
  loginBusy,
  authChecking,
}) {
  const [blogs, setBlogs] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topActionNote, setTopActionNote] = useState("");
  const [route, setRoute] = useState(() => parseRouteFromHash(window.location.hash));
  const [pageData, setPageData] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    category: "",
    image: "",
    excerpt: "",
    content: "",
  });

  useEffect(() => {
    async function loadBlogs() {
      try {
        const response = await fetch(`${apiBaseUrl}/blogs`);
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];
        setBlogs(items);
      } catch (error) {
        setBlogs(FALLBACK_BLOGS);
      }
    }

    loadBlogs();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!user) {
      setShowCreateModal(false);
    }
  }, [user]);

  useEffect(() => {
    function syncRouteFromHash() {
      setRoute(parseRouteFromHash(window.location.hash));
    }

    window.addEventListener("hashchange", syncRouteFromHash);
    return () => {
      window.removeEventListener("hashchange", syncRouteFromHash);
    };
  }, []);

  useEffect(() => {
    if (route.view !== "page" || !route.slug) {
      setPageData(null);
      setIsPageLoading(false);
      return;
    }

    const fallback = FALLBACK_PAGES[route.slug] || null;
    setPageData(fallback);
    setIsPageLoading(true);

    async function loadPageData() {
      try {
        const response = await fetch(`${apiBaseUrl}/pages/${route.slug}`);
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const payload = await response.json();
        setPageData(payload);
      } catch (error) {
        setPageData(fallback);
      } finally {
        setIsPageLoading(false);
      }
    }

    loadPageData();
  }, [apiBaseUrl, route]);

  useEffect(() => {
    if (route.view === "login" && user) {
      window.location.hash = "#/";
    }
  }, [route.view, user]);

  const activeBlogs = blogs.length ? blogs : FALLBACK_BLOGS;
  const canCreateBlogs = user?.role === "editor" || user?.role === "administrator";

  const featureSections = useMemo(() => {
    return [
      {
        title: "Choose the perfect design",
        description:
          "Create a beautiful blog that fits your style with flexible layouts and modern storytelling blocks.",
        image: activeBlogs[1]?.image || FALLBACK_BLOGS[1].image,
      },
      {
        title: "Get your own domain",
        description:
          "Give your publication a memorable home and build trust around your voice from day one.",
        image: activeBlogs[4]?.image || FALLBACK_BLOGS[4].image,
      },
      {
        title: "Turn passion into income",
        description:
          "Use sponsor-ready sections, clear calls to action, and premium story placements to grow revenue.",
        image: activeBlogs[6]?.image || FALLBACK_BLOGS[6].image,
      },
      {
        title: "Know your audience",
        description:
          "Track which stories resonate so you can double down on what your readers care about most.",
        image: activeBlogs[8]?.image || FALLBACK_BLOGS[8].image,
      },
      {
        title: "Keep every memory alive",
        description:
          "Store long-form stories, visuals, and updates in one flowing archive designed for discovery.",
        image: activeBlogs[0]?.image || FALLBACK_BLOGS[0].image,
      },
    ];
  }, [activeBlogs]);

  const storyHighlights = useMemo(() => activeBlogs.slice(0, 3), [activeBlogs]);

  const communityStats = [
    { label: "Active Writers", value: "18k+" },
    { label: "Stories Published", value: "240k+" },
    { label: "Monthly Readers", value: "3.2M" },
  ];

  const communityBenefits = [
    "Weekly writing circles with live feedback from editors.",
    "Member showcases that feature rising creators every Friday.",
    "A private forum for collaboration, partnerships, and growth tips.",
  ];

  const helpLinks = INFO_LINKS.filter((item) =>
    ["help-center", "publishing-guide", "video-tutorials"].includes(item.slug)
  );
  const legalLinks = INFO_LINKS.filter((item) =>
    ["terms-of-service", "privacy", "content-policy"].includes(item.slug)
  );

  const showLoginPage = route.view === "login";
  const showInfoPage = route.view === "page";

  function handleTopLoginClick() {
    if (user) {
      setTopActionNote("You are already logged in.");
      return;
    }

    setAuthMode("login");
    setTopActionNote("");
    window.location.hash = "#/login";
  }

  function handleTopCreateBlogClick() {
    if (!user) {
      setAuthMode("signup");
      setTopActionNote("Create an account or log in first to publish a blog.");
      window.location.hash = "#/login";
      return;
    }

    if (!canCreateBlogs) {
      setTopActionNote("Your role cannot create blogs. Use an editor or administrator account.");
      return;
    }

    setTopActionNote("");
    setShowCreateModal(true);
  }

  async function handleCreateBlog(event) {
    event.preventDefault();
    setCreateError("");

    const payload = {
      title: createForm.title.trim(),
      category: createForm.category.trim(),
      image: createForm.image.trim(),
      excerpt: createForm.excerpt.trim(),
      content: createForm.content.trim(),
    };

    if (!payload.title || !payload.category || !payload.image || !payload.excerpt || !payload.content) {
      setCreateError("Please complete all blog fields.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${apiBaseUrl}/blogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Failed to publish blog");
      }

      const created = await response.json();
      setBlogs((prev) => [created, ...prev]);
      setCreateForm({
        title: "",
        category: "",
        image: "",
        excerpt: "",
        content: "",
      });
      setShowCreateModal(false);
    } catch (error) {
      setCreateError(error.message || "Failed to publish blog");
    } finally {
      setIsCreating(false);
    }
  }

  if (showLoginPage) {
    return (
      <main className="page-wrap auth-page-wrap">
        <header className="topbar auth-topbar">
          <a href="#/" className="brand brand-link" aria-label="Corbin and Hudson home">
            <span className="brand-monogram">C&amp;H</span>
            <span className="brand-text-group">
              <span className="brand-name">Corbin &amp; Hudson</span>
              <span className="brand-tag">Story House</span>
            </span>
          </a>
          <a href="#/" className="auth-back-link">
            Back to Blog
          </a>
        </header>
        <section className="auth-shell-page">
          <LoginGate
            authMode={authMode}
            setAuthMode={setAuthMode}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onSignup={onSignup}
            onLogin={onLogin}
            loginError={loginError}
            loginBusy={loginBusy}
            embedded={true}
            onClose={() => {
              window.location.hash = "#/";
            }}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <header className="topbar">
        <a href="#/" className="brand brand-link" aria-label="Corbin and Hudson home">
          <span className="brand-monogram">C&amp;H</span>
          <span className="brand-text-group">
            <span className="brand-name">Corbin &amp; Hudson</span>
            <span className="brand-tag">Story House</span>
          </span>
        </a>
        <nav className="top-links" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#stories">Stories</a>
          <a href="#community">Community</a>
        </nav>
        <div className="top-auth-controls">
          <button type="button" className="auth-top-btn" onClick={handleTopLoginClick}>
            Log In
          </button>
          <button type="button" className="auth-top-btn soft" onClick={handleTopCreateBlogClick}>
            Create A Blog
          </button>
        </div>
        {user && (<div className="user-pill">
          {user?.picture ? <img src={user.picture} alt={user.name} className="user-avatar" /> : null}
          <div>
            <p className="user-name">{user?.name || user?.email}</p>
            <p className="user-role">{user?.role}</p>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>)}
      </header>

      {topActionNote ? <p className="top-action-note">{topActionNote}</p> : null}

      {showCreateModal && canCreateBlogs ? (
        <div className="create-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <section className="create-modal" onClick={(event) => event.stopPropagation()}>
            <div className="create-modal-header">
              <div>
                <h3>Create Blog</h3>
                <p>Signed in as {user.role}. Publish directly to your homepage stories feed.</p>
              </div>
              <button
                type="button"
                className="auth-close"
                aria-label="Close create blog panel"
                onClick={() => setShowCreateModal(false)}
              >
                x
              </button>
            </div>
            <form className="blog-form" onSubmit={handleCreateBlog}>
              <input
                type="text"
                placeholder="Blog title"
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, title: event.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Category"
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                }
              />
              <input
                type="url"
                placeholder="Cover image URL"
                value={createForm.image}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, image: event.target.value }))
                }
              />
              <textarea
                placeholder="Short excerpt"
                rows="3"
                value={createForm.excerpt}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, excerpt: event.target.value }))
                }
              />
              <textarea
                placeholder="Full content"
                rows="5"
                value={createForm.content}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, content: event.target.value }))
                }
              />
              {createError ? <p className="auth-error">{createError}</p> : null}
              <button type="submit" disabled={isCreating}>
                {isCreating ? "Publishing..." : "Publish Blog"}
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {showInfoPage ? (
        <section className="info-page" id="community">
          <a href="#/" className="back-link">&larr; Back to Home</a>
          {isPageLoading && <p className="info-meta">Loading page content...</p>}
          {pageData ? (
            <>
              <h1>{pageData.title}</h1>
              <p className="info-summary">{pageData.summary}</p>
              <div className="info-grid">
                {(pageData.sections || []).map((section) => (
                  <article key={section.heading} className="info-card">
                    <h3>{section.heading}</h3>
                    <p>{section.body}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1>Page Not Found</h1>
              <p className="info-summary">
                The requested page does not exist. Please choose another item from the footer.
              </p>
            </>
          )}
        </section>
      ) : (
        <>
          <section id="features" className="feature-stack">
            {featureSections.map((section, index) => (
              <article
                key={section.title}
                className={`feature-row ${index % 2 ? "reverse" : ""}`}
              >
                <div className="feature-copy">
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <img src={section.image} alt={section.title} className="feature-image" />
              </article>
            ))}
          </section>

          <section className="long-section">
            <h3>Join thousands of creators publishing with Corbin &amp; Hudson</h3>
            <p>
              Whether you write tutorials, news, or personal journals, this platform gives you a clean
              publishing workflow and modern storytelling format from your very first post.
            </p>
          </section>

          <section className="stories-section" id="stories">
            <div className="section-head">
              <h3>Stories</h3>
              <p>Popular reads from creators building momentum this month.</p>
            </div>
            <div className="stories-grid">
              {storyHighlights.map((story) => (
                <article className="story-card" key={story.id}>
                  <img src={story.image} alt={story.title} className="story-image" />
                  <div className="story-body">
                    <p className="story-meta">{story.category} · {story.date}</p>
                    <h4>{story.title}</h4>
                    <p>{story.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="community-section" id="community">
            <div className="section-head">
              <h3>Community</h3>
              <p>Build your audience with a network that helps creators ship consistently.</p>
            </div>
            <div className="community-layout">
              <div className="community-stats">
                {communityStats.map((item) => (
                  <article key={item.label} className="stat-pill">
                    <p className="stat-value">{item.value}</p>
                    <p className="stat-label">{item.label}</p>
                  </article>
                ))}
              </div>
              <div className="community-points">
                <h4>Why creators stay here</h4>
                <ul>
                  {communityBenefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </>
      )}

      <footer className="site-footer">
        <div className="footer-brand-wrap">
          <div className="footer-brand-mark">C&amp;H</div>
          <div>
            <div className="footer-brand">Corbin &amp; Hudson</div>
            <p className="footer-tag">A modern publishing brand for independent creators.</p>
          </div>
        </div>
        <div className="footer-columns">
          <div>
            <h4>Help</h4>
            {helpLinks.map((item) => (
              <a key={item.slug} href={`#/page/${item.slug}`}>
                {item.label}
              </a>
            ))}
          </div>
          <div>
            <h4>Legal</h4>
            {legalLinks.map((item) => (
              <a key={item.slug} href={`#/page/${item.slug}`}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-social">
          <h4>Connect</h4>
          <div className="social-links">
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href="https://corbinhudson.com" target="_blank" rel="noopener noreferrer">
              Official Site
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function App() {
  const apiBaseUrl = resolveApiBaseUrl();
  const [token, setToken] = useState(() => localStorage.getItem("blogAuthToken") || "");
  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("editor");
  const [authMode, setAuthMode] = useState("login");
  const [authChecking, setAuthChecking] = useState(Boolean(token));
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  useEffect(() => {
    if (!token || user) {
      setAuthChecking(false);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const payload = await response.json();
        if (!cancelled) {
          setUser(payload.user || null);
          setLoginError("");
        }
      } catch (error) {
        if (!cancelled) {
          localStorage.removeItem("blogAuthToken");
          setToken("");
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setAuthChecking(false);
        }
      }
    }

    setAuthChecking(true);
    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token]);

  const handleAuthRequest = React.useCallback(
    async (endpoint, requestPayload) => {
      setLoginBusy(true);
      setLoginError("");
      try {
        const response = await fetch(`${apiBaseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || "Authentication failed");
        }

        if (!responseData.token || !responseData.user || !responseData.user.role) {
          throw new Error("Invalid authentication response from server");
        }

        localStorage.setItem("blogAuthToken", responseData.token);
        setAuthChecking(false);
        setUser(responseData.user);
        setToken(responseData.token);
        window.location.hash = "#/";
      } catch (error) {
        if (error instanceof TypeError) {
          setLoginError(
            "Cannot reach auth server. Start backend on port 4000 or set window.BLOG_API_URL in frontend/index.html."
          );
        } else {
          setLoginError(error.message || "Authentication failed");
        }
      } finally {
        setLoginBusy(false);
      }
    },
    [apiBaseUrl]
  );

  const handleSignup = React.useCallback(
    (payload) => {
      handleAuthRequest("/auth/signup", payload);
    },
    [handleAuthRequest]
  );

  const handleLogin = React.useCallback(
    (payload) => {
      handleAuthRequest("/auth/login", payload);
    },
    [handleAuthRequest]
  );

  function handleLogout() {
    localStorage.removeItem("blogAuthToken");
    setToken("");
    setUser(null);
  }

  return (
    <AppShell
      apiBaseUrl={apiBaseUrl}
      token={token}
      user={user}
      onLogout={handleLogout}
      authMode={authMode}
      setAuthMode={setAuthMode}
      selectedRole={selectedRole}
      setSelectedRole={setSelectedRole}
      onSignup={handleSignup}
      onLogin={handleLogin}
      loginError={loginError}
      loginBusy={loginBusy}
      authChecking={authChecking}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
