import assert from "node:assert/strict";
import { notificationMessage, TaskNotificationSyncResult } from "../lib/notificationTypes";

// Test all status branches
const scheduled: TaskNotificationSyncResult = { status: "scheduled", notificationId: "task-1" };
assert.equal(notificationMessage(scheduled), "提醒已安排");

const updated: TaskNotificationSyncResult = { status: "updated", notificationId: "task-1" };
assert.equal(notificationMessage(updated), "提醒已更新");

const cancelledCompleted: TaskNotificationSyncResult = { status: "cancelled", reason: "completed" };
assert.equal(notificationMessage(cancelledCompleted), "提醒已取消");

const cancelledDeleted: TaskNotificationSyncResult = { status: "cancelled", reason: "deleted" };
assert.equal(notificationMessage(cancelledDeleted), "提醒已取消");

const cancelledMissing: TaskNotificationSyncResult = { status: "cancelled", reason: "missing_dueAt" };
assert.equal(notificationMessage(cancelledMissing), "提醒已取消");

const cancelledPastDue: TaskNotificationSyncResult = { status: "cancelled", reason: "past_due" };
assert.equal(notificationMessage(cancelledPastDue), "提醒已取消");

const cancelledDisabled: TaskNotificationSyncResult = { status: "cancelled", reason: "disabled" };
assert.equal(notificationMessage(cancelledDisabled), "提醒已取消");

const permissionDenied: TaskNotificationSyncResult = { status: "permission_denied" };
assert.equal(notificationMessage(permissionDenied), "通知权限未开启");

const unsupportedWeb: TaskNotificationSyncResult = { status: "unsupported", reason: "web" };
assert.equal(notificationMessage(unsupportedWeb), "Web 环境不支持通知");

const unsupportedSim: TaskNotificationSyncResult = { status: "unsupported", reason: "simulator" };
assert.equal(notificationMessage(unsupportedSim), "模拟器不支持通知");

const noneNoDueAt: TaskNotificationSyncResult = { status: "none", reason: "no_dueAt" };
assert.equal(notificationMessage(noneNoDueAt), "");

const noneNotTodo: TaskNotificationSyncResult = { status: "none", reason: "not_todo" };
assert.equal(notificationMessage(noneNotTodo), "");

console.log("Notification message checks passed:", 12);
