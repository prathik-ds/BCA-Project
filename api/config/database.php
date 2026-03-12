<?php
/**
 * NexusFest API — MySQL Database Connection
 * 
 * Uses PDO with prepared statements for SQL injection prevention.
 * Returns a singleton PDO instance via Database::connect().
 */

// Ensure constants are loaded if this file is accessed directly or by tests
require_once __DIR__ . '/constants.php';

class Database
{
    private static ?PDO $connection = null;

    /**
     * Get the singleton PDO connection.
     */
    public static function connect(): PDO
    {
        if (self::$connection === null) {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";

            try {
                self::$connection = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8mb4'",
                ]);
            } catch (PDOException $e) {
                if (class_exists('Response')) {
                    Response::error('Database connection failed: ' . $e->getMessage(), 500);
                } else {
                    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
                }
                exit;
            }
        }

        return self::$connection;
    }

    /**
     * Close the connection (rarely needed, PHP does this at script end).
     */
    public static function disconnect(): void
    {
        self::$connection = null;
    }
}
