import { useEffect, useState } from "react";
import axios from "axios";

function AdminDashboard() {
    const [resources, setResources] = useState([]);
    const [requests, setRequests] = useState([]);

    const [adminMessage, setAdminMessage] = useState("");
    const [adminLoadingId, setAdminLoadingId] = useState(null);

    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        fetchResources();
        fetchRequests();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const refreshTimer = setInterval(() => {
            fetchRequests();
        }, 5000);

        return () => clearInterval(refreshTimer);
    }, []);

    const fetchResources = async () => {
        try {
            const response = await axios.get(
                "http://localhost:8080/resources"
            );

            setResources(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await axios.get(
                "http://localhost:8080/access-requests"
            );

            setRequests(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const approveRequest = async (requestId) => {
        try {
            setAdminLoadingId(requestId);
            setAdminMessage("");

            const response = await axios.post(
                `http://localhost:8080/access-requests/${requestId}/approve`
            );

            setAdminMessage(
                `Request #${requestId} approved. Status: ${response.data.status}`
            );

            await fetchRequests();
        } catch (err) {
            console.error(err);

            setAdminMessage(
                err.response?.data?.message ||
                "Unable to approve request."
            );
        } finally {
            setAdminLoadingId(null);
        }
    };

    const rejectRequest = async (requestId) => {
        try {
            setAdminLoadingId(requestId);
            setAdminMessage("");

            const response = await axios.post(
                `http://localhost:8080/access-requests/${requestId}/reject`
            );

            setAdminMessage(
                `Request #${requestId} rejected. Status: ${response.data.status}`
            );

            await fetchRequests();
        } catch (err) {
            console.error(err);

            setAdminMessage(
                err.response?.data?.message ||
                "Unable to reject request."
            );
        } finally {
            setAdminLoadingId(null);
        }
    };

    const revokeRequest = async (requestId) => {
        try {
            setAdminLoadingId(requestId);
            setAdminMessage("");

            const response = await axios.post(
                `http://localhost:8080/access-requests/${requestId}/revoke`
            );

            setAdminMessage(
                `Request #${requestId} revoked. Status: ${response.data.status}`
            );

            await fetchRequests();
        } catch (err) {
            console.error(err);

            setAdminMessage(
                err.response?.data?.message ||
                "Unable to revoke request."
            );
        } finally {
            setAdminLoadingId(null);
        }
    };

    const getResourceName = (resourceId) => {
        const resource = resources.find(
            (item) => item.id === resourceId
        );

        return resource
            ? resource.name
            : `Resource #${resourceId}`;
    };

    const getRemainingTime = (expiresAt) => {
        if (!expiresAt) {
            return null;
        }

        const expiryTime = new Date(
            expiresAt.replace(" ", "T")
        ).getTime();

        const difference = expiryTime - currentTime;

        if (difference <= 0) {
            return "00:00:00";
        }

        const totalSeconds = Math.floor(
            difference / 1000
        );

        const hours = Math.floor(
            totalSeconds / 3600
        );

        const minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        const seconds = totalSeconds % 60;

        return `${String(hours).padStart(2, "0")}:${String(
            minutes
        ).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0"
        )}`;
    };

    const pendingRequests = requests.filter(
        (request) => request.status === "PENDING"
    );

    const activeRequests = requests.filter(
        (request) => request.status === "ACTIVE"
    );

    return (
        <section className="admin-section">
            <div className="section-header">
                <div>
                    <h2>Admin Dashboard</h2>

                    <p className="section-description">
                        Review and manage temporary access requests.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchRequests}
                >
                    Refresh
                </button>
            </div>

            {adminMessage && (
                <p className="admin-message">
                    {adminMessage}
                </p>
            )}

            <div className="admin-grid">
                <div className="admin-panel">
                    <h3>Pending Requests</h3>

                    {pendingRequests.length === 0 ? (
                        <p className="muted-text">
                            No pending requests.
                        </p>
                    ) : (
                        pendingRequests.map((request) => (
                            <div
                                className="admin-request-card"
                                key={request.id}
                            >
                                <div>
                                    <strong>
                                        {getResourceName(
                                            request.resourceId
                                        )}
                                    </strong>

                                    <p>{request.reason}</p>

                                    <small>
                                        {request.requesterEmail} ·{" "}
                                        {request.durationMinutes} minutes
                                    </small>
                                </div>

                                <div className="admin-actions">
                                    <button
                                        className="approve-button"
                                        onClick={() =>
                                            approveRequest(request.id)
                                        }
                                        disabled={
                                            adminLoadingId === request.id
                                        }
                                    >
                                        Approve
                                    </button>

                                    <button
                                        className="reject-button"
                                        onClick={() =>
                                            rejectRequest(request.id)
                                        }
                                        disabled={
                                            adminLoadingId === request.id
                                        }
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="admin-panel">
                    <h3>Active Access</h3>

                    {activeRequests.length === 0 ? (
                        <p className="muted-text">
                            No active access grants.
                        </p>
                    ) : (
                        activeRequests.map((request) => (
                            <div
                                className="admin-request-card"
                                key={request.id}
                            >
                                <div>
                                    <strong>
                                        {getResourceName(
                                            request.resourceId
                                        )}
                                    </strong>

                                    <p>{request.reason}</p>

                                    <small>
                                        {request.requesterEmail}
                                    </small>

                                    <div className="admin-countdown">
                                        <span>Expires in</span>

                                        <strong>
                                            {getRemainingTime(
                                                request.expiresAt
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="admin-actions">
                                    <button
                                        className="revoke-button"
                                        onClick={() =>
                                            revokeRequest(request.id)
                                        }
                                        disabled={
                                            adminLoadingId === request.id
                                        }
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}

export default AdminDashboard;