import type { Translations } from "../types";

export const zh: Translations = {
  common: {
    add: "添加",
    confirm: "确认",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    close: "关闭",
    done: "完成",
    save: "保存",
    loading: "加载中...",
    error: "错误",
    retry: "重试",
    empty: "暂无数据",
  },

  task: {
    title_placeholder: "输入任务或随意的一段话...",
    mark_done: "标记为完成",
    mark_undone: "标记为未完成",
    view_task: "查看任务",
    delete_task: "删除任务",
    add_task: "添加任务",
    no_tasks: "暂无任务",
    no_tasks_hint: "点击下方 + 添加任务",
  },

  taskDetail: {
    title: "任务详情",
    priority: "优先级",
    dueDate: "截止日期",
    not_set: "未设置",
    tags: "标签",
    no_tags: "无标签",
    notes: "备注",
    subtasks: "子任务",
    no_subtasks: "暂无子任务",
    estimatedTime: "预估时间（分钟）",
    actualTime: "实际耗时（分钟）",
    not_recorded: "未记录",
    recurrence: "重复",
    no_recurrence: "不重复",
    ai_decompose: "AI 拆解",
    start_focus: "开始专注",
    created: "创建于",
  },

  review: {
    confirm_save: "确认保存",
    dismiss_draft: "忽略候选任务",
    due_placeholder: "添加截止日期...",
  },

  focus: {
    tomato_clock: "番茄钟",
    focusing: "专注中",
    paused: "已暂停",
    take_break: "休息一下",
    start_focus: "开始专注",
    pause: "暂停",
    resume: "继续",
    finish: "完成",
    give_up: "放弃",
    close_timer: "关闭番茄钟",
    work_minutes: "分钟专注",
    break_minutes: "分钟休息",
    start_session: "开始一段专注时间",
  },

  settings: {
    sync_targets: "同步目标",
    local_first: "先本地，后授权",
    enabled: "已启用",
    syncing: "检查中...",
    no_eligible: "无可同步",
    todoist_token_placeholder: "请输入您的 Todoist Token (留空则模拟同步)",
    todoist_token_label: "Todoist API Token (Personal · OAuth 计划中)",
    oauth_planned: "OAuth 计划中",
  },

  sync: {
    check: "同步检查",
    no_eligible: "无可同步",
    check_failed: "同步检查: 0 任务",
  },

  stats: {
    title: "统计",
    completed_tasks: "完成任务",
    focus_count: "专注次数",
    total_focus_minutes: "总专注分钟",
  },
};
