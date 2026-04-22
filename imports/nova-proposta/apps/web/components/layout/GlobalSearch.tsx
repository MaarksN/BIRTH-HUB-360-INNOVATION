"use client";

import {
  Search,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState
} from "react";

import {
  getGlobalSearchCopy,
  mergeGlobalSearchGroups,
  type GlobalSearchGroup
} from "../../lib/global-search";
import { fetchSearchResults } from "../../lib/product-api";
import { useI18n } from "../../providers/I18nProvider";

const iconByGroup: Record<string, LucideIcon> = {
  conversations: Sparkles,
  notifications: Sparkles,
  reports: Sparkles,
  shortcuts: Search,
  workflows: Sparkles
};

export function GlobalSearch() {
  const { locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<GlobalSearchGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const copy = useMemo(() => getGlobalSearchCopy(locale), [locale]);

  const shortcutHint = useMemo(
    () =>
      typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")
        ? "cmd+k"
        : "ctrl+k",
    []
  );

  const handleKeydown = useEffectEvent((event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setOpen((current) => !current);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  useEffect(() => {
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [handleKeydown]);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);
      void fetchSearchResults(deferredQuery)
        .then((payload) => {
          setGroups(payload.groups);
        })
        .catch((searchError) => {
          setError(
            searchError instanceof Error ? searchError.message : copy.errorLabel
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 220);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copy.errorLabel, deferredQuery, open, pathname]);

  const mergedGroups = useMemo(
    () =>
      mergeGlobalSearchGroups({
        groups,
        locale,
        query: deferredQuery
      }),
    [deferredQuery, groups, locale]
  );

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={copy.openAriaLabel}
        className="command-button"
        onClick={() => {
          startTransition(() => {
            setOpen(true);
          });
        }}
        type="button"
      >
        <Search size={16} />
        <span>{copy.buttonLabel}</span>
        <kbd>{shortcutHint}</kbd>
      </button>

      {open ? (
        <div className="search-overlay" role="dialog" aria-modal="true">
          <button
            aria-label={copy.closeAriaLabel}
            className="search-overlay__backdrop"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div className="search-dialog">
            <div className="search-dialog__header">
              <Search size={18} />
              <input
                onChange={(event) => {
                  startTransition(() => {
                    setQuery(event.target.value);
                  });
                }}
                placeholder={copy.placeholder}
                ref={inputRef}
                value={query}
              />
            </div>

            <div className="search-dialog__body">
              {error ? <p className="search-error">{error}</p> : null}
              {isLoading ? <p className="search-muted">{copy.loadingLabel}</p> : null}
              {!isLoading && mergedGroups.length === 0 ? (
                <p className="search-muted">{copy.emptyLabel}</p>
              ) : null}

              {mergedGroups.map((group) => {
                const Icon = iconByGroup[group.id] ?? Search;

                return (
                  <section className="search-group" key={group.id}>
                    <div className="search-group__header">
                      <div>
                        <Icon size={14} />
                        <strong>{group.label}</strong>
                      </div>
                      <span>{group.items.length}</span>
                    </div>
                    <div className="search-group__items">
                      {group.items.map((item) => (
                        <Link
                          className="search-item"
                          href={item.href}
                          key={item.id}
                          onClick={() => {
                            setOpen(false);
                            router.prefetch(item.href);
                          }}
                        >
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.subtitle}</p>
                          </div>
                          <span>{item.type}</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
