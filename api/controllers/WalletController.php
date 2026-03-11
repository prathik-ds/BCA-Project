<?php
/**
 * NexusFest API — Wallet Controller
 * 
 * Digital wallet for food stalls, event payments, and refunds.
 * Uses ACID transactions with balance snapshots for audit safety.
 */

class WalletController
{
    // ────────────────────────────────────────────────
    //  GET /api/v1/wallet/balance
    // ────────────────────────────────────────────────
    public static function balance(): void
    {
        $auth = AuthMiddleware::authenticate();
        $db   = Database::connect();

        $stmt = $db->prepare("
            SELECT w.wallet_id, w.balance, w.is_frozen, w.updated_at,
                   (SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id = w.wallet_id) AS total_transactions
            FROM wallets w WHERE w.user_id = :user
        ");
        $stmt->execute([':user' => $auth['user_id']]);
        $wallet = $stmt->fetch();

        if (!$wallet) {
            Response::notFound('Wallet not found. Contact admin.');
        }

        Response::success([
            'wallet_id'          => (int) $wallet['wallet_id'],
            'balance'            => (float) $wallet['balance'],
            'is_frozen'          => (bool) $wallet['is_frozen'],
            'total_transactions' => (int) $wallet['total_transactions'],
            'last_updated'       => $wallet['updated_at'],
        ]);
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/wallet/topup
    //  Add funds to wallet (simulates Razorpay callback)
    // ────────────────────────────────────────────────
    public static function topup(): void
    {
        $auth = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('amount', 'Amount')
          ->numeric('amount', 'Amount')
          ->min('amount', WALLET_MIN_TOPUP, 'Amount')
          ->validate();

        $amount = (float) $data['amount'];

        $db = Database::connect();

        // ── Get wallet ──
        $stmt = $db->prepare("SELECT wallet_id, balance, is_frozen FROM wallets WHERE user_id = :user FOR UPDATE");

        $db->beginTransaction();
        try {
            $stmt->execute([':user' => $auth['user_id']]);
            $wallet = $stmt->fetch();

            if (!$wallet) {
                $db->rollBack();
                Response::notFound('Wallet not found');
            }

            if ($wallet['is_frozen']) {
                $db->rollBack();
                Response::error('Your wallet is frozen. Contact admin.', 403);
            }

            $currentBalance = (float) $wallet['balance'];
            $newBalance     = $currentBalance + $amount;

            if ($newBalance > WALLET_MAX_BALANCE) {
                $db->rollBack();
                Response::error("Maximum wallet balance is ₹" . WALLET_MAX_BALANCE, 400);
            }

            // ── Update balance ──
            $db->prepare("UPDATE wallets SET balance = :bal WHERE wallet_id = :id")
               ->execute([':bal' => $newBalance, ':id' => $wallet['wallet_id']]);

            // ── Record transaction ──
            $referenceId = 'TOPUP_' . date('Ymd') . '_' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);

            $db->prepare("
                INSERT INTO wallet_transactions 
                    (wallet_id, type, category, amount, balance_before, balance_after,
                     reference_id, description)
                VALUES (:wallet, 'credit', 'topup', :amount, :before, :after,
                        :ref, 'Wallet top-up')
            ")->execute([
                ':wallet' => $wallet['wallet_id'],
                ':amount' => $amount,
                ':before' => $currentBalance,
                ':after'  => $newBalance,
                ':ref'    => $referenceId,
            ]);

            $txnId = (int) $db->lastInsertId();
            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Top-up failed', 500);
        }

        Response::success([
            'transaction_id' => $txnId,
            'reference_id'   => $referenceId,
            'amount_added'   => $amount,
            'new_balance'    => $newBalance,
        ], 'Wallet topped up successfully');
    }

