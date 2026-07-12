const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

const dbConfig = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,

    options: {
        trustedConnection: true,
        trustServerCertificate: true
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

const connectDB = async () => {
    try {
        if (!pool) {
            pool = await new sql.ConnectionPool(dbConfig).connect();
            console.log(
                `Connected to SQL Server database: ${process.env.DB_DATABASE}`
            );
        }

        return pool;
    } catch (error) {
        console.error("Database Connection Error:", error.message);
        throw error;
    }
};

const getPool = async () => {
    if (!pool) {
        return connectDB();
    }

    return pool;
};

module.exports = {
    sql,
    connectDB,
    getPool
};