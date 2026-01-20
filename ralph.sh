#!/bin/bash
set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname \
  "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Ralph for FeedbackFlow"
echo "Branch: feedbackflow/production"

# Ensure we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "feedbackflow/production" ]; then
  echo "⚠️  Switching to branch feedbackflow/production"
  git checkout -B "feedbackflow/production"
fi

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════"
  echo "    Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════"

  OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" \
    | claude --dangerously-skip-permissions 2>&1 \
    | tee /dev/stderr) || true

  if echo "$OUTPUT" | \
    grep -q "<promise>COMPLETE</promise>"
  then
    echo ""
    echo "✅ All stories complete!"
    echo "🎉 FeedbackFlow is ready for review"
    exit 0
  fi

  sleep 2
done

echo ""
echo "⚠️  Max iterations ($MAX_ITERATIONS) reached"
echo "   Some stories may still be incomplete"
exit 1
