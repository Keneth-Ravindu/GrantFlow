# WSO2 API Manager Integration

GrantFlow exposes its Ballerina backend through WSO2 API Manager.

## API Details

- API Name: GrantFlowAPI
- Version: 1.0.0
- Context: `/grantflow`
- Backend Endpoint: `http://localhost:8080`

## Gateway Base URL

```text
https://localhost:8243/grantflow/1.0.0
```

## Managed Resources

### Available Endpoints

#### Health
```http
GET /grantflow/1.0.0/health
```

#### Resources
```http
GET /grantflow/1.0.0/resources
```

#### Access Requests
```http
GET    /grantflow/1.0.0/access-requests
POST   /grantflow/1.0.0/access-requests
POST   /grantflow/1.0.0/access-requests/{id}/approve
POST   /grantflow/1.0.0/access-requests/{id}/reject
POST   /grantflow/1.0.0/access-requests/{id}/revoke
GET    /grantflow/1.0.0/access-requests/{id}/access
```

### Verified Flow
The following flow was tested successfully through WSO2 API Manager:

```text
Create Access Request
        ↓
PENDING
        ↓
Approve Request
        ↓
ACTIVE
        ↓
Access Check
        ↓
access: true
        ↓
Automatic Expiration
```

### Request Example
```
{
  "requesterEmail": "[EMAIL_ADDRESS]",
  "resourceId": 1,
  "reason": "Testing GrantFlow through WSO2 API Manager",
  "durationMinutes": 30
}
```

### Example response:
```
{
  "message": "Access request created successfully",
  "requestId": 13,
  "status": "PENDING"
}
```

### Example approved request:

```
{
  "message": "Access request approved successfully",
  "requestId": 13,
  "status": "ACTIVE"
}
```

### Example access check:

```
{
  "requestId": 13,
  "access": true,
  "status": "ACTIVE"
}
```

### WSO2 Usage
GrantFlow uses:
- WSO2 Identity Platform for user authentication
- WSO2 application roles for frontend role-based access
- WSO2 API Manager for API publishing and gateway routing


### 3. Replace/update your `README.md`

Use this compact final version:

```markdown
# GrantFlow

Temporary access should actually be temporary.

GrantFlow is a Just-in-Time access management system for engineering teams. It allows users to request temporary access to sensitive resources while ensuring that approved access automatically expires.

## Problem

Engineering teams often grant temporary production or internal system access during incidents, deployments, or investigations.

The problem is that temporary access can easily become permanent when revocation is forgotten.

GrantFlow solves this by enforcing time-limited access.

## Core Workflow

```text
Employee
   ↓
Request Temporary Access
   ↓
PENDING
   ↓
Admin Approval
   ↓
ACTIVE
   ↓
Automatic Expiration
   ↓
EXPIRED
```

Requests can also become:

```
PENDING → REJECTED
ACTIVE → REVOKED
```

## Tech Stack
Frontend
- React
- Vite
- Axios
Backend
- Ballerina
Database
- PostgreSQL 16
- Docker
WSO2
- WSO2 Identity Platform
- WSO2 API Manager 4.7.0
Features
- User authentication through WSO2
- Authenticated user identity
- GrantFlow Admin application role
- Protected admin dashboard
- Protected resource listing
- Temporary access request creation
- Admin approval
- Admin rejection
- Active access revocation
- Automatic access expiration
- Live expiration countdown
- Access status checking
- API management through WSO2 API Manager
Protected Resources
GrantFlow currently includes:
- Production Logs
- Deployment Console
- Customer Database
- Finance Dashboard

### API Endpoints 

```
GET  /health
GET  /resources
GET  /access-requests
POST /access-requests
POST /access-requests/{id}/approve
POST /access-requests/{id}/reject
POST /access-requests/{id}/revoke
GET  /access-requests/{id}/access
```

## Architecture

React Frontend
      ↓
WSO2 Identity Platform
      ↓
WSO2 API Manager
      ↓
Ballerina Backend
      ↓
PostgreSQL

The backend runs on:
http://localhost:8080

The API Manager gateway exposes the API at:
https://localhost:8243/grantflow/1.0.0

### Request Lifecycle

```text
PENDING
├── APPROVE → ACTIVE → EXPIRED
└── REJECT  → REJECTED

ACTIVE
└── REVOKE → REVOKED
```

### Local Development

#### Start PostgreSQL
```bash
docker compose up -d
```

#### Start Backend
```bash
cd backend
bal run
```

#### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Start WSO2 API Manager
```bash
cd C:\wso2\wso2am-4.7.0
.\bin\api-manager.bat
```

#### Publisher
```
https://localhost:9443/publisher
```

#### Environment Variables
Create:
```
frontend/.env
```

with:
```
VITE_WSO2_CLIENT_ID=your_client_id
VITE_WSO2_BASE_URL=your_wso2_base_url
```

Do not commit .env.

### WSO2 Integration

GrantFlow uses WSO2 Identity Platform for:

- login
- logout
- authenticated email identity
- application role claims
- GrantFlow Admin role
GrantFlow uses WSO2 API Manager for:
- publishing the backend API
- gateway routing
- OAuth2-protected API resources
- managed API access

See:
docs/api-manager.md
docs/grantflow-openapi.yaml

### Project Status

GrantFlow is a functional learning MVP demonstrating:

- React frontend development
- Ballerina API development
- PostgreSQL integration
- Docker-based infrastructure
- identity and role integration
- API management with WSO2

### Current Limitation
The frontend currently performs role-based UI restriction, but production-grade authorization should also be enforced at the backend/API policy layer.

### Future Improvements

- Backend JWT validation
- Role-based API authorization
- Audit logs
- Email notifications
- Dockerized frontend/backend
- CI/CD pipeline
- automated API tests

## License

MIT