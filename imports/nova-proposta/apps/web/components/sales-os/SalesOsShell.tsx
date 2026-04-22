"use client";

import {
  SalesOsChatWorkspace,
  SalesOsExecutionWorkspace,
  SalesOsMentorPanel,
  SalesOsMentorToggle,
  SalesOsModuleOverview,
  SalesOsToolBoardHeader,
  SalesOsToolRail
} from "./SalesOsShell.sections";
import { type SalesOsShellCopy } from "./shell-support";
import { useSalesOsShellState } from "./sales-os-shell.state";
import styles from "./sales-os.module.css";

export function SalesOsShell(input: { copy: SalesOsShellCopy }) {
  const { copy } = input;
  const shell = useSalesOsShellState(copy);
  const selectedModuleTitle = shell.modules.find((moduleDefinition) => moduleDefinition.id === shell.selectedModule)?.title;

  if (shell.catalogLoading) {
    return <section className="panel">{copy.catalogLoading}</section>;
  }

  return (
    <>
      <SalesOsModuleOverview
        availableModules={shell.availableModules}
        copy={copy}
        moduleCounts={shell.moduleCounts}
        moduleSearch={shell.moduleSearch}
        onModuleSearchChange={shell.setModuleSearch}
        onSelectModule={shell.setSelectedModule}
        selectedModule={shell.selectedModule}
        tools={shell.tools}
      />

      <section className={styles.workspace}>
        <SalesOsToolRail
          copy={copy}
          onSelectTool={shell.setSelectedToolId}
          onToolSearchChange={shell.setToolSearch}
          selectedModuleTitle={selectedModuleTitle}
          selectedToolId={shell.selectedTool?.id}
          toolSearch={shell.toolSearch}
          visibleTools={shell.visibleTools}
        />

        <div className={styles.board}>
          {!shell.selectedTool ? (
            <article className={styles.emptyWorkspace}>
              <strong>{copy.emptyWorkspaceTitle}</strong>
              <p>{copy.emptyWorkspaceDescription}</p>
            </article>
          ) : (
            <>
              <SalesOsToolBoardHeader
                copy={copy}
                outputProvider={shell.outputProvider}
                selectedModuleTitle={selectedModuleTitle}
                selectedTool={shell.selectedTool}
              />

              {shell.selectedTool.isChat ? (
                <SalesOsChatWorkspace
                  copy={copy}
                  inputValue={shell.roleplayInput}
                  loading={shell.roleplayLoading}
                  messages={shell.roleplayMessages}
                  onInputChange={shell.setRoleplayInput}
                  onSend={shell.handleRoleplaySend}
                  selectedTool={shell.selectedTool}
                />
              ) : (
                <SalesOsExecutionWorkspace
                  copy={copy}
                  copyState={shell.copyState}
                  formValues={shell.formValues}
                  onCopyOutput={shell.handleCopyOutput}
                  onFormValueChange={(fieldId, value) => {
                    shell.setFormValues((current) => ({
                      ...current,
                      [fieldId]: value
                    }));
                  }}
                  onRunTool={shell.handleRunTool}
                  onSelectedImageChange={shell.setSelectedImage}
                  output={shell.output}
                  runLoading={shell.runLoading}
                  selectedImage={shell.selectedImage}
                  selectedTool={shell.selectedTool}
                />
              )}
            </>
          )}
        </div>
      </section>

      <SalesOsMentorToggle
        copy={copy}
        mentorOpen={shell.mentorOpen}
        onToggle={() => shell.setMentorOpen((current) => !current)}
      />

      {shell.mentorOpen ? (
        <SalesOsMentorPanel
          copy={copy}
          inputValue={shell.mentorInput}
          loading={shell.mentorLoading}
          messages={shell.mentorMessages}
          onClose={() => shell.setMentorOpen(false)}
          onInputChange={shell.setMentorInput}
          onSend={shell.handleMentorSend}
        />
      ) : null}
    </>
  );
}
