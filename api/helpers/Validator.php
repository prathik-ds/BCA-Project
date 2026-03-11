<?php
/**
 * NexusFest API — Input Validator
 * 
 * Server-side validation for all incoming request data.
 * Collects errors and returns them in a structured format.
 */

class Validator
{
    private array $errors = [];
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Check if a field is present and non-empty.
     */
    public function required(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (!isset($this->data[$field]) || trim((string) $this->data[$field]) === '') {
            $this->errors[$field] = "{$label} is required";
        }
        return $this;
    }

    /**
     * Validate email format.
     */
    public function email(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "{$label} must be a valid email address";
        }
        return $this;
    }

    /**
     * Validate minimum string length.
     */
    public function minLength(string $field, int $min, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && strlen(trim($this->data[$field])) < $min) {
            $this->errors[$field] = "{$label} must be at least {$min} characters";
        }
        return $this;
    }

    /**
     * Validate maximum string length.
     */
    public function maxLength(string $field, int $max, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && strlen(trim($this->data[$field])) > $max) {
            $this->errors[$field] = "{$label} must not exceed {$max} characters";
        }
        return $this;
    }

    /**
     * Validate that a field is numeric.
     */
    public function numeric(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = "{$label} must be a number";
        }
        return $this;
    }

    /**
     * Validate minimum numeric value.
     */
    public function min(string $field, float $min, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && is_numeric($this->data[$field]) && $this->data[$field] < $min) {
            $this->errors[$field] = "{$label} must be at least {$min}";
        }
        return $this;
    }

    /**
     * Validate that a field value is in an allowed list.
     */
    public function in(string $field, array $allowed, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !in_array($this->data[$field], $allowed, true)) {
            $allowedStr = implode(', ', $allowed);
            $this->errors[$field] = "{$label} must be one of: {$allowedStr}";
        }
        return $this;
    }

    /**
     * Validate phone number format.
     */
    public function phone(string $field, string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field]) && !preg_match('/^\+?[0-9]{10,15}$/', $this->data[$field])) {
            $this->errors[$field] = "{$label} must be a valid phone number";
        }
        return $this;
    }

    /**
     * Validate date format (Y-m-d H:i:s or Y-m-d).
     */
    public function dateTime(string $field, string $format = 'Y-m-d H:i:s', string $label = ''): self
    {
        $label = $label ?: $field;
        if (isset($this->data[$field])) {
            $d = DateTime::createFromFormat($format, $this->data[$field]);
            if (!$d || $d->format($format) !== $this->data[$field]) {
                $this->errors[$field] = "{$label} must be a valid date in {$format} format";
            }
        }
        return $this;
    }

    /**
     * Check if validation passed.
     */
    public function passes(): bool
    {
        return empty($this->errors);
    }

    /**
     * Get all validation errors.
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * If validation fails, send error response and halt execution.
     */
    public function validate(): void
    {
        if (!$this->passes()) {
            Response::error('Validation failed', 422, $this->errors);
        }
    }
}
