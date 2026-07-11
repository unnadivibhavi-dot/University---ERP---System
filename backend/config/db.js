const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const connectDB = async () => {
    try {
        await sql.connect(dbConfig);
        console.log("Connected to SQL Server");
    } catch (error) {
        console.error("Database Connection Error:", error);
    }
};

module.exports = {
    sql,
    connectDB
};