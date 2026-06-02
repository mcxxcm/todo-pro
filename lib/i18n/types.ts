export interface Translations {
  // 通用
  common: {
    add: string;
    confirm: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    done: string;
    save: string;
    loading: string;
    error: string;
    retry: string;
    empty: string;
  };

  // 任务
  task: {
    title_placeholder: string;
    mark_done: string;
    mark_undone: string;
    view_task: string;
    delete_task: string;
    add_task: string;
    no_tasks: string;
    no_tasks_hint: string;
  };

  // 任务详情
  taskDetail: {
    title: string;
    priority: string;
    dueDate: string;
    not_set: string;
    tags: string;
    no_tags: string;
    notes: string;
    subtasks: string;
    no_subtasks: string;
    estimatedTime: string;
    actualTime: string;
    not_recorded: string;
    recurrence: string;
    no_recurrence: string;
    ai_decompose: string;
    start_focus: string;
    created: string;
  };

  // 审核卡片
  review: {
    confirm_save: string;
    dismiss_draft: string;
    due_placeholder: string;
  };

  // 番茄钟
  focus: {
    tomato_clock: string;
    focusing: string;
    paused: string;
    take_break: string;
    start_focus: string;
    pause: string;
    resume: string;
    finish: string;
    give_up: string;
    close_timer: string;
    work_minutes: string;
    break_minutes: string;
    start_session: string;
  };

  // 设置
  settings: {
    sync_targets: string;
    local_first: string;
    enabled: string;
    syncing: string;
    no_eligible: string;
    todoist_token_placeholder: string;
    todoist_token_label: string;
    oauth_planned: string;
  };

  // 同步
  sync: {
    check: string;
    no_eligible: string;
    check_failed: string;
  };

  // 统计
  stats: {
    title: string;
    completed_tasks: string;
    focus_count: string;
    total_focus_minutes: string;
  };
}
