import dotenv from 'dotenv';
dotenv.config();

import { readFile, writeFile, readdir, Dirent } from 'fs';
import { DataFile, DataFileMigration, MigrationFileExport } from './types';
import { initialDataFile } from './configs';

const dataFilePath = `${process.cwd()}/data.json`;
const migrationsFolder = `${process.cwd()}/.build/migrations`;

const parseJSON = <T = any>(data, defaultValue: any = null): T => {
    try {
        return JSON.parse(data);
    } catch (error) {
        return defaultValue;
    }
}

const generateMigrationsMapping = (data: DataFileMigration[]) => {
    return data
        .filter(migration => migration.isAlreadyRun)
        .reduce((acc, curr) => {
            acc[curr.id] = true;
            return acc;
        }, {});
}

const readDataFile = async <T = any>(): Promise<T> => {
    return new Promise((resolve, reject) => {
        readFile(dataFilePath, (error, data) => {
            if (error) reject(error);
            const result = parseJSON<T>(data.toString(), {});
            resolve(result);
        })
    });
}

const writeToDataFile = async (data: DataFile): Promise<DataFile> => {
    return new Promise((resolve, reject) => {
        const stringifiedData = JSON.stringify(data, null, 2);
        writeFile(dataFilePath, stringifiedData, (error) => {
            if (error) reject(error);
            resolve(data);
        });
    });
}

const initializeDataFile = async (): Promise<DataFile> => {
    const data = await readDataFile<DataFile>();
    if (data?.isInitialized && data?.migrations?.length) return data;
    return writeToDataFile(initialDataFile);
}

const getMigrationIds = (data: DataFileMigration[]): Promise<string[]> => {
    const dataMigrationsMapping = generateMigrationsMapping(data);
    const processReadFiles = (files: Dirent[]) => {
        return files
            .filter(dirent => dirent.isFile())
            .filter(dirent => dirent.name.endsWith('.js'))
            .map(dirent => dirent.name.split('.')[0])
            .filter(migrationId => !dataMigrationsMapping[migrationId]);
    }

    return new Promise((resolve, reject) => {
        readdir(migrationsFolder, { withFileTypes: true }, (error, files) => {
            if (error) reject(error);
            resolve(processReadFiles(files));
        })
    });
}

const importMigration = (migrationId: string) => {
    return import(`./migrations/${migrationId}`).then(m => m.default as MigrationFileExport);
}

const markMigrationAsDone = (data: DataFile, migrationName: string) => {
    data.migrations.push({ isAlreadyRun: true, id: migrationName });
}

(async () => {
    const data = await initializeDataFile();
    const migrationFiles = await getMigrationIds(data.migrations);
    for (const migrationFile of migrationFiles) {
        const file = await importMigration(migrationFile);
        await file.run();
        markMigrationAsDone(data, migrationFile);
    }
    await writeToDataFile(data);
})();