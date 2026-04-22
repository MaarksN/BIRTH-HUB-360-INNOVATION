"use client";

import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  LayoutPanelTop,
  ListFilter,
  MapPinned,
  Search,
} from "lucide-react";

import type { SupportedLocale } from "../../lib/i18n";
import type {
  LeadRegionId,
  SdrAutomaticLead
} from "./sdr-automatic-data";
import {
  AVAILABLE_LEAD_COLUMNS,
  DEFAULT_LEAD_FILTERS,
  type LeadColumnId,
  type LeadDashboardCopy,
  type LeadFilters,
  type LeadScoreBandId
} from "./sdr-automatic-dashboard";
import type {
  LeadInsightState,
  LeadSequenceState
} from "./SdrLeadScoreWorkspace.helpers";
import {
  InfoTooltip,
  LeadTableCell
} from "./SdrLeadScoreWorkspace.table.cells";
import shellStyles from "./sdr-automatic-platform.module.css";
import styles from "./sdr-lead-score.module.css";

type PaginationState = {
  currentPage: number;
  items: SdrAutomaticLead[];
  totalPages: number;
};

type SdrLeadScoreWorkspaceTableProps = {
  columnLabels: Record<LeadColumnId, string>;
  dashboardCopy: LeadDashboardCopy;
  filteredLeadsLength: number;
  filters: LeadFilters;
  handleExportCsv: () => void;
  handleLeadInsight: (lead: SdrAutomaticLead) => Promise<void>;
  handleSendSequence: (lead: SdrAutomaticLead) => Promise<void>;
  insights: Record<string, LeadInsightState>;
  liveLeadsLength: number;
  locale: SupportedLocale;
  openInsightLeadId: string | null;
  openSequenceLeadId: string | null;
  pagination: PaginationState;
  sequenceRuns: Record<string, LeadSequenceState>;
  setFilters: (value: LeadFilters) => void;
  setPage: (value: number | ((current: number) => number)) => void;
  toggleColumn: (column: LeadColumnId) => void;
  toggleRegion: (region: LeadRegionId) => void;
  toggleScoreBand: (band: LeadScoreBandId) => void;
  toggleStage: (stage: SdrAutomaticLead["stage"]) => void;
  updateFilter: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void;
  visibleColumns: LeadColumnId[];
};

