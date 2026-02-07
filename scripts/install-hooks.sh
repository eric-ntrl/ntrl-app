#!/bin/bash
# Install git hooks for ntrl-app
# Called automatically by npm prepare script

HOOKS_DIR="$(git rev-parse --git-dir 2>/dev/null)/hooks"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$HOOKS_DIR" ]; then
    echo "Not a git repository, skipping hook installation."
    exit 0
fi

echo "Installing git hooks..."

# Install commit-msg hook
cp "$SCRIPTS_DIR/commit-msg" "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/commit-msg"

# Install pre-commit hook
cp "$SCRIPTS_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"

echo "Git hooks installed successfully."
