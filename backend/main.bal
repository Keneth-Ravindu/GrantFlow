import ballerina/http;
import ballerina/sql;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

postgresql:Client dbClient = check new (
    host = "localhost",
    username = "grantflow_user",
    password = "grantflow_password",
    database = "grantflow_db",
    port = 5432
);

type Resource record {
    int id;
    string name;
    string description;
};

type AccessRequestInput record {
    string requesterEmail;
    int resourceId;
    string reason;
    int durationMinutes;
};

type AccessRequest record {
    int id;
    string requesterEmail;
    int resourceId;
    string reason;
    int durationMinutes;
    string status;
    string requestedAt;
    string? approvedAt;
    string? expiresAt;
};

type ApprovalLookup record {|
    int id;
    string status;
    int duration_minutes;
|};

type ApprovedRequest record {|
    int id;
    string status;
    string approved_at;
    string expires_at;
|};

type AccessCheck record {|
    int id;
    string status;
    string? expires_at;
|};

function expireOldRequests() returns error? {
    _ = check dbClient->execute(
        `UPDATE access_requests
         SET status = 'EXPIRED'
         WHERE status = 'ACTIVE'
           AND expires_at IS NOT NULL
           AND expires_at <= CURRENT_TIMESTAMP`
    );
}

service / on new http:Listener(8080) {

    resource function get health() returns json {
        return {
            status: "healthy",
            serviceName: "grantflow-api"
        };
    }

    resource function get resources() returns Resource[]|error {
        stream<Resource, sql:Error?> resourceStream =
            dbClient->query(
                `SELECT id, name, description
                 FROM resources
                 ORDER BY id`
            );

        Resource[] resourceList = [];

        check from Resource resourceItem in resourceStream
            do {
                resourceList.push(resourceItem);
            };

        return resourceList;
    }

    resource function post access\-requests(
            @http:Payload AccessRequestInput request
    ) returns http:Response|error {

        http:Response response = new;

        if request.requesterEmail.trim().length() == 0 {
            response.statusCode = 400;

            response.setJsonPayload({
                message: "Requester email is required"
            });

            return response;
        }

        if request.reason.trim().length() == 0 {
            response.statusCode = 400;

            response.setJsonPayload({
                message: "Reason is required"
            });

            return response;
        }

        if request.durationMinutes <= 0 {
            response.statusCode = 400;

            response.setJsonPayload({
                message: "Duration must be greater than zero"
            });

            return response;
        }

        if request.durationMinutes > 480 {
            response.statusCode = 400;

            response.setJsonPayload({
                message: "Duration cannot exceed 480 minutes"
            });

            return response;
        }

        sql:ExecutionResult result = check dbClient->execute(
            `INSERT INTO access_requests
            (
                requester_email,
                resource_id,
                reason,
                duration_minutes,
                status
            )
            VALUES
            (
                ${request.requesterEmail},
                ${request.resourceId},
                ${request.reason},
                ${request.durationMinutes},
                'PENDING'
            )`
        );

        response.statusCode = 201;

        response.setJsonPayload({
            message: "Access request created successfully",
            requestId: result.lastInsertId,
            status: "PENDING"
        });

        return response;
    }

    resource function get access\-requests() returns AccessRequest[]|error {

        check expireOldRequests();

        stream<record {|
            int id;
            string requester_email;
            int resource_id;
            string reason;
            int duration_minutes;
            string status;
            string requested_at;
            string? approved_at;
            string? expires_at;
        |}, sql:Error?> requestStream =
            dbClient->query(
                `SELECT
                    id,
                    requester_email,
                    resource_id,
                    reason,
                    duration_minutes,
                    status,
                    requested_at::text,
                    approved_at::text,
                    expires_at::text
                 FROM access_requests
                 ORDER BY requested_at DESC`
            );

        AccessRequest[] requestList = [];

        check from var requestItem in requestStream
            do {
                requestList.push({
                    id: requestItem.id,
                    requesterEmail: requestItem.requester_email,
                    resourceId: requestItem.resource_id,
                    reason: requestItem.reason,
                    durationMinutes: requestItem.duration_minutes,
                    status: requestItem.status,
                    requestedAt: requestItem.requested_at,
                    approvedAt: requestItem.approved_at,
                    expiresAt: requestItem.expires_at
                });
            };

        return requestList;
    }

    resource function post access\-requests/[int requestId]/approve()
        returns http:Response|error {

        http:Response response = new;

        ApprovalLookup|sql:Error lookupResult =
            dbClient->queryRow(
                `SELECT
                    id,
                    status,
                    duration_minutes
                 FROM access_requests
                 WHERE id = ${requestId}`
            );

        if lookupResult is sql:NoRowsError {
            response.statusCode = 404;

            response.setJsonPayload({
                message: "Access request not found"
            });

            return response;
        }

        if lookupResult is sql:Error {
            return lookupResult;
        }

        if lookupResult.status != "PENDING" {
            response.statusCode = 400;

            response.setJsonPayload({
                message: "Only PENDING requests can be approved",
                currentStatus: lookupResult.status
            });

            return response;
        }

        _ = check dbClient->execute(
            `UPDATE access_requests
             SET
                status = 'ACTIVE',
                approved_at = CURRENT_TIMESTAMP,
                expires_at = CURRENT_TIMESTAMP +
                    (duration_minutes * INTERVAL '1 minute')
             WHERE id = ${requestId}`
        );

        ApprovedRequest updatedRequest = check dbClient->queryRow(
            `SELECT
                id,
                status,
                approved_at::text,
                expires_at::text
             FROM access_requests
             WHERE id = ${requestId}`
        );

        response.statusCode = 200;

        response.setJsonPayload({
            message: "Access request approved successfully",
            requestId: updatedRequest.id,
            status: updatedRequest.status,
            approvedAt: updatedRequest.approved_at,
            expiresAt: updatedRequest.expires_at
        });

        return response;
    }

    resource function post access\-requests/[int requestId]/reject()
        returns http:Response|error {

        http:Response response = new;

        ApprovalLookup|sql:Error lookupResult =
            dbClient->queryRow(
                `SELECT
                    id,
                    status,
                    duration_minutes
                 FROM access_requests
                 WHERE id = ${requestId}`
            );

        if lookupResult is sql:NoRowsError {
            response.statusCode = 404;

            response.setJsonPayload({
                message: "Access request not found"
            });

            return response;
        }

        if lookupResult is sql:Error {
            return lookupResult;
        }

        if lookupResult.status != "PENDING" {
            response.statusCode = 400;

            response.setJsonPayload({
                message: "Only PENDING requests can be rejected",
                currentStatus: lookupResult.status
            });

            return response;
        }

        _ = check dbClient->execute(
            `UPDATE access_requests
             SET status = 'REJECTED'
             WHERE id = ${requestId}`
        );

        response.statusCode = 200;

        response.setJsonPayload({
            message: "Access request rejected successfully",
            requestId: requestId,
            status: "REJECTED"
        });

        return response;
    }

    resource function post access\-requests/[int requestId]/revoke()
        returns http:Response|error {

        http:Response response = new;

        ApprovalLookup|sql:Error lookupResult =
            dbClient->queryRow(
                `SELECT
                    id,
                    status,
                    duration_minutes
                 FROM access_requests
                 WHERE id = ${requestId}`
            );

        if lookupResult is sql:NoRowsError {
            response.statusCode = 404;

            response.setJsonPayload({
                message: "Access request not found"
            });

            return response;
        }

        if lookupResult is sql:Error {
            return lookupResult;
        }

        if lookupResult.status != "ACTIVE" {
            response.statusCode = 400;

            response.setJsonPayload({
                message: "Only ACTIVE requests can be revoked",
                currentStatus: lookupResult.status
            });

            return response;
        }

        _ = check dbClient->execute(
            `UPDATE access_requests
             SET status = 'REVOKED'
             WHERE id = ${requestId}`
        );

        response.statusCode = 200;

        response.setJsonPayload({
            message: "Access request revoked successfully",
            requestId: requestId,
            status: "REVOKED"
        });

        return response;
    }

    resource function get access\-requests/[int requestId]/access()
        returns http:Response|error {

        http:Response response = new;

        check expireOldRequests();

        AccessCheck|sql:Error lookupResult =
            dbClient->queryRow(
                `SELECT
                    id,
                    status,
                    expires_at::text
                 FROM access_requests
                 WHERE id = ${requestId}`
            );

        if lookupResult is sql:NoRowsError {
            response.statusCode = 404;

            response.setJsonPayload({
                message: "Access request not found"
            });

            return response;
        }

        if lookupResult is sql:Error {
            return lookupResult;
        }

        boolean accessGranted = lookupResult.status == "ACTIVE";

        response.statusCode = 200;

        response.setJsonPayload({
            requestId: lookupResult.id,
            access: accessGranted,
            status: lookupResult.status,
            expiresAt: lookupResult.expires_at
        });

        return response;
    }
}
