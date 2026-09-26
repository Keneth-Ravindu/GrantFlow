CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_requests (
    id SERIAL PRIMARY KEY,
    requester_email VARCHAR(255) NOT NULL,
    resource_id INTEGER NOT NULL REFERENCES resources(id),
    reason TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    expires_at TIMESTAMP
);

INSERT INTO resources (name, description)
SELECT 'Production Logs', 'Access to production application logs'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Production Logs'
);

INSERT INTO resources (name, description)
SELECT 'Deployment Console', 'Access to deployment management tools'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Deployment Console'
);

INSERT INTO resources (name, description)
SELECT 'Customer Database', 'Read-only access to customer data'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Customer Database'
);

INSERT INTO resources (name, description)
SELECT 'Finance Dashboard', 'Access to internal finance reports'
WHERE NOT EXISTS (
    SELECT 1 FROM resources WHERE name = 'Finance Dashboard'
);