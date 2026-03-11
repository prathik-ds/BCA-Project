-- ============================================================
-- NexusFest — Unified College Event Management Ecosystem
-- Complete MySQL Database Schema
-- Version: 1.0
-- Date: 2026-03-11
-- Engine: InnoDB (for FK support + ACID transactions)
-- Charset: utf8mb4 (full Unicode + emoji support)
-- ============================================================

-- Create and use the database
CREATE DATABASE IF NOT EXISTS nexusfest
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nexusfest;

-- ============================================================
-- 1. COLLEGES
-- Stores participating college information.
-- Supports inter-college events by linking users to colleges.
-- ============================================================
CREATE TABLE colleges (
  college_id      INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  college_name    VARCHAR(200)    NOT NULL,
  college_code    VARCHAR(20)     NOT NULL UNIQUE,          -- Short code e.g. "MITADT", "COEP"
  university      VARCHAR(200)    DEFAULT NULL,              -- Affiliated university
  city            VARCHAR(100)    NOT NULL,
  state           VARCHAR(100)    NOT NULL,
  email_domain    VARCHAR(100)    DEFAULT NULL,              -- e.g. "mitadt.edu.in" for email verification
  logo_url        VARCHAR(500)    DEFAULT NULL,
  website         VARCHAR(300)    DEFAULT NULL,
  is_host         TINYINT(1)     NOT NULL DEFAULT 0,        -- 1 = host college
  is_verified     TINYINT(1)     NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_college_city (city),
  INDEX idx_college_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. DEPARTMENTS
-- Academic departments within colleges.
-- Used for filtering, analytics, and intra-college categorization.
-- ============================================================
CREATE TABLE departments (
  department_id   INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  college_id      INT UNSIGNED    NOT NULL,
  dept_name       VARCHAR(150)    NOT NULL,
  dept_code       VARCHAR(20)     NOT NULL,                  -- e.g. "CS", "ME", "EC"
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_dept_college (college_id, dept_code),
  CONSTRAINT fk_dept_college
    FOREIGN KEY (college_id) REFERENCES colleges(college_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. USERS
-- All platform users: participants, coordinators, admins.
-- Linked to a college and optionally a department.
-- ============================================================
CREATE TABLE users (
  user_id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  first_name      VARCHAR(100)    NOT NULL,
  last_name       VARCHAR(100)    NOT NULL,
  email           VARCHAR(255)    NOT NULL UNIQUE,
  phone           VARCHAR(15)     DEFAULT NULL,
  password_hash   VARCHAR(255)    NOT NULL,                  -- bcrypt hash
  role            ENUM('participant','coordinator','admin','super_admin')
                                  NOT NULL DEFAULT 'participant',
  college_id      INT UNSIGNED    NOT NULL,
  department_id   INT UNSIGNED    DEFAULT NULL,
  year_of_study   TINYINT UNSIGNED DEFAULT NULL,             -- 1, 2, 3, 4
  roll_number     VARCHAR(50)     DEFAULT NULL,
  profile_photo   VARCHAR(500)    DEFAULT NULL,              -- URL / path
  gender          ENUM('male','female','other','prefer_not_to_say')
                                  DEFAULT NULL,
  qr_code         VARCHAR(500)    DEFAULT NULL,              -- Personal QR code image path
  qr_token        VARCHAR(64)     DEFAULT NULL UNIQUE,       -- HMAC-signed token embedded in QR
  email_verified  TINYINT(1)     NOT NULL DEFAULT 0,
  is_active       TINYINT(1)     NOT NULL DEFAULT 1,
  last_login_at   TIMESTAMP       NULL DEFAULT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_user_college (college_id),
  INDEX idx_user_department (department_id),
  INDEX idx_user_role (role),
  INDEX idx_user_email_verified (email_verified),

  CONSTRAINT fk_user_college
    FOREIGN KEY (college_id) REFERENCES colleges(college_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_user_department
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. AUTH TOKENS
-- Stores refresh tokens for JWT-based authentication.
-- Supports multi-device login and token revocation.
-- ============================================================
CREATE TABLE auth_tokens (
  token_id        INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL,
  refresh_token   VARCHAR(512)    NOT NULL UNIQUE,
  device_info     VARCHAR(255)    DEFAULT NULL,              -- "Chrome/Win10", "Expo/Android"
  ip_address      VARCHAR(45)     DEFAULT NULL,              -- IPv4 or IPv6
  expires_at      TIMESTAMP       NOT NULL,
  is_revoked      TINYINT(1)     NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_token_user (user_id),
  INDEX idx_token_expires (expires_at),

  CONSTRAINT fk_token_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. FACE ENCODINGS
-- Stores 128-dimensional face encodings for verification.
-- One user can have multiple encodings for better accuracy.
-- ============================================================
CREATE TABLE face_encodings (
  encoding_id     INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL,
  encoding_data   BLOB            NOT NULL,                  -- Serialized 128-d float vector
  is_primary      TINYINT(1)     NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_face_user (user_id),

  CONSTRAINT fk_face_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. EVENT CATEGORIES
-- Categorizes events: Technical, Cultural, Sports, etc.
-- ============================================================
CREATE TABLE event_categories (
  category_id     INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  category_name   VARCHAR(100)    NOT NULL UNIQUE,           -- e.g. "Technical", "Cultural"
  description     TEXT            DEFAULT NULL,
  icon            VARCHAR(100)    DEFAULT NULL,              -- Icon name or URL
  display_order   INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. VENUES
-- Physical locations where events take place.
-- ============================================================
CREATE TABLE venues (
  venue_id        INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  venue_name      VARCHAR(150)    NOT NULL,
  building        VARCHAR(150)    DEFAULT NULL,
  floor_number    VARCHAR(20)     DEFAULT NULL,
  capacity        INT UNSIGNED    DEFAULT NULL,
  latitude        DECIMAL(10,7)   DEFAULT NULL,
  longitude       DECIMAL(10,7)   DEFAULT NULL,
  facilities      TEXT            DEFAULT NULL,              -- JSON or CSV of amenities
  is_active       TINYINT(1)     NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. EVENTS
-- Core event table. Supports solo, team, workshops, etc.
-- scope differentiates intra vs inter-college events.
-- ============================================================
CREATE TABLE events (
  event_id        INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  event_name      VARCHAR(200)    NOT NULL,
  slug            VARCHAR(220)    NOT NULL UNIQUE,           -- URL-friendly name
  description     TEXT            DEFAULT NULL,
  rules           TEXT            DEFAULT NULL,
  category_id     INT UNSIGNED    NOT NULL,
  venue_id        INT UNSIGNED    DEFAULT NULL,
  event_type      ENUM('solo','team','workshop','exhibition','competition','seminar')
                                  NOT NULL DEFAULT 'solo',
  scope           ENUM('intra_college','inter_college','open')
                                  NOT NULL DEFAULT 'intra_college',
  start_datetime  DATETIME        NOT NULL,
  end_datetime    DATETIME        NOT NULL,
  registration_deadline DATETIME  DEFAULT NULL,
  min_team_size   INT UNSIGNED    DEFAULT 1,
  max_team_size   INT UNSIGNED    DEFAULT 1,                 -- 1 = solo event
  max_participants INT UNSIGNED   DEFAULT NULL,              -- NULL = unlimited
  entry_fee       DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  prize_pool      DECIMAL(10,2)   DEFAULT 0.00,
  points_first    INT UNSIGNED    DEFAULT 0,                 -- Leaderboard points
  points_second   INT UNSIGNED    DEFAULT 0,
  points_third    INT UNSIGNED    DEFAULT 0,
  points_participation INT UNSIGNED DEFAULT 0,
  banner_image    VARCHAR(500)    DEFAULT NULL,
  coordinator_id  INT UNSIGNED    DEFAULT NULL,              -- Assigned coordinator
  status          ENUM('draft','published','ongoing','completed','cancelled')
                                  NOT NULL DEFAULT 'draft',
  requires_face_verification TINYINT(1) NOT NULL DEFAULT 0,
  created_by      INT UNSIGNED    NOT NULL,                  -- Admin who created
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_event_category (category_id),
  INDEX idx_event_venue (venue_id),
  INDEX idx_event_status (status),
  INDEX idx_event_scope (scope),
  INDEX idx_event_type (event_type),
  INDEX idx_event_dates (start_datetime, end_datetime),
  INDEX idx_event_coordinator (coordinator_id),

  CONSTRAINT fk_event_category
    FOREIGN KEY (category_id) REFERENCES event_categories(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_event_venue
    FOREIGN KEY (venue_id) REFERENCES venues(venue_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_event_coordinator
    FOREIGN KEY (coordinator_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_event_creator
    FOREIGN KEY (created_by) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_event_dates
    CHECK (end_datetime > start_datetime),
  CONSTRAINT chk_team_size
    CHECK (max_team_size >= min_team_size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. TEAMS
-- Teams for team-based events.
-- invite_code allows participants to join via a shared code.
-- ============================================================
CREATE TABLE teams (
  team_id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  team_name       VARCHAR(100)    NOT NULL,
  event_id        INT UNSIGNED    NOT NULL,
  leader_id       INT UNSIGNED    NOT NULL,
  invite_code     VARCHAR(20)     NOT NULL UNIQUE,           -- 8-char alphanumeric
  college_id      INT UNSIGNED    DEFAULT NULL,              -- NULL = cross-college team
  is_confirmed    TINYINT(1)     NOT NULL DEFAULT 0,         -- 1 = meets min size
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_team_event (event_id),
  INDEX idx_team_leader (leader_id),
  INDEX idx_team_college (college_id),

  CONSTRAINT fk_team_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_team_leader
    FOREIGN KEY (leader_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_team_college
    FOREIGN KEY (college_id) REFERENCES colleges(college_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. TEAM MEMBERS
-- Junction table: Users <-> Teams (many-to-many).
-- A user can be in different teams for different events.
-- ============================================================
CREATE TABLE team_members (
  member_id       INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  team_id         INT UNSIGNED    NOT NULL,
  user_id         INT UNSIGNED    NOT NULL,
  role            ENUM('leader','member') NOT NULL DEFAULT 'member',
  joined_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_team_user (team_id, user_id),               -- No duplicate memberships
  INDEX idx_member_user (user_id),

  CONSTRAINT fk_member_team
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. EVENT REGISTRATIONS
-- Tracks individual and team registrations for events.
-- Links to team_id for team events, NULL for solo.
-- ============================================================
CREATE TABLE event_registrations (
  registration_id INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL,
  event_id        INT UNSIGNED    NOT NULL,
  team_id         INT UNSIGNED    DEFAULT NULL,              -- NULL for solo events
  status          ENUM('pending','confirmed','waitlisted','cancelled','checked_in')
                                  NOT NULL DEFAULT 'pending',
  payment_status  ENUM('not_required','pending','completed','refunded','failed')
                                  NOT NULL DEFAULT 'not_required',
  payment_reference VARCHAR(100)  DEFAULT NULL,              -- Razorpay payment ID
  amount_paid     DECIMAL(10,2)   DEFAULT 0.00,
  qr_code         VARCHAR(500)    DEFAULT NULL,              -- Registration QR image path
  qr_token        VARCHAR(64)     NOT NULL UNIQUE,           -- HMAC-signed token in QR
  registered_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_user_event (user_id, event_id),              -- One registration per user per event
  INDEX idx_reg_event (event_id),
  INDEX idx_reg_team (team_id),
  INDEX idx_reg_status (status),
  INDEX idx_reg_payment (payment_status),

  CONSTRAINT fk_reg_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reg_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reg_team
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. ATTENDANCE LOGS
-- QR-code-based check-in / check-out records.
-- synced flag supports offline sync from mobile app.
-- ============================================================
CREATE TABLE attendance_logs (
  attendance_id   INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL,
  event_id        INT UNSIGNED    NOT NULL,
  registration_id INT UNSIGNED    DEFAULT NULL,
  check_type      ENUM('check_in','check_out') NOT NULL DEFAULT 'check_in',
  scanned_at      DATETIME        NOT NULL,                  -- Actual scan time (may differ from server time for offline)
  scanned_by      INT UNSIGNED    DEFAULT NULL,              -- Coordinator who scanned
  scan_method     ENUM('qr_scan','face_verify','manual') NOT NULL DEFAULT 'qr_scan',
  device_id       VARCHAR(100)    DEFAULT NULL,              -- Coordinator's device ID
  latitude        DECIMAL(10,7)   DEFAULT NULL,
  longitude       DECIMAL(10,7)   DEFAULT NULL,
  synced          TINYINT(1)     NOT NULL DEFAULT 1,         -- 0 = pending offline sync
  sync_timestamp  TIMESTAMP       NULL DEFAULT NULL,         -- When the offline record was synced
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_attend_user (user_id),
  INDEX idx_attend_event (event_id),
  INDEX idx_attend_reg (registration_id),
  INDEX idx_attend_scanned_by (scanned_by),
  INDEX idx_attend_synced (synced),
  INDEX idx_attend_time (scanned_at),

  CONSTRAINT fk_attend_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attend_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_attend_reg
    FOREIGN KEY (registration_id) REFERENCES event_registrations(registration_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_attend_scanner
    FOREIGN KEY (scanned_by) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. FOOD STALLS
-- Registered food/merch stalls for digital wallet payments.
-- ============================================================
CREATE TABLE food_stalls (
  stall_id        INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  stall_name      VARCHAR(150)    NOT NULL,
  stall_code      VARCHAR(20)     NOT NULL UNIQUE,           -- e.g. "STALL_007"
  owner_name      VARCHAR(150)    NOT NULL,
  owner_phone     VARCHAR(15)     DEFAULT NULL,
  description     TEXT            DEFAULT NULL,
  location        VARCHAR(200)    DEFAULT NULL,              -- Physical location on campus
  qr_code         VARCHAR(500)    DEFAULT NULL,              -- Payment QR image path
  qr_token        VARCHAR(64)     NOT NULL UNIQUE,           -- HMAC-signed payment token
  is_active       TINYINT(1)     NOT NULL DEFAULT 1,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 14. WALLETS
-- Digital wallet for each user. One wallet per user.
-- Balance is maintained via transactions (double-entry style).
-- ============================================================
CREATE TABLE wallets (
  wallet_id       INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL UNIQUE,           -- One wallet per user
  balance         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  is_frozen       TINYINT(1)     NOT NULL DEFAULT 0,         -- Admin can freeze wallet
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_wallet_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_wallet_balance
    CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 15. WALLET TRANSACTIONS
-- Every credit/debit to a wallet is recorded here.
-- Supports top-ups, food payments, event fees, and refunds.
-- ============================================================
CREATE TABLE wallet_transactions (
  transaction_id  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  wallet_id       INT UNSIGNED    NOT NULL,
  type            ENUM('credit','debit') NOT NULL,
  category        ENUM('topup','food_purchase','event_fee','refund','prize_credit','admin_adjustment')
                                  NOT NULL,
  amount          DECIMAL(10,2)   NOT NULL,
  balance_before  DECIMAL(10,2)   NOT NULL,                  -- Snapshot for audit
  balance_after   DECIMAL(10,2)   NOT NULL,                  -- Snapshot for audit
  reference_id    VARCHAR(100)    DEFAULT NULL,              -- Razorpay ID / internal ref
  stall_id        INT UNSIGNED    DEFAULT NULL,              -- For food purchases
  event_id        INT UNSIGNED    DEFAULT NULL,              -- For event fee payments
  description     VARCHAR(255)    DEFAULT NULL,
  initiated_by    INT UNSIGNED    DEFAULT NULL,              -- Admin who initiated (for refunds/adjustments)
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_txn_wallet (wallet_id),
  INDEX idx_txn_type (type),
  INDEX idx_txn_category (category),
  INDEX idx_txn_stall (stall_id),
  INDEX idx_txn_event (event_id),
  INDEX idx_txn_date (created_at),

  CONSTRAINT fk_txn_wallet
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_txn_stall
    FOREIGN KEY (stall_id) REFERENCES food_stalls(stall_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_txn_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_txn_initiator
    FOREIGN KEY (initiated_by) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_txn_amount
    CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 16. EVENT RESULTS
-- Stores winners and rankings per event.
-- Links to users/teams for leaderboard calculation.
-- ============================================================
CREATE TABLE event_results (
  result_id       INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  event_id        INT UNSIGNED    NOT NULL,
  user_id         INT UNSIGNED    DEFAULT NULL,              -- For solo events
  team_id         INT UNSIGNED    DEFAULT NULL,              -- For team events
  position        ENUM('first','second','third','runner_up','participation','disqualified')
                                  NOT NULL,
  score           DECIMAL(10,2)   DEFAULT NULL,              -- Raw score if applicable
  points_awarded  INT UNSIGNED    NOT NULL DEFAULT 0,        -- Leaderboard points awarded
  remarks         VARCHAR(255)    DEFAULT NULL,
  declared_by     INT UNSIGNED    NOT NULL,                  -- Admin/coordinator who declared
  declared_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_result_event (event_id),
  INDEX idx_result_user (user_id),
  INDEX idx_result_team (team_id),
  INDEX idx_result_position (position),

  CONSTRAINT fk_result_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_result_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_result_team
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_result_declarer
    FOREIGN KEY (declared_by) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 17. LEADERBOARD
-- Aggregated points per college and per user.
-- Updated via triggers or application logic after results.
-- ============================================================
CREATE TABLE leaderboard (
  leaderboard_id  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  college_id      INT UNSIGNED    NOT NULL,
  user_id         INT UNSIGNED    DEFAULT NULL,              -- NULL = college aggregate
  category_id     INT UNSIGNED    DEFAULT NULL,              -- NULL = overall
  total_points    INT UNSIGNED    NOT NULL DEFAULT 0,
  events_won      INT UNSIGNED    NOT NULL DEFAULT 0,
  events_participated INT UNSIGNED NOT NULL DEFAULT 0,
  rank_position   INT UNSIGNED    DEFAULT NULL,              -- Computed rank
  last_updated    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_board_college_user_cat (college_id, user_id, category_id),
  INDEX idx_board_points (total_points DESC),
  INDEX idx_board_category (category_id),

  CONSTRAINT fk_board_college
    FOREIGN KEY (college_id) REFERENCES colleges(college_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_board_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_board_category
    FOREIGN KEY (category_id) REFERENCES event_categories(category_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 18. CERTIFICATES
-- Auto-generated certificates for participants and winners.
-- verification_code allows public authenticity checks.
-- ============================================================
CREATE TABLE certificates (
  certificate_id  INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL,
  event_id        INT UNSIGNED    NOT NULL,
  result_id       INT UNSIGNED    DEFAULT NULL,              -- Links to the result if winner cert
  cert_type       ENUM('participation','winner_first','winner_second','winner_third',
                       'volunteer','organizer','coordinator','merit')
                                  NOT NULL DEFAULT 'participation',
  verification_code VARCHAR(50)   NOT NULL UNIQUE,           -- e.g. "NF-CERT-2026-00042"
  file_path       VARCHAR(500)    DEFAULT NULL,              -- Path to generated PDF
  template_used   VARCHAR(100)    DEFAULT NULL,              -- Template name
  issued_date     DATE            NOT NULL,
  download_count  INT UNSIGNED    NOT NULL DEFAULT 0,
  is_revoked      TINYINT(1)     NOT NULL DEFAULT 0,
  generated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_cert_user (user_id),
  INDEX idx_cert_event (event_id),
  INDEX idx_cert_type (cert_type),
  INDEX idx_cert_verify (verification_code),

  CONSTRAINT fk_cert_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cert_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cert_result
    FOREIGN KEY (result_id) REFERENCES event_results(result_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 19. ANNOUNCEMENTS
-- Broadcast messages from admins/coordinators.
-- Can be targeted to specific events, colleges, or global.
-- ============================================================
CREATE TABLE announcements (
  announcement_id INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200)    NOT NULL,
  message         TEXT            NOT NULL,
  priority        ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  target_type     ENUM('global','event','college','department','role')
                                  NOT NULL DEFAULT 'global',
  target_id       INT UNSIGNED    DEFAULT NULL,              -- event_id / college_id / department_id based on target_type
  target_role     ENUM('participant','coordinator','admin') DEFAULT NULL,  -- If target_type = 'role'
  event_id        INT UNSIGNED    DEFAULT NULL,              -- Related event (optional)
  attachment_url  VARCHAR(500)    DEFAULT NULL,
  is_pinned       TINYINT(1)     NOT NULL DEFAULT 0,
  published_at    TIMESTAMP       NULL DEFAULT NULL,         -- NULL = draft
  expires_at      TIMESTAMP       NULL DEFAULT NULL,
  created_by      INT UNSIGNED    NOT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_announce_priority (priority),
  INDEX idx_announce_target (target_type, target_id),
  INDEX idx_announce_event (event_id),
  INDEX idx_announce_published (published_at),
  INDEX idx_announce_creator (created_by),

  CONSTRAINT fk_announce_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_announce_creator
    FOREIGN KEY (created_by) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 20. NOTIFICATIONS
-- Per-user notification inbox.
-- Supports read/unread state and multiple delivery channels.
-- ============================================================
CREATE TABLE notifications (
  notification_id INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL,
  title           VARCHAR(200)    NOT NULL,
  message         TEXT            NOT NULL,
  type            ENUM('registration','attendance','wallet','result','certificate',
                       'announcement','emergency','team','hunt','system')
                                  NOT NULL DEFAULT 'system',
  reference_type  VARCHAR(50)     DEFAULT NULL,              -- e.g. "event", "team", "certificate"
  reference_id    INT UNSIGNED    DEFAULT NULL,              -- ID of the referenced entity
  channel         ENUM('in_app','push','email','sms') NOT NULL DEFAULT 'in_app',
  is_read         TINYINT(1)     NOT NULL DEFAULT 0,
  read_at         TIMESTAMP       NULL DEFAULT NULL,
  delivered_at    TIMESTAMP       NULL DEFAULT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notif_user (user_id),
  INDEX idx_notif_type (type),
  INDEX idx_notif_read (is_read),
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_created (created_at),

  CONSTRAINT fk_notif_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 21. SCAVENGER HUNTS
-- Defines scavenger hunt campaigns with metadata.
-- ============================================================
CREATE TABLE scavenger_hunts (
  hunt_id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  hunt_name       VARCHAR(200)    NOT NULL,
  description     TEXT            DEFAULT NULL,
  max_teams       INT UNSIGNED    DEFAULT NULL,
  min_team_size   INT UNSIGNED    NOT NULL DEFAULT 1,
  max_team_size   INT UNSIGNED    NOT NULL DEFAULT 5,
  start_datetime  DATETIME        NOT NULL,
  end_datetime    DATETIME        NOT NULL,
  total_checkpoints INT UNSIGNED  NOT NULL DEFAULT 0,
  points_per_checkpoint INT UNSIGNED NOT NULL DEFAULT 10,
  bonus_points_completion INT UNSIGNED NOT NULL DEFAULT 50,  -- Bonus for finishing all
  status          ENUM('draft','active','paused','completed','cancelled')
                                  NOT NULL DEFAULT 'draft',
  created_by      INT UNSIGNED    NOT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_hunt_status (status),
  INDEX idx_hunt_dates (start_datetime, end_datetime),

  CONSTRAINT fk_hunt_creator
    FOREIGN KEY (created_by) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_hunt_dates
    CHECK (end_datetime > start_datetime),
  CONSTRAINT chk_hunt_team_size
    CHECK (max_team_size >= min_team_size)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 22. HUNT CHECKPOINTS
-- QR-coded physical locations for scavenger hunts.
-- sequence_order defines the clue chain order.
-- ============================================================
CREATE TABLE hunt_checkpoints (
  checkpoint_id   INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  hunt_id         INT UNSIGNED    NOT NULL,
  sequence_order  INT UNSIGNED    NOT NULL,                  -- 1, 2, 3... order of clues
  clue_text       TEXT            NOT NULL,                  -- The clue shown to participants
  hint_text       TEXT            DEFAULT NULL,              -- Optional hint (shown after delay)
  answer_text     VARCHAR(255)    DEFAULT NULL,              -- Expected answer if text-based
  qr_code         VARCHAR(500)    DEFAULT NULL,              -- QR image path at physical location
  qr_token        VARCHAR(64)     NOT NULL UNIQUE,           -- Token embedded in QR
  location_name   VARCHAR(200)    DEFAULT NULL,              -- Human-readable location
  latitude        DECIMAL(10,7)   DEFAULT NULL,
  longitude       DECIMAL(10,7)   DEFAULT NULL,
  geofence_radius_m INT UNSIGNED  DEFAULT 50,                -- Meters for GPS validation
  points          INT UNSIGNED    NOT NULL DEFAULT 10,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_hunt_sequence (hunt_id, sequence_order),
  INDEX idx_checkpoint_hunt (hunt_id),

  CONSTRAINT fk_checkpoint_hunt
    FOREIGN KEY (hunt_id) REFERENCES scavenger_hunts(hunt_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 23. HUNT TEAMS
-- Teams participating in scavenger hunts.
-- Separate from event teams as hunts are standalone.
-- ============================================================
CREATE TABLE hunt_teams (
  hunt_team_id    INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  hunt_id         INT UNSIGNED    NOT NULL,
  team_name       VARCHAR(100)    NOT NULL,
  leader_id       INT UNSIGNED    NOT NULL,
  invite_code     VARCHAR(20)     NOT NULL UNIQUE,
  status          ENUM('registered','active','completed','disqualified')
                                  NOT NULL DEFAULT 'registered',
  started_at      TIMESTAMP       NULL DEFAULT NULL,
  completed_at    TIMESTAMP       NULL DEFAULT NULL,
  total_points    INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_hteam_hunt (hunt_id),
  INDEX idx_hteam_leader (leader_id),
  INDEX idx_hteam_points (total_points DESC),

  CONSTRAINT fk_hteam_hunt
    FOREIGN KEY (hunt_id) REFERENCES scavenger_hunts(hunt_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hteam_leader
    FOREIGN KEY (leader_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 24. HUNT TEAM MEMBERS
-- Members of scavenger hunt teams.
-- ============================================================
CREATE TABLE hunt_team_members (
  id              INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  hunt_team_id    INT UNSIGNED    NOT NULL,
  user_id         INT UNSIGNED    NOT NULL,
  joined_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uk_hteam_user (hunt_team_id, user_id),
  INDEX idx_htmember_user (user_id),

  CONSTRAINT fk_htmember_team
    FOREIGN KEY (hunt_team_id) REFERENCES hunt_teams(hunt_team_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_htmember_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 25. HUNT PROGRESS
-- Tracks each team's progress through checkpoints.
-- Records scan time for leaderboard ranking by speed.
-- ============================================================
CREATE TABLE hunt_progress (
  progress_id     INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  hunt_id         INT UNSIGNED    NOT NULL,
  hunt_team_id    INT UNSIGNED    NOT NULL,
  checkpoint_id   INT UNSIGNED    NOT NULL,
  scanned_by      INT UNSIGNED    NOT NULL,                  -- Team member who scanned
  scanned_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  points_earned   INT UNSIGNED    NOT NULL DEFAULT 0,
  latitude        DECIMAL(10,7)   DEFAULT NULL,              -- GPS at time of scan
  longitude       DECIMAL(10,7)   DEFAULT NULL,
  is_valid        TINYINT(1)     NOT NULL DEFAULT 1,         -- 0 if geofence failed

  UNIQUE KEY uk_team_checkpoint (hunt_team_id, checkpoint_id), -- Can't scan same checkpoint twice
  INDEX idx_progress_hunt (hunt_id),
  INDEX idx_progress_team (hunt_team_id),
  INDEX idx_progress_checkpoint (checkpoint_id),
  INDEX idx_progress_time (scanned_at),

  CONSTRAINT fk_progress_hunt
    FOREIGN KEY (hunt_id) REFERENCES scavenger_hunts(hunt_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_progress_team
    FOREIGN KEY (hunt_team_id) REFERENCES hunt_teams(hunt_team_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_progress_checkpoint
    FOREIGN KEY (checkpoint_id) REFERENCES hunt_checkpoints(checkpoint_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_progress_scanner
    FOREIGN KEY (scanned_by) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 26. EMERGENCIES
-- Panic button reports with GPS and escalation tracking.
-- ============================================================
CREATE TABLE emergencies (
  emergency_id    INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  reporter_id     INT UNSIGNED    NOT NULL,
  alert_type      ENUM('medical','security','fire','crowd_control','technical','other')
                                  NOT NULL,
  severity        ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  message         TEXT            NOT NULL,
  latitude        DECIMAL(10,7)   DEFAULT NULL,
  longitude       DECIMAL(10,7)   DEFAULT NULL,
  location_desc   VARCHAR(255)    DEFAULT NULL,              -- "Near Stage 2, Main Ground"
  photo_url       VARCHAR(500)    DEFAULT NULL,              -- Optional photo evidence
  status          ENUM('reported','acknowledged','responding','resolved','false_alarm')
                                  NOT NULL DEFAULT 'reported',
  responded_by    INT UNSIGNED    DEFAULT NULL,              -- Admin/coordinator who responded
  responded_at    TIMESTAMP       NULL DEFAULT NULL,
  resolved_by     INT UNSIGNED    DEFAULT NULL,
  resolved_at     TIMESTAMP       NULL DEFAULT NULL,
  resolution_note TEXT            DEFAULT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_emergency_reporter (reporter_id),
  INDEX idx_emergency_status (status),
  INDEX idx_emergency_severity (severity),
  INDEX idx_emergency_type (alert_type),
  INDEX idx_emergency_created (created_at),

  CONSTRAINT fk_emergency_reporter
    FOREIGN KEY (reporter_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_emergency_responder
    FOREIGN KEY (responded_by) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_emergency_resolver
    FOREIGN KEY (resolved_by) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 27. OFFLINE SYNC LOG
-- Audit trail for data synced from coordinator mobile app.
-- Tracks conflicts and resolution for accountability.
-- ============================================================
CREATE TABLE offline_sync_log (
  sync_id         INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    NOT NULL,                  -- Coordinator who synced
  device_id       VARCHAR(100)    NOT NULL,
  sync_type       ENUM('attendance','wallet_txn','hunt_scan','emergency')
                                  NOT NULL,
  records_sent    INT UNSIGNED    NOT NULL DEFAULT 0,
  records_accepted INT UNSIGNED   NOT NULL DEFAULT 0,
  records_rejected INT UNSIGNED   NOT NULL DEFAULT 0,
  conflicts_found INT UNSIGNED    NOT NULL DEFAULT 0,
  conflict_details JSON           DEFAULT NULL,              -- Details of rejected/conflicted records
  synced_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_sync_user (user_id),
  INDEX idx_sync_type (sync_type),
  INDEX idx_sync_date (synced_at),

  CONSTRAINT fk_sync_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 28. ACTIVITY LOG (AUDIT TRAIL)
-- Logs important system actions for security auditing.
-- ============================================================
CREATE TABLE activity_log (
  log_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED    DEFAULT NULL,              -- NULL for system actions
  action          VARCHAR(100)    NOT NULL,                   -- e.g. "event.create", "wallet.refund"
  entity_type     VARCHAR(50)     NOT NULL,                   -- e.g. "event", "user", "wallet"
  entity_id       INT UNSIGNED    DEFAULT NULL,
  old_values      JSON            DEFAULT NULL,               -- Previous state (for updates)
  new_values      JSON            DEFAULT NULL,               -- New state (for creates/updates)
  ip_address      VARCHAR(45)     DEFAULT NULL,
  user_agent      VARCHAR(500)    DEFAULT NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_log_user (user_id),
  INDEX idx_log_action (action),
  INDEX idx_log_entity (entity_type, entity_id),
  INDEX idx_log_created (created_at),

  CONSTRAINT fk_log_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 29. SYSTEM SETTINGS
-- Key-value config store for runtime settings.
-- ============================================================
CREATE TABLE system_settings (
  setting_id      INT UNSIGNED    AUTO_INCREMENT PRIMARY KEY,
  setting_key     VARCHAR(100)    NOT NULL UNIQUE,
  setting_value   TEXT            NOT NULL,
  description     VARCHAR(255)    DEFAULT NULL,
  data_type       ENUM('string','integer','boolean','json','decimal')
                                  NOT NULL DEFAULT 'string',
  is_public       TINYINT(1)     NOT NULL DEFAULT 0,         -- 1 = readable by any client
  updated_by      INT UNSIGNED    DEFAULT NULL,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_setting_updater
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

-- Default event categories
INSERT INTO event_categories (category_name, description, display_order) VALUES
  ('Technical',   'Coding, hackathons, robotics, and tech events',    1),
  ('Cultural',    'Dance, music, drama, and art events',              2),
  ('Sports',      'Indoor and outdoor sports competitions',           3),
  ('Literary',    'Debates, quizzes, essay writing, and poetry',      4),
  ('Gaming',      'E-sports and gaming tournaments',                  5),
  ('Workshop',    'Hands-on learning sessions and bootcamps',         6),
  ('Exhibition',  'Project showcases and poster presentations',       7),
  ('General',     'Miscellaneous and fun events',                     8);

-- Default system settings
INSERT INTO system_settings (setting_key, setting_value, description, data_type, is_public) VALUES
  ('fest_name',             'NexusFest 2026',       'Name of the current fest',                 'string',  1),
  ('fest_tagline',          'Where Innovation Meets Celebration', 'Fest tagline',                'string',  1),
  ('fest_start_date',       '2026-04-15',            'Fest start date',                         'string',  1),
  ('fest_end_date',         '2026-04-17',            'Fest end date',                           'string',  1),
  ('registration_open',     'true',                  'Whether registration is currently open',   'boolean', 1),
  ('wallet_enabled',        'true',                  'Whether digital wallet is active',        'boolean', 1),
  ('wallet_max_balance',    '5000.00',               'Maximum wallet balance allowed',          'decimal', 0),
  ('wallet_min_topup',      '50.00',                 'Minimum top-up amount',                   'decimal', 0),
  ('face_verify_enabled',   'true',                  'Whether face verification is active',     'boolean', 0),
  ('face_verify_threshold', '0.6',                   'Face match distance threshold',           'decimal', 0),
  ('qr_hmac_secret',        'CHANGE_THIS_SECRET',    'HMAC secret for QR code signing',         'string',  0),
  ('emergency_sms_numbers', '+919999999999',          'Comma-separated emergency contact numbers', 'string', 0),
  ('max_events_per_user',   '10',                    'Max events a user can register for',      'integer', 0),
  ('certificate_prefix',    'NF-CERT-2026',          'Prefix for certificate verification codes','string', 0);


-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View: Event registration count with capacity
CREATE OR REPLACE VIEW vw_event_registration_stats AS
SELECT
  e.event_id,
  e.event_name,
  e.max_participants,
  COUNT(r.registration_id)                                              AS registered_count,
  COALESCE(e.max_participants, 0) - COUNT(r.registration_id)           AS spots_remaining,
  SUM(CASE WHEN r.status = 'confirmed' THEN 1 ELSE 0 END)             AS confirmed_count,
  SUM(CASE WHEN r.status = 'waitlisted' THEN 1 ELSE 0 END)            AS waitlisted_count,
  SUM(CASE WHEN r.status = 'cancelled' THEN 1 ELSE 0 END)             AS cancelled_count
FROM events e
LEFT JOIN event_registrations r ON e.event_id = r.event_id AND r.status != 'cancelled'
GROUP BY e.event_id, e.event_name, e.max_participants;


-- View: Inter-college leaderboard
CREATE OR REPLACE VIEW vw_college_leaderboard AS
SELECT
  c.college_id,
  c.college_name,
  c.college_code,
  c.city,
  COALESCE(lb.total_points, 0)            AS total_points,
  COALESCE(lb.events_won, 0)              AS events_won,
  COALESCE(lb.events_participated, 0)     AS events_participated,
  RANK() OVER (ORDER BY COALESCE(lb.total_points, 0) DESC) AS rank_position
FROM colleges c
LEFT JOIN leaderboard lb ON c.college_id = lb.college_id AND lb.user_id IS NULL AND lb.category_id IS NULL
WHERE c.is_verified = 1
ORDER BY total_points DESC;


-- View: Attendance summary per event
CREATE OR REPLACE VIEW vw_event_attendance_summary AS
SELECT
  e.event_id,
  e.event_name,
  COUNT(DISTINCT CASE WHEN a.check_type = 'check_in' THEN a.user_id END)  AS checked_in,
  COUNT(DISTINCT CASE WHEN a.check_type = 'check_out' THEN a.user_id END) AS checked_out,
  (SELECT COUNT(*) FROM event_registrations r2
   WHERE r2.event_id = e.event_id AND r2.status = 'confirmed')            AS total_registered
FROM events e
LEFT JOIN attendance_logs a ON e.event_id = a.event_id
GROUP BY e.event_id, e.event_name;


-- View: Wallet balance overview (admin)
CREATE OR REPLACE VIEW vw_wallet_overview AS
SELECT
  u.user_id,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  u.email,
  c.college_name,
  w.balance,
  w.is_frozen,
  (SELECT COUNT(*) FROM wallet_transactions t WHERE t.wallet_id = w.wallet_id) AS total_transactions,
  (SELECT COALESCE(SUM(t.amount), 0) FROM wallet_transactions t
   WHERE t.wallet_id = w.wallet_id AND t.type = 'credit')                     AS total_credits,
  (SELECT COALESCE(SUM(t.amount), 0) FROM wallet_transactions t
   WHERE t.wallet_id = w.wallet_id AND t.type = 'debit')                      AS total_debits
FROM wallets w
JOIN users u ON w.user_id = u.user_id
JOIN colleges c ON u.college_id = c.college_id;


-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Auto-create wallet when new user is inserted
DELIMITER //
CREATE TRIGGER trg_user_after_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO wallets (user_id, balance) VALUES (NEW.user_id, 0.00);
END//
DELIMITER ;


-- Trigger: Update hunt total_checkpoints when checkpoint added
DELIMITER //
CREATE TRIGGER trg_checkpoint_after_insert
AFTER INSERT ON hunt_checkpoints
FOR EACH ROW
BEGIN
  UPDATE scavenger_hunts
  SET total_checkpoints = (
    SELECT COUNT(*) FROM hunt_checkpoints WHERE hunt_id = NEW.hunt_id
  )
  WHERE hunt_id = NEW.hunt_id;
END//
DELIMITER ;


-- Trigger: Update hunt total_checkpoints when checkpoint deleted
DELIMITER //
CREATE TRIGGER trg_checkpoint_after_delete
AFTER DELETE ON hunt_checkpoints
FOR EACH ROW
BEGIN
  UPDATE scavenger_hunts
  SET total_checkpoints = (
    SELECT COUNT(*) FROM hunt_checkpoints WHERE hunt_id = OLD.hunt_id
  )
  WHERE hunt_id = OLD.hunt_id;
END//
DELIMITER ;


-- Trigger: Update hunt_team total_points when progress recorded
DELIMITER //
CREATE TRIGGER trg_progress_after_insert
AFTER INSERT ON hunt_progress
FOR EACH ROW
BEGIN
  UPDATE hunt_teams
  SET total_points = (
    SELECT COALESCE(SUM(points_earned), 0)
    FROM hunt_progress
    WHERE hunt_team_id = NEW.hunt_team_id AND is_valid = 1
  )
  WHERE hunt_team_id = NEW.hunt_team_id;
END//
DELIMITER ;


-- ============================================================
-- INDEXES FOR PERFORMANCE
-- (Additional composite indexes for common query patterns)
-- ============================================================

-- Fast lookup: "all events for a user" (via registrations)
CREATE INDEX idx_reg_user_status ON event_registrations(user_id, status);

-- Fast lookup: "today's events"
CREATE INDEX idx_event_start_status ON events(start_datetime, status);

-- Fast lookup: "unread notifications for user"
CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read, created_at);

-- Fast lookup: "transactions for a date range"
CREATE INDEX idx_txn_wallet_date ON wallet_transactions(wallet_id, created_at);

-- Fast lookup: "attendance for today by event"
CREATE INDEX idx_attend_event_date ON attendance_logs(event_id, scanned_at);


-- ============================================================
-- END OF SCHEMA
-- ============================================================
-- Total Tables : 29
-- Total Views  : 4
-- Total Triggers: 4
--
-- To import:
--   mysql -u root -p < nexusfest_schema.sql
--
-- To reset (CAUTION - drops all data):
--   DROP DATABASE IF EXISTS nexusfest;
--   SOURCE nexusfest_schema.sql;
-- ============================================================
