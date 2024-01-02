module.exports = {
  disableEmoji: false,
  maxMessageLength: 256,
  minMessageLength: 2,
  format: "{type}: {emoji}{subject}",
  list: ["feat", "fix", "refactor", "style", "pkg", "test", "ci", "other"],
  questions: ["type", "subject"],
  scopes: [],
  types: {
    feat: {
      description: "new feature",
      value: "feat",
      emoji: "💪",
    },
    fix: {
      description: "bug fix",
      value: "fix",
      emoji: "📌",
    },
    refactor: {
      description: "refactoring",
      value: "refactor",
      emoji: "🛠️",
    },
    style: {
      description: "code style",
      value: "style",
      emoji: "✨",
    },
    pkg: {
      description: "package update or configure",
      value: "pkg",
      emoji: "📦",
    },
    test: {
      description: "add or update tests",
      value: "test",
      emoji: "✏️",
    },
    ci: {
      description: "CI related changes",
      value: "ci",
      emoji: "♻️",
    },
    other: {
      description: "other changes",
      value: "other",
      emoji: "🔹",
    },
  },
};
