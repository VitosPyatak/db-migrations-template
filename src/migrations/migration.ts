import { MigrationFileExport } from "../types"

export default <MigrationFileExport>{
    run: async () => { 
        console.log('Migration 1 run');
    },
    rollback: async () => { 
        console.log('Migration 1 rollback');
    }
}