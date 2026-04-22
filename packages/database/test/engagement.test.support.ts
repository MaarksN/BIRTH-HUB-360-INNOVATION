import { mock } from 'node:test';
import { Prisma } from '@prisma/client';
import type { EngagementPrismaClient } from '../src/repositories/engagement.js';

export function createMockUserPreference(overrides: Partial<Prisma.UserPreferenceGetPayload<Prisma.UserPreferenceDefaultArgs>> = {}): Prisma.UserPreferenceGetPayload<Prisma.UserPreferenceDefaultArgs> {
  return {
    cookieConsent: "PENDING",
    createdAt: new Date(),
    emailNotifications: true,
    id: "pref_1",
    inAppNotifications: true,
    locale: "en-US",
    marketingEmails: false,
    organizationId: "org_1",
    pushNotifications: false,
    tenantId: "tenant_1",
    updatedAt: new Date(),
    userId: "user_1",
    ...overrides
  } as Prisma.UserPreferenceGetPayload<Prisma.UserPreferenceDefaultArgs>;
}

export function createMockNotification(overrides: Partial<Prisma.NotificationGetPayload<Prisma.NotificationDefaultArgs>> = {}): Prisma.NotificationGetPayload<Prisma.NotificationDefaultArgs> {
  return {
    content: "ops",
    createdAt: new Date(),
    id: "notification_1",
    isRead: false,
    link: null,
    metadata: null,
    organizationId: "org_1",
    readAt: null,
    tenantId: "tenant_1",
    type: "INFO",
    updatedAt: new Date(),
    userId: "user_admin",
    ...overrides
  } as Prisma.NotificationGetPayload<Prisma.NotificationDefaultArgs>;
}

export function createMockAuditLog(overrides: Partial<Prisma.AuditLogGetPayload<Prisma.AuditLogDefaultArgs>> = {}): Prisma.AuditLogGetPayload<Prisma.AuditLogDefaultArgs> {
  return {
    action: "user.cookie_consent_updated",
    actorId: "user_1",
    createdAt: new Date(),
    diff: {},
    entityId: "pref_1",
    entityType: "user_preference",
    id: "audit_1",
    ip: null,
    tenantId: "tenant_1",
    userAgent: null,
    ...overrides
  } as Prisma.AuditLogGetPayload<Prisma.AuditLogDefaultArgs>;
}

export function createMockMembership(overrides: Partial<Prisma.MembershipGetPayload<{ include: { user: { include: { preferences: true } } } }>> = {}): Prisma.MembershipGetPayload<{ include: { user: { include: { preferences: true } } } }> {
  return {
    createdAt: new Date(),
    id: "membership_1",
    organizationId: "org_1",
    role: "ADMIN",
    status: "ACTIVE",
    tenantId: "tenant_1",
    updatedAt: new Date(),
    user: {
      createdAt: new Date(),
      email: "admin@example.com",
      id: "user_admin",
      lastLoginAt: null,
      name: "Admin",
      preferences: [
        {
          cookieConsent: "ACCEPTED",
          createdAt: new Date(),
          emailNotifications: true,
          id: "pref_admin",
          inAppNotifications: true,
          locale: "en-US",
          marketingEmails: false,
          organizationId: "org_1",
          pushNotifications: false,
          tenantId: "tenant_1",
          updatedAt: new Date(),
          userId: "user_admin"
        }
      ],
      status: "ACTIVE",
      tenantId: "tenant_1",
      updatedAt: new Date()
    },
    userId: "user_admin",
    ...overrides
  } as unknown as Prisma.MembershipGetPayload<{ include: { user: { include: { preferences: true } } } }>;
}

export function createPrismaPromise<T>(value: T): Prisma.PrismaPromise<T> {
  const promise = Promise.resolve(value);
  void Object.defineProperty(promise, Symbol.toStringTag, {
    value: "PrismaPromise",
    configurable: true
  });
  return promise as unknown as Prisma.PrismaPromise<T>;
}

export function createEngagementPrismaMock(): EngagementPrismaClient {
  return {
    auditLog: {
      create: mock.fn(() => createPrismaPromise(createMockAuditLog()))
    },
    membership: {
      findMany: mock.fn(() => createPrismaPromise([]))
    },
    notification: {
      count: mock.fn(() => createPrismaPromise(0)),
      create: mock.fn(() => createPrismaPromise(createMockNotification())),
      createMany: mock.fn(() => createPrismaPromise({ count: 1 } as Prisma.BatchPayload)),
      findMany: mock.fn(() => createPrismaPromise([])),
      updateMany: mock.fn(() => createPrismaPromise({ count: 1 } as Prisma.BatchPayload))
    },
    userPreference: {
      findUnique: mock.fn(() => createPrismaPromise(createMockUserPreference())),
      upsert: mock.fn(() => createPrismaPromise(createMockUserPreference()))
    }
  } as unknown as EngagementPrismaClient;
}

