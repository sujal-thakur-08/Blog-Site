const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { blogs } = require("./data/blogs");
const { pages } = require("./data/pages");
const { drops } = require("./data/drops");

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "dev-only-change-me";
const roleSet = new Set(["reader", "editor", "administrator"]);
const writerRoleSet = new Set(["editor", "administrator"]);
const usersByEmail = new Map();
const stopWordSet = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "we",
  "with",
  "you",
  "your",
]);

app.use(cors());
app.use(express.json());

const frontendDir = path.join(__dirname, "..", "..", "frontend");

function toSearchableText(blog) {
  return [blog.title, blog.excerpt, blog.content, blog.category, blog.author]
    .join(" ")
    .toLowerCase();
}

function normalizeWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWordSet.has(word));
}

function extractKeywords(text, limit = 6) {
  const words = normalizeWords(text);
  const counts = new Map();

  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(1, Number(limit) || 6))
    .map(([word]) => word);
}

function estimateReadingTime(text) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function splitSentences(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function summarizeText(text, maxSentences = 2) {
  const cleanText = String(text || "").trim();
  const sentences = splitSentences(cleanText);

  if (!sentences.length) {
    return { summary: "", bulletPoints: [] };
  }

  if (sentences.length <= maxSentences) {
    return {
      summary: sentences.join(" "),
      bulletPoints: sentences.map((sentence) => sentence.replace(/[.!?]+$/, "")),
    };
  }

  const topKeywords = extractKeywords(cleanText, 8);
  const scored = sentences.map((sentence, index) => {
    const sentenceWords = normalizeWords(sentence);
    const score = sentenceWords.reduce((total, word) => {
      return total + (topKeywords.includes(word) ? 1 : 0);
    }, 0);

    return { index, sentence, score };
  });

  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, maxSentences))
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.sentence);

  return {
    summary: selected.join(" "),
    bulletPoints: selected.map((sentence) => sentence.replace(/[.!?]+$/, "")),
  };
}

function buildCategoryFromTopic(topic) {
  const normalizedTopic = String(topic || "").toLowerCase();

  if (normalizedTopic.includes("hoodie") || normalizedTopic.includes("jacket")) {
    return "Outerwear";
  }

  if (normalizedTopic.includes("tee") || normalizedTopic.includes("shirt")) {
    return "Tops";
  }

  if (normalizedTopic.includes("cargo") || normalizedTopic.includes("denim") || normalizedTopic.includes("pants")) {
    return "Bottoms";
  }

  if (normalizedTopic.includes("sneaker") || normalizedTopic.includes("shoe")) {
    return "Footwear";
  }

  return "Style Guides";
}

function buildTitleFromTopic(topic, tone) {
  const trimmedTopic = String(topic || "").trim();
  const normalizedTone = String(tone || "clear").trim().toLowerCase();
  const toneMap = {
    clear: "Clean Style Guide:",
    friendly: "Weekend Fit Ideas:",
    bold: "Streetwear Playbook:",
    practical: "How To Style:",
  };

  const prefix = toneMap[normalizedTone] || "Drop Guide:";
  return `${prefix} ${trimmedTopic}`;
}

