const blogs = [
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

module.exports = {
  blogs,
};
