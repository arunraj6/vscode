/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { CommandsRegistry } from 'vs/platform/commands/common/commands';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { RawContextKey, ContextKeyExpr } from 'vs/platform/contextkey/common/contextkey';
import { KeybindingsRegistry } from 'vs/platform/keybinding/common/keybindingsRegistry';
import { KeyCode, KeyMod } from 'vs/base/common/keyCodes';
import { INotificationViewItem, isNotificationViewItem } from 'vs/workbench/common/notifications';
import { MenuRegistry, MenuId } from 'vs/platform/actions/common/actions';
import { localize } from 'vs/nls';
import { IListService, WorkbenchList } from 'vs/platform/list/browser/listService';

// Center
export const SHOW_NOTIFICATIONS_CENTER_COMMAND_ID = 'notifications.showList';
export const HIDE_NOTIFICATIONS_CENTER_COMMAND_ID = 'notifications.hideList';
export const TOGGLE_NOTIFICATIONS_CENTER_COMMAND_ID = 'notifications.toggleList';

// Toasts
export const HIDE_NOTIFICATION_TOAST = 'notification.hideToasts';
export const FOCUS_NOTIFICATION_TOAST = 'notification.focusToasts';
export const NEXT_NOTIFICATION_TOAST = 'notification.focusNextToast';
export const PREVIOUS_NOTIFICATION_TOAST = 'notification.focusPreviousToast';

// Notification
export const COLLAPSE_NOTIFICATION = 'notification.collapse';
export const EXPAND_NOTIFICATION = 'notification.expand';
export const TOGGLE_NOTIFICATION = 'notification.toggle';
export const CLEAR_NOTIFICATION = 'notification.clear';
export const CLEAR_ALL_NOTIFICATIONS = 'notifications.clearAll';

const notificationFocusedId = 'notificationFocus';
export const NotificationFocusedContext = new RawContextKey<boolean>(notificationFocusedId, true);

const notificationsCenterVisibleId = 'notificationsCenterVisible';
export const NotificationsCenterVisibleContext = new RawContextKey<boolean>(notificationsCenterVisibleId, false);

const notificationsToastsVisibleId = 'notificationsToastsVisible';
export const NotificationsToastsVisibleContext = new RawContextKey<boolean>(notificationsToastsVisibleId, false);

export interface INotificationsCenterController {
	readonly isVisible: boolean;

	show(): void;
	hide(): void;

	clearAll(): void;
}

export interface INotificationsToastController {
	focus(): void;
	focusNext(): void;
	focusPrevious(): void;

	hide(): void;
}

