import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    pool!: mysql.Pool;

    async onModuleInit() {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST || 'mysql-a2a8fa4-gbox-d9a0.b.aivencloud.com',
            port: +(process.env.DB_PORT || 25050),
            user: process.env.DB_USER || 'avnadmin',
            password: process.env.DB_PASSWORD || 'AVNS_bKzbmKMeLIJmIYWdPVh',
            database: process.env.DB_NAME || 'defaultdb',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // optional: test connection
        const conn = await this.pool.getConnection();
        await conn.ping();
        conn.release();
        console.log('MySQL pool created');
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    getPool() {
        return this.pool;
    }
}