export function SdrLeadScoreWorkspaceTable(props: SdrLeadScoreWorkspaceTableProps) {
  const {
    columnLabels,
    dashboardCopy,
    filteredLeadsLength,
    filters,
    handleExportCsv,
    handleLeadInsight,
    handleSendSequence,
    insights,
    liveLeadsLength,
    locale,
    openInsightLeadId,
    openSequenceLeadId,
    pagination,
    sequenceRuns,
    setFilters,
    setPage,
    toggleColumn,
    toggleRegion,
    toggleScoreBand,
    toggleStage,
    updateFilter,
    visibleColumns
  } = props;

  function renderColumnLabel(column: LeadColumnId) {
    return columnLabels[column];
  }

  function renderColumnHeader(column: LeadColumnId) {
    return (
      <span className={styles.headerLabel}>
        <span>{renderColumnLabel(column)}</span>
        <InfoTooltip
          align="left"
          content={dashboardCopy.columnTooltips[column]}
          label={renderColumnLabel(column)}
        />
      </span>
    );
  }

  return (
    <article className={`${shellStyles.surfaceCard} ${styles.tableCard}`}>
      <div className={styles.tableToolbar}>
        <div>
          <strong>{dashboardCopy.filtersTitle}</strong>
          <p>{dashboardCopy.leadsVisibleLabel(filteredLeadsLength, liveLeadsLength)}</p>
        </div>
        <div className={styles.toolbarActions}>
          <label className={styles.searchField}>
            <Search size={16} />
            <input
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder={dashboardCopy.emailSearchPlaceholder}
              type="search"
              value={filters.query}
            />
          </label>

          <div className={styles.filterControl}>
            <details className={styles.dropdown}>
              <summary title={dashboardCopy.filterTooltips.stage}>
                <Filter size={16} />
                <span>{dashboardCopy.stageFilterLabel}</span>
              </summary>
              <div className={styles.dropdownBody}>
                {(Object.keys(dashboardCopy.stageLabels) as SdrAutomaticLead["stage"][]).map((stage) => (
                  <label className={styles.dropdownOption} key={stage}>
                    <input
                      checked={filters.stages.includes(stage)}
                      onChange={() => toggleStage(stage)}
                      type="checkbox"
                    />
                    <span>{dashboardCopy.stageLabels[stage]}</span>
                  </label>
                ))}
              </div>
            </details>
            <InfoTooltip
              content={dashboardCopy.filterTooltips.stage}
              label={dashboardCopy.stageFilterLabel}
            />
          </div>

          <div className={styles.filterControl}>
            <details className={styles.dropdown}>
              <summary title={dashboardCopy.filterTooltips.region}>
                <MapPinned size={16} />
                <span>{dashboardCopy.regionFilterLabel}</span>
              </summary>
              <div className={styles.dropdownBody}>
                {(Object.keys(dashboardCopy.regionLabels) as LeadRegionId[]).map((region) => (
                  <label className={styles.dropdownOption} key={region}>
                    <input
                      checked={filters.regions.includes(region)}
                      onChange={() => toggleRegion(region)}
                      type="checkbox"
                    />
                    <span>{dashboardCopy.regionLabels[region]}</span>
                  </label>
                ))}
              </div>
            </details>
            <InfoTooltip
              content={dashboardCopy.filterTooltips.region}
              label={dashboardCopy.regionFilterLabel}
            />
          </div>

          <div className={styles.filterControl}>
            <details className={styles.dropdown}>
              <summary title={dashboardCopy.filterTooltips.score}>
                <ListFilter size={16} />
                <span>{dashboardCopy.scoreFilterLabel}</span>
              </summary>
              <div className={styles.dropdownBody}>
                {(Object.keys(dashboardCopy.scoreBandLabels) as LeadScoreBandId[]).map((band) => (
                  <label className={styles.dropdownOption} key={band}>
                    <input
                      checked={filters.scoreBands.includes(band)}
                      onChange={() => toggleScoreBand(band)}
                      type="checkbox"
                    />
                    <span>{dashboardCopy.scoreBandLabels[band]}</span>
                  </label>
                ))}
              </div>
            </details>
            <InfoTooltip
              content={dashboardCopy.filterTooltips.score}
              label={dashboardCopy.scoreFilterLabel}
            />
          </div>

          <div className={styles.filterControl}>
            <details className={styles.dropdown}>
              <summary title={dashboardCopy.filterTooltips.columns}>
                <LayoutPanelTop size={16} />
                <span>{dashboardCopy.columnsLabel}</span>
              </summary>
              <div className={styles.dropdownBody}>
                {AVAILABLE_LEAD_COLUMNS.map((column) => (
                  <label className={styles.dropdownOption} key={column}>
                    <input
                      checked={visibleColumns.includes(column)}
                      onChange={() => toggleColumn(column)}
                      type="checkbox"
                    />
                    <span>{renderColumnLabel(column)}</span>
                  </label>
                ))}
              </div>
            </details>
            <InfoTooltip
              content={dashboardCopy.filterTooltips.columns}
              label={dashboardCopy.columnsLabel}
            />
          </div>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.dateGroup}>
          <div className={styles.filterControl}>
            <strong>{dashboardCopy.dateFilterLabel}</strong>
            <InfoTooltip
              align="left"
              content={dashboardCopy.filterTooltips.date}
              label={dashboardCopy.dateFilterLabel}
            />
          </div>
          <div className={styles.dateInputs}>
            <label className={styles.dateField}>
              <span>{dashboardCopy.dateFromLabel}</span>
              <div>
                <CalendarRange size={14} />
                <input
                  onChange={(event) => updateFilter("createdFrom", event.target.value)}
                  type="date"
                  value={filters.createdFrom}
                />
              </div>
            </label>
            <label className={styles.dateField}>
              <span>{dashboardCopy.dateToLabel}</span>
              <div>
                <CalendarRange size={14} />
                <input
                  onChange={(event) => updateFilter("createdTo", event.target.value)}
                  type="date"
                  value={filters.createdTo}
                />
              </div>
            </label>
          </div>
        </div>
        <button className={styles.secondaryButton} onClick={handleExportCsv} type="button">
          <Download size={16} />
          <span>{dashboardCopy.exportCsvLabel}</span>
        </button>
        <button
          className={styles.secondaryButton}
          onClick={() => setFilters(DEFAULT_LEAD_FILTERS)}
          type="button"
        >
          {dashboardCopy.clearFiltersLabel}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={shellStyles.table}>
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th key={column} title={dashboardCopy.columnTooltips[column]}>
                  {renderColumnHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagination.items.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length}>{dashboardCopy.noLeadsLabel}</td>
              </tr>
            ) : (
              pagination.items.map((lead) => (
                <tr key={lead.id}>
                  {visibleColumns.map((column) => (
                    <td key={`${lead.id}_${column}`}>
                      <LeadTableCell
                        column={column}
                        dashboardCopy={dashboardCopy}
                        handleLeadInsight={handleLeadInsight}
                        handleSendSequence={handleSendSequence}
                        insight={insights[lead.id]}
                        lead={lead}
                        locale={locale}
                        openInsightLeadId={openInsightLeadId}
                        openSequenceLeadId={openSequenceLeadId}
                        sequenceRun={sequenceRuns[lead.id]}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationRow}>
        <span>{dashboardCopy.pageLabel(pagination.currentPage, pagination.totalPages)}</span>
        <div className={styles.paginationActions}>
          <button
            className={styles.secondaryButton}
            disabled={pagination.currentPage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            <ChevronLeft size={16} />
            <span>{dashboardCopy.previousPageLabel}</span>
          </button>
          <button
            className={styles.secondaryButton}
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
            type="button"
          >
            <span>{dashboardCopy.nextPageLabel}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
