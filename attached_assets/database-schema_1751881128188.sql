-- Enhanced ContentScale Database Schema
-- This file contains the updated database schema for improved credit management and messaging

-- Users table with enhanced credit tracking
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 0,
    is_new_subscriber BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    total_credits_earned INTEGER DEFAULT 0,
    total_credits_spent INTEGER DEFAULT 0,
    subscription_status VARCHAR(50) DEFAULT 'free',
    profile_data JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- Credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    credits INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'grant', 'spend', 'refund', 'bonus'
    reason TEXT,
    admin_email VARCHAR(255),
    is_new_subscriber_bonus BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

-- Messages table for unified messaging system
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'incoming', 'outgoing', 'internal'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_message_id INTEGER,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Conversations table for grouping messages
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    participant_email VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'closed', 'archived'
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(participant_email, admin_email)
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id SERIAL PRIMARY KEY,
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_user_email VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_new_subscriber ON users(is_new_subscriber);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_email ON credit_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_messages_from_email ON messages(from_email);
CREATE INDEX IF NOT EXISTS idx_messages_to_email ON messages(to_email);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_conversations_participant ON conversations(participant_email);
CREATE INDEX IF NOT EXISTS idx_conversations_admin ON conversations(admin_email);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_email ON admin_activity_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at);

-- Triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update conversation when message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or create conversation
    INSERT INTO conversations (participant_email, admin_email, last_message_at, unread_count)
    VALUES (
        CASE 
            WHEN NEW.message_type = 'incoming' THEN NEW.from_email
            ELSE NEW.to_email
        END,
        CASE 
            WHEN NEW.message_type = 'incoming' THEN NEW.to_email
            ELSE NEW.from_email
        END,
        NEW.created_at,
        CASE WHEN NEW.message_type = 'incoming' AND NOT NEW.is_read THEN 1 ELSE 0 END
    )
    ON CONFLICT (participant_email, admin_email) 
    DO UPDATE SET 
        last_message_at = NEW.created_at,
        unread_count = conversations.unread_count + 
            CASE WHEN NEW.message_type = 'incoming' AND NOT NEW.is_read THEN 1 ELSE 0 END,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Function to update conversation unread count when message is marked as read
CREATE OR REPLACE FUNCTION update_conversation_on_read()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_read = false AND NEW.is_read = true AND NEW.message_type = 'incoming' THEN
        UPDATE conversations 
        SET unread_count = GREATEST(0, unread_count - 1),
            updated_at = CURRENT_TIMESTAMP
        WHERE participant_email = NEW.from_email;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_conversation_on_read
    AFTER UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_on_read();

-- Function to update user credit totals
CREATE OR REPLACE FUNCTION update_user_credit_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type IN ('grant', 'bonus', 'refund') THEN
        UPDATE users 
        SET total_credits_earned = total_credits_earned + NEW.credits,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = NEW.user_email;
    ELSIF NEW.transaction_type = 'spend' THEN
        UPDATE users 
        SET total_credits_spent = total_credits_spent + NEW.credits,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = NEW.user_email;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_user_credit_totals
    AFTER INSERT ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_credit_totals();

-- Views for easier querying
CREATE OR REPLACE VIEW user_credit_summary AS
SELECT 
    u.email,
    u.credits as current_credits,
    u.total_credits_earned,
    u.total_credits_spent,
    u.is_new_subscriber,
    u.subscription_status,
    u.created_at as user_since,
    u.last_login,
    COUNT(ct.id) as total_transactions,
    COALESCE(SUM(CASE WHEN ct.transaction_type IN ('grant', 'bonus', 'refund') THEN ct.credits ELSE 0 END), 0) as total_earned_from_transactions,
    COALESCE(SUM(CASE WHEN ct.transaction_type = 'spend' THEN ct.credits ELSE 0 END), 0) as total_spent_from_transactions
FROM users u
LEFT JOIN credit_transactions ct ON u.email = ct.user_email
GROUP BY u.email, u.credits, u.total_credits_earned, u.total_credits_spent, u.is_new_subscriber, u.subscription_status, u.created_at, u.last_login;

CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
    c.id,
    c.participant_email,
    c.admin_email,
    c.status,
    c.unread_count,
    c.last_message_at,
    c.created_at,
    (SELECT content FROM messages m 
     WHERE (m.from_email = c.participant_email OR m.to_email = c.participant_email)
     ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
    (SELECT COUNT(*) FROM messages m 
     WHERE (m.from_email = c.participant_email OR m.to_email = c.participant_email)) as total_messages
FROM conversations c;

-- Sample data for testing (optional)
-- INSERT INTO users (email, credits, is_new_subscriber) VALUES 
-- ('test@example.com', 50, true),
-- ('user@contentscale.com', 100, false),
-- ('newuser@test.com', 0, true);

-- INSERT INTO messages (from_email, to_email, content, message_type) VALUES
-- ('test@example.com', 'admin@contentscale.com', 'Hello, I need help with my account', 'incoming'),
-- ('admin@contentscale.com', 'test@example.com', 'Hi! I''d be happy to help you with your account. What specific issue are you experiencing?', 'outgoing'),
-- ('user@contentscale.com', 'admin@contentscale.com', 'Can I get more credits?', 'incoming');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;