function buildCoverImageUrl(topic, tone) {
  const base = String(topic || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const normalizedTone = String(tone || "practical").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const seed = `${base || "story"}-${normalizedTone || "default"}`;

  // picsum returns a valid image without API keys and keeps the same image per seed.
  return `https://picsum.photos/seed/${seed}/1200/700`;
}

function generateDraftFromPrompt(input) {
  const topic = String(input?.topic || "").trim();
  const tone = String(input?.tone || "practical").trim().toLowerCase();
  const audience = String(input?.audience || "style-focused shoppers").trim();
  const title = buildTitleFromTopic(topic, tone);
  const category = buildCategoryFromTopic(topic);

  const paragraphOne = `${title} starts with a single goal: make ${audience} look styled without overcomplicating the process. Begin with one anchor piece, then show how supporting layers change the vibe from casual to statement.`;
  const paragraphTwo = `Break ${topic} into three wearable moves: silhouette balance, texture contrast, and color direction. Give one real outfit example for each move so readers can copy the formula instantly.`;
  const paragraphThree = `Close with a quick fit-check checklist: proportions, comfort, and one standout detail. This helps readers build confidence, shop smarter, and actually wear what they buy.`;

  const content = [paragraphOne, paragraphTwo, paragraphThree].join("\n\n");
  const excerpt = `A ${tone} outfit blueprint for ${topic} with wearable steps, real examples, and quick styling wins.`;
  const image = buildCoverImageUrl(topic, tone);
  const keywords = extractKeywords(`${topic} ${content}`, 6);

  return {
    title,
    category,
    image,
    excerpt,
    content,
    keywords,
    readingTimeMinutes: estimateReadingTime(content),
  };
}

function getRecommendations(seedBlogId, limit = 3) {
  const seedId = Number(seedBlogId);
  const desiredLimit = Math.max(1, Number(limit) || 3);
  const seedBlog = blogs.find((entry) => entry.id === seedId) || blogs[0] || null;

  if (!seedBlog) {
    return [];
  }

  const seedWords = new Set(normalizeWords(toSearchableText(seedBlog)));

  return blogs
    .filter((entry) => entry.id !== seedBlog.id)
    .map((entry) => {
      const words = normalizeWords(toSearchableText(entry));
      const overlap = words.reduce((count, word) => count + (seedWords.has(word) ? 1 : 0), 0);
      const categoryBoost = entry.category === seedBlog.category ? 2 : 0;

      return {
        ...entry,
        score: overlap + categoryBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, desiredLimit)
    .map(({ score, ...entry }) => entry);
}

function sanitizeRole(inputRole) {
  const normalizedRole = String(inputRole || "reader").trim().toLowerCase();
  return roleSet.has(normalizedRole) ? normalizedRole : null;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, storedHash] = String(storedValue || "").split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const calculatedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  const storedBuffer = Buffer.from(storedHash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");

  if (storedBuffer.length !== calculatedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, calculatedBuffer);
}

function serializeUser(user) {
  return {
    email: user.email,
    name: user.name,
    picture: user.picture,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createSessionToken(user) {
  return jwt.sign(
    {
      email: user.email,
      name: user.name,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: "8h" }
  );
}

function readBearerToken(req) {
  const authorization = String(req.headers.authorization || "");
  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

function requireAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing auth token. Please log in." });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = usersByEmail.get(payload.email);

    if (!user) {
      return res.status(401).json({ error: "Session user not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired auth token" });
  }
}

function requireWriterRole(req, res, next) {
  if (!req.user || !writerRoleSet.has(req.user.role)) {
    return res.status(403).json({
      error: "Only editor or administrator accounts can manage blogs",
    });
  }

  return next();
}

function requireAdministrator(req, res, next) {
  if (!req.user || req.user.role !== "administrator") {
    return res.status(403).json({
      error: "Only administrator accounts can delete blogs",
    });
  }

  return next();
}

function validateBlogPayload(input) {
  const title = String(input?.title || "").trim();
  const category = String(input?.category || "").trim();
  const image = String(input?.image || "").trim();
  const excerpt = String(input?.excerpt || "").trim();
  const content = String(input?.content || "").trim();

  if (!title || !category || !image || !excerpt || !content) {
    return {
      error:
        "Missing required fields. Required: title, category, image, excerpt, content",
    };
  }

  return {
    value: {
      title,
      category,
      image,
      excerpt,
      content,
    },
  };
}

function canManageBlog(user, blog) {
  if (!user || !blog) {
    return false;
  }

  if (user.role === "administrator") {
    return true;
  }

  // Backward-compatible ownership check for old items without createdByEmail.
  return blog.createdByEmail === user.email || blog.author === user.name || blog.author === user.email;
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "blog-backend",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/auth/signup", (req, res) => {
  const { name, email, password, role } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const selectedRole = sanitizeRole(role);

  if (!name || !normalizedEmail || !password || !selectedRole) {
    return res.status(400).json({
      error: "Missing required fields. Required: name, email, password, role",
    });
  }

  if (!normalizedEmail.includes("@")) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  if (usersByEmail.has(normalizedEmail)) {
    return res.status(409).json({ error: "Account already exists for this email" });
  }

  const now = new Date().toISOString();
  const user = {
    email: normalizedEmail,
    name: String(name).trim(),
    role: selectedRole,
    picture: "",
    passwordHash: hashPassword(String(password)),
    createdAt: now,
    updatedAt: now,
  };

  usersByEmail.set(normalizedEmail, user);

  return res.status(201).json({
    token: createSessionToken(user),
    user: serializeUser(user),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res
      .status(400)
      .json({ error: "Missing required fields. Required: email, password" });
  }

  const user = usersByEmail.get(normalizedEmail);

  if (!user || !verifyPassword(String(password), user.passwordHash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  user.updatedAt = new Date().toISOString();

  return res.json({
    token: createSessionToken(user),
    user: serializeUser(user),
  });
});

app.post("/api/auth/google", (req, res) => {
  return res.status(410).json({
    error: "Google auth has been removed. Use /api/auth/signup or /api/auth/login.",
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

app.get("/api/blogs", (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  const limit = Number(req.query.limit || 0);

  let result = blogs;
  if (query) {
    result = blogs.filter((blog) => toSearchableText(blog).includes(query));
  }

  if (!Number.isNaN(limit) && limit > 0) {
    result = result.slice(0, limit);
  }

  res.json({
    count: result.length,
    items: result,
  });
});

app.get("/api/blogs/:id", (req, res) => {
  const id = Number(req.params.id);
  const blog = blogs.find((entry) => entry.id === id);

  if (!blog) {
    return res.status(404).json({ error: "Blog not found" });
  }

  return res.json(blog);
});

app.get("/api/drops", (req, res) => {
  const status = String(req.query.status || "").trim().toLowerCase();
  const limit = Number(req.query.limit || 0);

  let result = drops;

  if (status) {
    result = result.filter((item) => String(item.status || "").toLowerCase() === status);
  }

  if (!Number.isNaN(limit) && limit > 0) {
    result = result.slice(0, limit);
  }

  res.json({
    count: result.length,
    items: result,
  });
});

app.get("/api/pages", (req, res) => {
  const items = Object.values(pages).map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
  }));

  res.json({
    count: items.length,
    items,
  });
});

app.get("/api/pages/:slug", (req, res) => {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const page = pages[slug];

  if (!page) {
    return res.status(404).json({ error: "Page not found" });
  }

  return res.json(page);
});

app.post("/api/ai/generate-draft", requireAuth, requireWriterRole, (req, res) => {
  const topic = String(req.body?.topic || "").trim();

  if (!topic || topic.length < 4) {
    return res.status(400).json({ error: "Please provide a topic with at least 4 characters" });
  }

  const draft = generateDraftFromPrompt(req.body || {});
  return res.json({
    topic,
    model: "local-template-ai",
    draft,
  });
});

app.post("/api/ai/summarize", (req, res) => {
  const text = String(req.body?.text || "").trim();

  if (!text || text.length < 40) {
    return res.status(400).json({ error: "Please provide at least 40 characters to summarize" });
  }

  const { summary, bulletPoints } = summarizeText(text, 2);
  const keywords = extractKeywords(text, 6);

  return res.json({
    model: "local-extractive-ai",
    summary,
    bulletPoints,
    keywords,
    readingTimeMinutes: estimateReadingTime(text),
  });
});

app.get("/api/ai/recommendations", (req, res) => {
  const seedId = Number(req.query.seedId || 0);
  const limit = Number(req.query.limit || 3);
  const items = getRecommendations(seedId, limit);

  res.json({
    count: items.length,
    items,
  });
});

app.post("/api/blogs", requireAuth, requireWriterRole, (req, res) => {
  const validation = validateBlogPayload(req.body || {});
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const { title, category, image, excerpt, content } = validation.value;

  const nextId = blogs.reduce((maxId, blog) => Math.max(maxId, blog.id), 0) + 1;
  const createdBlog = {
    id: nextId,
    title,
    category,
    author: req.user.name || req.user.email,
    createdByEmail: req.user.email,
    image,
    excerpt,
    content,
    date: new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };

  blogs.unshift(createdBlog);
  return res.status(201).json(createdBlog);
});

app.put("/api/blogs/:id", requireAuth, requireWriterRole, (req, res) => {
  const id = Number(req.params.id);
  const targetBlog = blogs.find((entry) => entry.id === id);

  if (!targetBlog) {
    return res.status(404).json({ error: "Blog not found" });
  }

  if (!canManageBlog(req.user, targetBlog)) {
    return res.status(403).json({
      error: "You can only edit blogs you created unless you are an administrator",
    });
  }

  const validation = validateBlogPayload(req.body || {});
  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  targetBlog.title = validation.value.title;
  targetBlog.category = validation.value.category;
  targetBlog.image = validation.value.image;
  targetBlog.excerpt = validation.value.excerpt;
  targetBlog.content = validation.value.content;
  targetBlog.author = req.user.name || req.user.email;
  targetBlog.createdByEmail = targetBlog.createdByEmail || req.user.email;
  targetBlog.date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return res.json(targetBlog);
});

app.delete("/api/blogs/:id", requireAuth, requireAdministrator, (req, res) => {
  const id = Number(req.params.id);
  const targetBlog = blogs.find((entry) => entry.id === id);

  if (!targetBlog) {
    return res.status(404).json({ error: "Blog not found" });
  }

  const removeIndex = blogs.findIndex((entry) => entry.id === id);
  blogs.splice(removeIndex, 1);
  return res.status(204).send();
});

app.use(express.static(frontendDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
