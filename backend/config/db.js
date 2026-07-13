const sql = require("mssql");
require("dotenv").config();

const requiredEnv = (name) => {
    const value = process.env[name];

    if (!value || value.trim() === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

const dbConfig = {
    user: requiredEnv("DB_USER"),
    password: requiredEnv("DB_PASSWORD"),
    server: requiredEnv("DB_SERVER"),
    database: requiredEnv("DB_DATABASE"),
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false"
    }
};

if (process.env.DB_PORT && process.env.DB_PORT.trim() !== "") {
    dbConfig.port = Number(process.env.DB_PORT);
}

let pool;

const connectDB = async () => {
    try {
        pool = await sql.connect(dbConfig);
        console.log(`Database connected successfully: ${process.env.DB_DATABASE}`);
        return pool;
    } catch (error) {
        console.error("Database Connection Error:", error.message);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error("Database pool is not initialized. Call connectDB first.");
    }

    return pool;
};

module.exports = {
    sql,
    connectDB,
    getPool
};
