import ballerina/http;

service / on new http:Listener(8080) {

    resource function get health() returns json {
        return {
            status: "healthy",
            serviceName: "grantflow-api"
        };
    }
}
