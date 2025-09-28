import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool to the database.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chat_app_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Query function to execute queries from other modules
export async function query(sql, params) {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
}

export default pool;
