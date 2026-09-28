import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignOutButton,
} from "@asgardeo/react";

function AuthGate({ children }) {
    return (
        <>
            <SignedOut>
                <div className="auth-page">
                    <div className="auth-card">
                        <h1>GrantFlow</h1>

                        <p>Just-in-Time Access Management for Engineering Teams</p>

                        <p className="auth-description">
                            Sign in with WSO2 Identity Platform to continue.
                        </p>

                        <SignInButton />
                    </div>
                </div>
            </SignedOut>

            <SignedIn>
                <div className="auth-toolbar">
                    <span>Authenticated with WSO2 Identity Platform</span>

                    <SignOutButton />
                </div>

                {children}
            </SignedIn>
        </>
    );
}

export default AuthGate;