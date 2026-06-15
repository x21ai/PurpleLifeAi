#!/usr/bin/env bash
# Diff row counts and RLS posture on NEW vs source baselines.
# Requires: $NEW_DB_URL plus row-counts-source.txt and rls-source.txt
# (extracted from the data zip into this folder).
set -euo pipefail
cd "$(dirname "$0")"
: "${NEW_DB_URL:?Set NEW_DB_URL to the new Postgres connection string}"

if [ ! -f row-counts-source.txt ]; then
  echo "missing row-counts-source.txt (extract it from the data zip)" >&2
  exit 1
fi

psql "$NEW_DB_URL" -At -f verify-counts.sql 2>&1 1>/dev/null \
  | sed 's/^NOTICE:  //' | sort > counts-new.txt
psql "$NEW_DB_URL" -At -f verify-rls.sql 2>&1 1>/dev/null \
  | sed 's/^NOTICE:  //' | sort > rls-new.txt

sort row-counts-source.txt > /tmp/counts-source.sorted
sort rls-source.txt > /tmp/rls-source.sorted

fail=0
if ! diff -u /tmp/counts-source.sorted counts-new.txt; then
  echo "ROW COUNT MISMATCH" >&2
  fail=1
fi

if grep -q unknown /tmp/rls-source.sorted; then
  echo "rls-source.txt is the stub baseline; NEW posture:"
  cat rls-new.txt
else
  if ! diff -u /tmp/rls-source.sorted rls-new.txt; then
    echo "RLS POSTURE MISMATCH" >&2
    fail=1
  fi
fi

[ $fail -eq 0 ] && echo "OK"
exit $fail