<?php
/**
 * NexusFest API — MySQL Database Connection
 * 
 * Uses PDO with prepared statements for SQL injection prevention.
 * Returns a singleton PDO instance via Database::connect().
 */

class Database
{
    // ── Connection credentials (override via environment) ──
    private static string $host   = 'localhost';
    private static string $dbname = 'nexusfest';
    private static string $user   = 'root';
    private static string $pass   = '';
    private static string $port   = '3306';

    private static ?PDO $connection = null;

    /**
     * Get the singleton PDO connection.
     */
    public static function connect(): PDO
    {
        if (self::$connection === null) {
            // Allow override from environment variables
            $host   = getenv('DB_HOST')   ?: self::$host;
            $dbname = getenv('DB_NAME')   ?: self::$dbname;
            $user   = getenv('DB_USER')   ?: self::$user;
            $pass   = getenv('DB_PASS')   ?: self::$pass;
            $port   = getenv('DB_PORT')   ?: self::$port;

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            try {
                self::$connection = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8mb4'",
                ]);
            } catch (PDOException $e) {
                Response::error('Database connection failed', 500);
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