export function registerNotificationCommands(center: INotificationsCenterController, toasts: INotificationsToastController): void {

	function getNotificationFromContext(listService: IListService, context?: any): INotificationViewItem {
		if (isNotificationViewItem(context)) {
			return context;
		}

		const list = listService.lastFocusedList;
		if (list instanceof WorkbenchList) {
			const focusedElement = list.getFocusedElements()[0];
			if (isNotificationViewItem(focusedElement)) {
				return focusedElement;
			}
		}

		return void 0;
	}

	// Show Notifications Cneter
	CommandsRegistry.registerCommand(SHOW_NOTIFICATIONS_CENTER_COMMAND_ID, () => center.show());

	// Hide Notifications Center
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: HIDE_NOTIFICATIONS_CENTER_COMMAND_ID,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(50),
		when: NotificationsCenterVisibleContext,
		primary: KeyCode.Escape,
		handler: accessor => center.hide()
	});

	// Toggle Notifications Center
	CommandsRegistry.registerCommand(TOGGLE_NOTIFICATIONS_CENTER_COMMAND_ID, accessor => center.isVisible ? center.hide() : center.show());

	// Clear Notification
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: CLEAR_NOTIFICATION,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(),
		when: NotificationFocusedContext,
		primary: KeyCode.Delete,
		mac: {
			primary: KeyMod.CtrlCmd | KeyCode.Backspace
		},
		handler: (accessor, args?: any) => {
			const notification = getNotificationFromContext(accessor.get(IListService), args);
			if (notification) {
				notification.dispose();
			}
		}
	});

	// Expand Notification
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: EXPAND_NOTIFICATION,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(),
		when: NotificationFocusedContext,
		primary: KeyCode.RightArrow,
		handler: (accessor, args?: any) => {
			const notification = getNotificationFromContext(accessor.get(IListService), args);
			if (notification) {
				notification.expand();
			}
		}
	});

	// Collapse Notification
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: COLLAPSE_NOTIFICATION,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(),
		when: NotificationFocusedContext,
		primary: KeyCode.LeftArrow,
		handler: (accessor, args?: any) => {
			const notification = getNotificationFromContext(accessor.get(IListService), args);
			if (notification) {
				notification.collapse();
			}
		}
	});

	// Toggle Notification
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: TOGGLE_NOTIFICATION,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(),
		when: NotificationFocusedContext,
		primary: KeyCode.Space,
		handler: accessor => {
			const notification = getNotificationFromContext(accessor.get(IListService));
			if (notification) {
				notification.toggle();
			}
		}
	});

	// Hide Toasts
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: HIDE_NOTIFICATION_TOAST,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(50),
		when: NotificationsToastsVisibleContext,
		primary: KeyCode.Escape,
		handler: accessor => toasts.hide()
	});

	// Focus Toasts
	CommandsRegistry.registerCommand(FOCUS_NOTIFICATION_TOAST, () => toasts.focus());

	// Next Toast
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: NEXT_NOTIFICATION_TOAST,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(),
		when: ContextKeyExpr.and(NotificationFocusedContext, NotificationsToastsVisibleContext),
		primary: KeyCode.DownArrow,
		handler: (accessor) => {
			toasts.focusNext();
		}
	});

	// Previous Toast
	KeybindingsRegistry.registerCommandAndKeybindingRule({
		id: PREVIOUS_NOTIFICATION_TOAST,
		weight: KeybindingsRegistry.WEIGHT.workbenchContrib(),
		when: ContextKeyExpr.and(NotificationFocusedContext, NotificationsToastsVisibleContext),
		primary: KeyCode.UpArrow,
		handler: (accessor) => {
			toasts.focusPrevious();
		}
	});

	/// Clear All Notifications
	CommandsRegistry.registerCommand(CLEAR_ALL_NOTIFICATIONS, () => center.clearAll());

	// Commands for Command Palette
	const category = localize('notifications', "Notifications");
	MenuRegistry.appendMenuItem(MenuId.CommandPalette, { command: { id: SHOW_NOTIFICATIONS_CENTER_COMMAND_ID, title: localize('showNotifications', "Show Notifications"), category }, when: NotificationsCenterVisibleContext.toNegated() });
	MenuRegistry.appendMenuItem(MenuId.CommandPalette, { command: { id: HIDE_NOTIFICATIONS_CENTER_COMMAND_ID, title: localize('hideNotifications', "Hide Notifications"), category }, when: NotificationsCenterVisibleContext });
	MenuRegistry.appendMenuItem(MenuId.CommandPalette, { command: { id: CLEAR_ALL_NOTIFICATIONS, title: localize('clearAllNotifications', "Clear All Notifications"), category } });




	// TODO@notifications remove me
	CommandsRegistry.registerCommand('notifications.showInfo', accessor => {
		accessor.get(INotificationService).info('This is an information message!' + Date.now());
	});

	CommandsRegistry.registerCommand('notifications.showWarning', accessor => {
		accessor.get(INotificationService).warn('This is a warning message!' + Date.now());
	});

	CommandsRegistry.registerCommand('notifications.showError', accessor => {
		accessor.get(INotificationService).error('This is an error message!' + Date.now());
	});
}