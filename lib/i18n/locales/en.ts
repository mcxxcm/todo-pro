import type { Translations } from "../types";

export const en: Translations = {
  common: {
    add: "Add",
    confirm: "Confirm",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    done: "Done",
    save: "Save",
    loading: "Loading...",
    error: "Error",
    retry: "Retry",
    empty: "No data",
  },

  task: {
    title_placeholder: "Enter a task or anything...",
    mark_done: "Mark as done",
    mark_undone: "Mark as undone",
    view_task: "View task",
    delete_task: "Delete task",
    add_task: "Add task",
    no_tasks: "No tasks",
    no_tasks_hint: "Tap + to add a task",
  },

  taskDetail: {
    title: "Task Detail",
    priority: "Priority",
    dueDate: "Due Date",
    not_set: "Not set",
    tags: "Tags",
    no_tags: "No tags",
    notes: "Notes",
    subtasks: "Subtasks",
    no_subtasks: "No subtasks",
    estimatedTime: "Estimated (min)",
    actualTime: "Actual (min)",
    not_recorded: "Not recorded",
    recurrence: "Recurrence",
    no_recurrence: "None",
    ai_decompose: "AI Decompose",
    start_focus: "Start Focus",
    created: "Created",
  },

  review: {
    confirm_save: "Confirm Save",
    dismiss_draft: "Dismiss Draft",
    due_placeholder: "Add due date...",
  },

  focus: {
    tomato_clock: "Pomodoro",
    focusing: "Focusing",
    paused: "Paused",
    take_break: "Take a Break",
    start_focus: "Start Focus",
    pause: "Pause",
    resume: "Resume",
    finish: "Finish",
    give_up: "Give Up",
    close_timer: "Close Timer",
    work_minutes: "min focus",
    break_minutes: "min break",
    start_session: "Start a focus session",
  },

  settings: {
    sync_targets: "Sync Targets",
    local_first: "Local first, then authorize",
    enabled: "Enabled",
    syncing: "Checking...",
    no_eligible: "Nothing to sync",
    todoist_token_placeholder: "Enter your Todoist Token (leave empty for mock)",
    todoist_token_label: "Todoist API Token (Personal · OAuth Planned)",
    oauth_planned: "OAuth Planned",
  },

  sync: {
    check: "Sync Check",
    no_eligible: "Nothing to sync",
    check_failed: "Sync Check: 0 tasks",
  },

  stats: {
    title: "Stats",
    completed_tasks: "Completed",
    focus_count: "Focus Sessions",
    total_focus_minutes: "Total Focus Minutes",
  },
};
