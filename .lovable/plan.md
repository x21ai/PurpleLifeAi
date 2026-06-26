## Problem

On `/chat-care`, the **Group** button calls `getOrCreateGroupThread`, which only ever returns the single hard-coded "Care team" thread. After the first click it silently re-opens the same thread, so the user perceives "nothing happens". There's also no way to see a list of groups or to create additional named groups.

## Goal

Clicking the Group icon opens a small picker:
- If groups exist → list them; clicking one opens that thread.
- Always show a **"Create new group"** action at the bottom.
- Creating a group asks for a name and which caregivers to include, then opens the new thread.

Mirrors the existing `NewChatPicker` UX (Popover with list + action), works on mobile, tablet, and desktop.

## Changes

### 1. Server (`src/lib/care-chat.functions.ts`)
- Add `listGroupThreads()` — returns owner's `care_threads` where `kind='group'` with `id`, `title`, participant count, `last_message_at`.
- Add `createGroupThread({ title, caregiverIds })` — validates the caregivers are active care relationships of the caller, inserts a new `care_threads` row (`kind='group'`, `title`), inserts owner + selected caregivers into `care_thread_participants`, returns `{ threadId }`.
- Keep `getOrCreateGroupThread` for back-compat (used elsewhere), but stop calling it from the Group button.

No schema change — `care_threads` already supports many group rows per owner; the single-group behavior was only enforced by the old function's `.maybeSingle()`.

### 2. UI (`src/routes/_app/chat-care.tsx`)
- Replace the plain Group `<Button>` with a new `GroupPicker` component (sibling of `NewChatPicker`) using `Popover`:
  - Header: "Groups"
  - Body: list of existing groups (name + member count). Clicking sets the active thread.
  - Footer: "Create new group" button → swaps the popover body to a small form:
    - Text input: group name (default "Care team")
    - Checkbox list of active caregivers (reuses the same source `NewChatPicker` already queries)
    - "Create" button → calls `createGroupThread`, invalidates `["care-chat","threads"]`, opens the new thread.
- Empty state inside the popover: "No groups yet" + the same Create action.
- Keep the existing `Users` icon trigger and tooltip.

### 3. Responsiveness
- Popover width `w-72` on mobile, `w-80` on md+, matching `NewChatPicker`.
- Form inputs use existing shadcn `Input` / `Checkbox` so they inherit dark-mode tokens.

### 4. Tests / verification
- Manual: click Group with 0 groups → see "Create new group"; create one → thread opens and appears in sidebar; click Group again → group is listed and selectable.
- Typecheck + em-dash check.

## Out of scope
- Editing group name or membership after creation (can be a follow-up on the group thread header).
- Removing groups.
