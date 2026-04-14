const express = require("express");
const cors = require("cors");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { blogs } = require("./data/blogs");
const { pages } = require("./data/pages");

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || "dev-only-change-me";
const roleSet = new Set(["reader", "editor", "administrator"]);
const writerRoleSet = new Set(["editor", "administrator"]);
const usersByEmail = new Map();

app.use(cors());
app.use(express.json());

const frontendDir = path.join(__dirname, "..", "..", "frontend");

function toSearchableText(blog) {
  return [blog.title, blog.excerpt, blog.content, blog.category, blog.author]
    .join(" ")
    .toLowerCase();
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

app.delete("/api/blogs/:id", requireAuth, requireWriterRole, (req, res) => {
  const id = Number(req.params.id);
  const targetBlog = blogs.find((entry) => entry.id === id);

  if (!targetBlog) {
    return res.status(404).json({ error: "Blog not found" });
  }

  if (!canManageBlog(req.user, targetBlog)) {
    return res.status(403).json({
      error: "You can only delete blogs you created unless you are an administrator",
    });
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
