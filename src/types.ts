export type MigrationFileExport = {
    run: () => Promise<void>;
    rollback: () => Promise<void>;
}

export type DataFileMigration = {
    id: string;
    isAlreadyRun: boolean;
}

export type DataFile = {
    isInitialized: boolean;
    migrations: DataFileMigration[];
}