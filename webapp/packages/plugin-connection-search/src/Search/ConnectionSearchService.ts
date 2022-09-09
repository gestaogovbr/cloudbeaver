/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import type { AdminConnectionSearchInfo } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { ConnectionFormService, ConnectionFormState, IConnectionFormState } from '@cloudbeaver/plugin-connections';

import { SearchDatabase } from './SearchDatabase';

const formGetter = () => SearchDatabase;

@injectable()
export class ConnectionSearchService {
  hosts = 'localhost';
  databases: AdminConnectionSearchInfo[];

  disabled = false;

  formState: IConnectionFormState | null = null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionFormService: ConnectionFormService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);

    this.databases = [];
    this.search = this.search.bind(this);
    this.change = this.change.bind(this);
    this.select = this.select.bind(this);

    makeObservable(this, {
      hosts: observable,
      databases: observable,
      disabled: observable,
      formState: observable.shallow,
    });
  }

  open(): void {
    this.optionsPanelService.open(formGetter);
  }

  async load(): Promise<void> {
    if (this.databases.length === 0) {
      await this.search();
    }
  }

  async search(): Promise<void> {
    if (this.disabled || !this.hosts || !this.hosts.trim()) {
      return;
    }

    this.disabled = true;

    try {
      const hosts = this.hosts
        .trim()
        .replace(/[\s,|+-]+/gm, ' ')
        .split(/[\s,|+-]/);

      this.databases = await this.connectionInfoResource.searchDatabases(hosts);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Databases search failed');
    } finally {
      this.disabled = false;
    }
  }

  private readonly closeHandler: IExecutorHandler<void> = async (data, contexts) => {
    const isDialogClosed = await this.showUnsavedChangesDialog();

    if (!isDialogClosed) {
      ExecutorInterrupter.interrupt(contexts);
      return;
    }

    this.clearFormState();
  };

  private async showUnsavedChangesDialog(): Promise<boolean> {
    if (
      !this.formState
      || !this.optionsPanelService.isOpen(formGetter)
      || (
        this.formState.config.connectionId
        && this.formState.projectId !== null
        && !this.connectionInfoResource.has(createConnectionParam(
          this.formState.projectId,
          this.formState.config.connectionId
        ))
      )
    ) {
      return true;
    }

    const state = await this.formState.checkFormState();

    if (!state?.edited) {
      return true;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'connections_public_connection_edit_cancel_title',
      message: 'connections_public_connection_edit_cancel_message',
      confirmActionText: 'ui_processing_ok',
    });

    return result !== DialogueStateResult.Rejected;
  }

  change(hosts: string): void {
    this.hosts = hosts;
  }

  saveConnection() {
    this.goBack();
  }

  goBack() {
    this.clearFormState();
  }

  select(projectId: string, database: AdminConnectionSearchInfo): void {
    if (!this.formState) {
      this.formState = new ConnectionFormState(
        this.connectionFormService,
        this.connectionInfoResource
      );
    }

    this.formState
      .setOptions(
        'create',
        'public'
      )
      .setConfig(projectId, {
        ...this.connectionInfoResource.getEmptyConfig(),
        driverId: database.defaultDriver,
        host: database.host,
        port: `${database.port}`,
      })
      .setAvailableDrivers(database.possibleDrivers);

    this.formState.load();
  }

  private clearFormState() {
    this.formState?.dispose();
    this.formState = null;
  }
}