    // ────────────────────────────────────────────────
    //  POST /api/v1/wallet/pay
    //  Make payment at a food stall via QR scan
    // ────────────────────────────────────────────────
    public static function pay(): void
    {
        $auth = AuthMiddleware::authenticate();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $v = new Validator($data);
        $v->required('stall_code', 'Stall code')
          ->required('amount', 'Amount')
          ->numeric('amount', 'Amount')
          ->min('amount', 1, 'Amount')
          ->validate();

        $amount = (float) $data['amount'];
        $db     = Database::connect();

        // ── Verify stall ──
        $stmt = $db->prepare("SELECT stall_id, stall_name, is_active FROM food_stalls WHERE stall_code = :code");
        $stmt->execute([':code' => $data['stall_code']]);
        $stall = $stmt->fetch();

        if (!$stall) {
            Response::notFound('Food stall not found');
        }

        if (!$stall['is_active']) {
            Response::error('This stall is currently inactive', 400);
        }

        $db->beginTransaction();
        try {
            // ── Lock and check wallet balance ──
            $stmt = $db->prepare("SELECT wallet_id, balance, is_frozen FROM wallets WHERE user_id = :user FOR UPDATE");
            $stmt->execute([':user' => $auth['user_id']]);
            $wallet = $stmt->fetch();

            if (!$wallet) {
                $db->rollBack();
                Response::notFound('Wallet not found');
            }

            if ($wallet['is_frozen']) {
                $db->rollBack();
                Response::error('Your wallet is frozen', 403);
            }

            $currentBalance = (float) $wallet['balance'];

            if ($currentBalance < $amount) {
                $db->rollBack();
                Response::error("Insufficient balance. Current: ₹{$currentBalance}, Required: ₹{$amount}", 400);
            }

            $newBalance = $currentBalance - $amount;

            // ── Debit wallet ──
            $db->prepare("UPDATE wallets SET balance = :bal WHERE wallet_id = :id")
               ->execute([':bal' => $newBalance, ':id' => $wallet['wallet_id']]);

            // ── Record transaction ──
            $referenceId = 'PAY_' . date('Ymd') . '_' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);

            $db->prepare("
                INSERT INTO wallet_transactions 
                    (wallet_id, type, category, amount, balance_before, balance_after,
                     reference_id, stall_id, description)
                VALUES (:wallet, 'debit', 'food_purchase', :amount, :before, :after,
                        :ref, :stall, :desc)
            ")->execute([
                ':wallet' => $wallet['wallet_id'],
                ':amount' => $amount,
                ':before' => $currentBalance,
                ':after'  => $newBalance,
                ':ref'    => $referenceId,
                ':stall'  => $stall['stall_id'],
                ':desc'   => "Payment at {$stall['stall_name']}",
            ]);

            $txnId = (int) $db->lastInsertId();
            $db->commit();
        } catch (Exception $e) {
            $db->rollBack();
            Response::error('Payment failed', 500);
        }

        Response::success([
            'transaction_id' => $txnId,
            'reference_id'   => $referenceId,
            'stall_name'     => $stall['stall_name'],
            'amount_paid'    => $amount,
            'new_balance'    => $newBalance,
        ], 'Payment successful');
    }

    // ────────────────────────────────────────────────
    //  GET /api/v1/wallet/transactions
    //  Transaction history with optional filters
    // ────────────────────────────────────────────────
    public static function transactions(): void
    {
        $auth = AuthMiddleware::authenticate();
        $db   = Database::connect();

        $page    = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = min(MAX_PAGE_SIZE, max(1, (int) ($_GET['per_page'] ?? DEFAULT_PAGE_SIZE)));
        $offset  = ($page - 1) * $perPage;

        // ── Get wallet ──
        $stmt = $db->prepare("SELECT wallet_id FROM wallets WHERE user_id = :user");
        $stmt->execute([':user' => $auth['user_id']]);
        $wallet = $stmt->fetch();

        if (!$wallet) {
            Response::notFound('Wallet not found');
        }

        $where  = ["t.wallet_id = :wallet"];
        $params = [':wallet' => $wallet['wallet_id']];

        // Filter by type
        if (!empty($_GET['type']) && in_array($_GET['type'], ['credit', 'debit'])) {
            $where[]         = "t.type = :type";
            $params[':type'] = $_GET['type'];
        }

        // Filter by category
        if (!empty($_GET['category'])) {
            $where[]         = "t.category = :category";
            $params[':category'] = $_GET['category'];
        }

        $whereClause = implode(' AND ', $where);

        // Count
        $stmt = $db->prepare("SELECT COUNT(*) AS total FROM wallet_transactions t WHERE {$whereClause}");
        $stmt->execute($params);
        $total = (int) $stmt->fetch()['total'];

        // Fetch
        $stmt = $db->prepare("
            SELECT t.transaction_id, t.type, t.category, t.amount,
                   t.balance_before, t.balance_after, t.reference_id,
                   t.description, t.created_at,
                   fs.stall_name
            FROM wallet_transactions t
            LEFT JOIN food_stalls fs ON t.stall_id = fs.stall_id
            WHERE {$whereClause}
            ORDER BY t.created_at DESC
            LIMIT :limit OFFSET :offset
        ");
        foreach ($params as $k => $val) {
            $stmt->bindValue($k, $val);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
    }
}
