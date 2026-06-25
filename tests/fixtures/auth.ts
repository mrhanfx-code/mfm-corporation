import { test as base } from '@playwright/test';

export const test = base.extend({
  // Dashboard secret for API authentication
  dashboardSecret: async ({}, use) => {
    const secret = process.env.DASHBOARD_SECRET || 'test-secret';
    await use(secret);
  },

  // Authorized user ID for Telegram tests
  authorizedUserId: async ({}, use) => {
    const userId = process.env.AUTHORIZED_USER_ID || '6847462500';
    await use(userId);
  },

  // Webhook secret for Telegram tests
  webhookSecret: async ({}, use) => {
    const secret = process.env.WEBHOOK_SECRET || 'test-webhook-secret';
    await use(secret);
  },

  // Base URL for the worker
  baseURL: async ({}, use) => {
    const url = process.env.BASE_URL || 'https://mfm-corporation-telegram-bot.mrhan-fx.workers.dev';
    await use(url);
  },
});
