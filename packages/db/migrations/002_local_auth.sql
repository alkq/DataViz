-- 1. Make Keycloak ID optional since we are supporting local credentials
ALTER TABLE users ALTER COLUMN keycloak_id DROP NOT NULL;

-- 2. Add the password_hash column to store hashed passwords securely
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- 3. Function to look up user credentials securely, bypassing RLS
CREATE OR REPLACE FUNCTION get_user_for_auth(p_email VARCHAR)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    password_hash VARCHAR,
    tenant_id UUID,
    role VARCHAR
) AS $$
BEGIN
    -- This function runs with the privileges of the creator (SECURITY DEFINER),
    -- allowing the login service to retrieve the hash and tenant context safely.
    RETURN QUERY 
    SELECT u.id, u.email, u.password_hash, u.tenant_id, u.role 
    FROM users u 
    WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to register a new user securely, bypassing RLS
CREATE OR REPLACE FUNCTION register_local_user(
    p_email VARCHAR,
    p_password_hash VARCHAR,
    p_tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    p_role VARCHAR DEFAULT 'viewer'
) RETURNS TABLE (
    id UUID,
    email VARCHAR,
    tenant_id UUID,
    role VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO users (email, password_hash, tenant_id, role)
    VALUES (p_email, p_password_hash, p_tenant_id, p_role)
    RETURNING users.id, users.email, users.tenant_id, users.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute privileges on these functions to your limited application role
GRANT EXECUTE ON FUNCTION get_user_for_auth(VARCHAR) TO application_role;
GRANT EXECUTE ON FUNCTION register_local_user(VARCHAR, VARCHAR, UUID, VARCHAR) TO application_role;