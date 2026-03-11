<?php
/**
 * NexusFest API — JSON Response Helper
 * 
 * Standardized JSON responses for consistency across all endpoints.
 */

class Response
{
    /**
     * Send a success response.
     *
     * @param mixed  $data    Response data
     * @param string $message Human-readable message
     * @param int    $code    HTTP status code
     */
    public static function success(mixed $data = null, string $message = 'Success', int $code = 200): void
    {
        http_response_code($code);
        echo json_encode([
            'status'  => 'success',
            'message' => $message,
            'data'    => $data,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send a created response (201).
     */
    public static function created(mixed $data = null, string $message = 'Resource created'): void
    {
        self::success($data, $message, 201);
    }

    /**
     * Send an error response.
     *
     * @param string $message Error message
     * @param int    $code    HTTP status code
     * @param array  $errors  Detailed error list (e.g., validation errors)
     */
    public static function error(string $message = 'An error occurred', int $code = 400, array $errors = []): void
    {
        http_response_code($code);
        $response = [
            'status'  => 'error',
            'message' => $message,
        ];

        if (!empty($errors)) {
            $response['errors'] = $errors;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send a paginated list response.
     *
     * @param array $data       Data items
     * @param int   $total      Total matching records
     * @param int   $page       Current page
     * @param int   $perPage    Items per page
     */
    public static function paginated(array $data, int $total, int $page, int $perPage): void
    {
        http_response_code(200);
        echo json_encode([
            'status'  => 'success',
            'message' => 'Success',
            'data'    => $data,
            'pagination' => [
                'current_page' => $page,
                'per_page'     => $perPage,
                'total_items'  => $total,
                'total_pages'  => (int) ceil($total / $perPage),
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * 401 Unauthorized.
     */
    public static function unauthorized(string $message = 'Unauthorized'): void
    {
        self::error($message, 401);
    }

    /**
     * 403 Forbidden.
     */
    public static function forbidden(string $message = 'Forbidden'): void
    {
        self::error($message, 403);
    }

    /**
     * 404 Not Found.
     */
    public static function notFound(string $message = 'Resource not found'): void
    {
        self::error($message, 404);
    }

    /**
     * 405 Method Not Allowed.
     */
    public static function methodNotAllowed(): void
    {
        self::error('Method not allowed', 405);
    }

    /**
     * 429 Too Many Requests.
     */
    public static function tooManyRequests(): void
    {
        self::error('Rate limit exceeded. Please try again later.', 429);
    }
}
