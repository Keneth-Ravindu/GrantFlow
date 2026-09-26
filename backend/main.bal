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
}
