export interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

export interface PeriodicSyncManager {
  getTags(): Promise<string[]>;
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
}

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string;
}

declare global {
  interface ServiceWorkerRegistration {
    readonly sync?: SyncManager;
    readonly periodicSync?: PeriodicSyncManager;
  }

  interface SyncEvent extends ExtendableEvent {
    readonly lastChance: boolean;
    readonly tag: string;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent;
    periodicsync: PeriodicSyncEvent;
  }
}