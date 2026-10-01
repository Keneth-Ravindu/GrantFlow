import { useEffect, useState } from "react";
import axios from "axios";
import { useAsgardeo } from "@asgardeo/react";
import "./App.css";

function App() {
  const { user, getDecodedIdToken } = useAsgardeo();



  const authenticatedEmail =
    user?.email ||
    user?.emails?.[0] ||
    user?.username ||
    user?.userName ||
    user?.sub ||
    "";

  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedResource, setSelectedResource] = useState(null);
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);

  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [adminMessage, setAdminMessage] = useState("");
  const [adminLoadingId, setAdminLoadingId] = useState(null);

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const inspectToken = async () => {
      try {
        const decodedToken = await getDecodedIdToken();

        console.log("Decoded WSO2 ID token:", decodedToken);
      } catch (error) {
        console.error("Unable to decode WSO2 ID token:", error);
      }
    };

    inspectToken();
  }, [getDecodedIdToken]);

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
      setError("Unable to load protected resources.");
    } finally {
      setLoading(false);
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

  const openRequestForm = (resource) => {
    setSelectedResource(resource);
    setReason("");
    setDurationMinutes(30);
    setRequestMessage("");
  };

  const closeRequestForm = () => {
    setSelectedResource(null);
    setReason("");
    setRequestMessage("");
  };

  const submitAccessRequest = async (event) => {
    event.preventDefault();

    if (!reason.trim()) {
      setRequestMessage("Please enter a reason for the request.");
      return;
    }

    if (!authenticatedEmail) {
      setRequestMessage("Unable to determine authenticated user.");
      return;
    }

    try {
      setSubmitting(true);
      setRequestMessage("");

      const response = await axios.post(
        "http://localhost:8080/access-requests",
        {
          requesterEmail: authenticatedEmail,
          resourceId: selectedResource.id,
          reason,
          durationMinutes: Number(durationMinutes),
        }
      );

      setRequestMessage(
        `Request #${response.data.requestId} created successfully. Status: ${response.data.status}`
      );

      setReason("");

      await fetchRequests();
    } catch (err) {
      console.error(err);

      setRequestMessage(
        err.response?.data?.message ||
        "Unable to create access request."
      );
    } finally {
      setSubmitting(false);
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

  const getStatusClass = (status) => {
    return `status-badge status-${status.toLowerCase()}`;
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

    const totalSeconds = Math.floor(difference / 1000);

    const hours = Math.floor(totalSeconds / 3600);

    const minutes = Math.floor(
      (totalSeconds % 3600) / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const myRequests = requests.filter(
    (request) => request.requesterEmail === authenticatedEmail
  );

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  );

  const activeRequests = requests.filter(
    (request) => request.status === "ACTIVE"
  );

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>GrantFlow</h1>
          <p>Just-in-Time Access Management</p>
        </div>

        <div className="user-summary">
          <span className="user-label">Signed in as</span>

          <strong>
            {user?.displayName ||
              user?.userName ||
              user?.username ||
              authenticatedEmail}
          </strong>

          <small>{authenticatedEmail}</small>
        </div>
      </header>

      <main className="main-content">
        <section>
          <h2>Protected Resources</h2>

          <p className="section-description">
            Request temporary access to protected engineering
            resources.
          </p>

          {loading && <p>Loading resources...</p>}

          {error && <p className="error">{error}</p>}

          <div className="resource-grid">
            {resources.map((resource) => (
              <div
                className="resource-card"
                key={resource.id}
              >
                <h3>{resource.name}</h3>

                <p>{resource.description}</p>

                <button
                  onClick={() =>
                    openRequestForm(resource)
                  }
                >
                  Request Access
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="requests-section">
          <div className="section-header">
            <div>
              <h2>My Requests</h2>

              <p className="section-description">
                Track your temporary access requests.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={fetchRequests}
            >
              Refresh
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="empty-state">
              <p>No access requests yet.</p>
            </div>
          ) : (
            <div className="requests-list">
              {myRequests.map((request) => (
                <div
                  className="request-card"
                  key={request.id}
                >
                  <div className="request-top-row">
                    <div>
                      <span className="request-id">
                        Request #{request.id}
                      </span>

                      <h3>
                        {getResourceName(
                          request.resourceId
                        )}
                      </h3>
                    </div>

                    <span
                      className={getStatusClass(
                        request.status
                      )}
                    >
                      {request.status}
                    </span>
                  </div>

                  {request.status === "ACTIVE" &&
                    request.expiresAt && (
                      <div className="countdown-box">
                        <span className="countdown-label">
                          Access expires in
                        </span>

                        <span className="countdown-time">
                          {getRemainingTime(
                            request.expiresAt
                          )}
                        </span>
                      </div>
                    )}

                  <div className="request-details">
                    <div>
                      <span className="detail-label">
                        Reason
                      </span>
                      <p>{request.reason}</p>
                    </div>

                    <div>
                      <span className="detail-label">
                        Duration
                      </span>
                      <p>
                        {request.durationMinutes} minutes
                      </p>
                    </div>

                    <div>
                      <span className="detail-label">
                        Requested
                      </span>
                      <p>{request.requestedAt}</p>
                    </div>

                    {request.approvedAt && (
                      <div>
                        <span className="detail-label">
                          Approved
                        </span>
                        <p>{request.approvedAt}</p>
                      </div>
                    )}

                    {request.expiresAt && (
                      <div>
                        <span className="detail-label">
                          Expires
                        </span>
                        <p>{request.expiresAt}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-section">
          <div className="section-header">
            <div>
              <h2>Admin Dashboard</h2>

              <p className="section-description">
                Review and manage temporary access requests.
              </p>
            </div>
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

        {selectedResource && (
          <div className="modal-overlay">
            <div className="modal">
              <button
                className="close-button"
                onClick={closeRequestForm}
                type="button"
              >
                ×
              </button>

              <h2>Request Access</h2>

              <p className="selected-resource">
                {selectedResource.name}
              </p>

              <form onSubmit={submitAccessRequest}>
                <label htmlFor="reason">
                  Reason
                </label>

                <textarea
                  id="reason"
                  value={reason}
                  onChange={(event) =>
                    setReason(event.target.value)
                  }
                  placeholder="Explain why you need temporary access..."
                  rows="4"
                />

                <label htmlFor="duration">
                  Duration
                </label>

                <select
                  id="duration"
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(
                      event.target.value
                    )
                  }
                >
                  <option value="1">
                    1 minute (testing)
                  </option>

                  <option value="15">
                    15 minutes
                  </option>

                  <option value="30">
                    30 minutes
                  </option>

                  <option value="60">
                    1 hour
                  </option>

                  <option value="120">
                    2 hours
                  </option>

                  <option value="240">
                    4 hours
                  </option>

                  <option value="480">
                    8 hours
                  </option>
                </select>

                <button
                  className="submit-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </form>

              {requestMessage && (
                <p className="request-message">
                  {requestMessage}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;