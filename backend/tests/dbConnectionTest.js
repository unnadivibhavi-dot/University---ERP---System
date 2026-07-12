require("dotenv").config();

const { getPool } = require("../config/db");

const testDatabaseConnection = async () => {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT
                DB_NAME() AS DatabaseName,
                SYSTEM_USER AS ConnectedUser
        `);

        console.log("Database connection test successful");
        console.table(result.recordset);

        process.exit(0);
    } catch (error) {
        console.error("Database connection test failed");
        console.error(error.message);

        process.exit(1);
    }
};

testDatabaseConnection();