import { prisma } from "@birthub/database";

type SearchItem = {
  href: string;
  id: string;
  subtitle: string;
  title: string;
  type: string;
};

type SearchGroup = {
  id: string;
  items: SearchItem[];
  label: string;
};

const GROUP_LIMIT = 5;

function normalizeSearch(value: string): string {
  return value.trim().slice(0, 80);
}

function buildStaticShortcutGroup(query: string): SearchGroup {
  const shortcuts = [
    {
      href: "/dashboard",
      id: "shortcut-dashboard",
      keywords: ["dashboard", "home", "inicio", "resumo"],
      subtitle: "Visao geral da operacao",
      title: "Dashboard",
      type: "shortcut"
    },
    {
      href: "/workflows",
      id: "shortcut-workflows",
      keywords: ["workflow", "automation", "automacao", "fluxo"],
      subtitle: "Lista e execucao de workflows",
      title: "Workflows",
      type: "shortcut"
    },
    {
      href: "/notifications",
      id: "shortcut-notifications",
      keywords: ["notification", "notificacao", "alerta", "feed"],
      subtitle: "Central de notificacoes do operador",
      title: "Notificacoes",
      type: "shortcut"
    },
    {
      href: "/analytics",
      id: "shortcut-analytics",
      keywords: ["analytics", "metricas", "usage", "indicadores"],
      subtitle: "Uso, receita e retencao",
      title: "Analytics",
      type: "shortcut"
    },
    {
      href: "/conversations",
      id: "shortcut-conversations",
      keywords: ["conversation", "conversa", "thread", "atendimento"],
      subtitle: "Fila de conversas e notas internas",
      title: "Conversations",
      type: "shortcut"
    },
    {
      href: "/reports",
      id: "shortcut-reports",
      keywords: ["report", "relatorio", "export", "outputs"],
      subtitle: "Exports e artefatos gerados",
      title: "Reports",
      type: "shortcut"
    },
    {
      href: "/onboarding",
      id: "shortcut-onboarding",
      keywords: ["onboarding", "setup", "primeiros passos"],
      subtitle: "Guia inicial e checklist",
      title: "Onboarding",
      type: "shortcut"
    }
  ];

  const filtered = query
    ? shortcuts.filter((shortcut) =>
        [shortcut.title, shortcut.subtitle, ...shortcut.keywords].some((candidate) =>
          candidate.toLowerCase().includes(query.toLowerCase())
        )
      )
    : shortcuts;

  return {
    id: "shortcuts",
    items: filtered.slice(0, GROUP_LIMIT).map(({ keywords: _keywords, ...item }) => item),
    label: "Atalhos"
  };
}

export async function searchWorkspace(input: {
  organizationId: string;
  query: string;
  tenantId: string;
  userId: string;
}): Promise<SearchGroup[]> {
  const query = normalizeSearch(input.query);
  const shortcuts = buildStaticShortcutGroup(query);

  if (query.length < 2) {
    return [shortcuts];
  }

  const [workflows, conversations, notifications, reports] = await Promise.all([
    prisma.workflow.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true,
        name: true,
        status: true,
        triggerType: true
      },
      take: GROUP_LIMIT,
      where: {
        tenantId: input.tenantId,
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            description: {
              contains: query,
              mode: "insensitive"
            }
          }
        ]
      }
    }),
    prisma.conversationThread.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: GROUP_LIMIT,
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        OR: [
          {
            subject: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            messages: {
              some: {
                contentPreview: {
                  contains: query,
                  mode: "insensitive"
                }
              }
            }
          }
        ]
      }
    }),
    prisma.notification.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        content: true,
        id: true,
        type: true
      },
      take: GROUP_LIMIT,
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        content: {
          contains: query,
          mode: "insensitive"
        }
      }
    }),
    prisma.outputArtifact.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        agentId: true,
        id: true,
        status: true,
        type: true
      },
      take: GROUP_LIMIT,
      where: {
        organizationId: input.organizationId,
        tenantId: input.tenantId,
        OR: [
          {
            agentId: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            type: {
              contains: query,
              mode: "insensitive"
            }
          },
          {
            content: {
              contains: query,
              mode: "insensitive"
            }
          }
        ]
      }
    })
  ]);

  return [
    shortcuts,
    {
      id: "workflows",
      items: workflows.map((workflow) => ({
        href: `/workflows/${workflow.id}/edit`,
        id: workflow.id,
        subtitle: `${workflow.triggerType} · ${workflow.status}`,
        title: workflow.name,
        type: "workflow"
      })),
      label: "Workflows"
    },
    {
      id: "conversations",
      items: conversations.map((conversation) => ({
        href: `/conversations?thread=${encodeURIComponent(conversation.id)}`,
        id: conversation.id,
        subtitle: conversation.messages[0]?.contentPreview ?? conversation.status,
        title: conversation.subject ?? `Thread ${conversation.id.slice(0, 8)}`,
        type: "conversation"
      })),
      label: "Conversations"
    },
    {
      id: "notifications",
      items: notifications.map((notification) => ({
        href: "/notifications",
        id: notification.id,
        subtitle: notification.type,
        title: notification.content,
        type: "notification"
      })),
      label: "Notificacoes"
    },
    {
      id: "reports",
      items: reports.map((report) => ({
        href: `/reports?outputId=${encodeURIComponent(report.id)}`,
        id: report.id,
        subtitle: `${report.type} · ${report.status}`,
        title: report.agentId,
        type: "report"
      })),
      label: "Reports"
    }
  ].filter((group) => group.items.length > 0);
}

