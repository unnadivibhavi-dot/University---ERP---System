const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { sql, getPool } = require("../config/db");

/*
  Login controller

  Expected request:
  {
    "username": "student01",
    "password": "Password123"
  }
*/
async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required"
            });
        }

        const pool = await getPool();

        const result = await pool
            .request()
            .input("username", sql.NVarChar, username)
            .query(`
        SELECT
          UserID,
          Username,
          PasswordHash,
          Role
        FROM Users
        WHERE Username = @username
      `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const user = result.recordset[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.PasswordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.UserID,
                username: user.Username,
                role: user.Role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                userId: user.UserID,
                username: user.Username,
                role: user.Role
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
}

module.exports = {
    login
};