import { Global, Module } from '@nestjs/common';
import { DB_CLIENT, DIRECT_DB_CLIENT, db, directDb } from './database.provider';

@Global()
@Module({
  providers: [
    {
      provide: DB_CLIENT,
      useValue: db,
    },
    {
      provide: DIRECT_DB_CLIENT,
      useValue: directDb,
    },
  ],
  exports: [DB_CLIENT, DIRECT_DB_CLIENT],
})
export class DatabaseModule {}
