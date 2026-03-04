import { useState, useEffect, useCallback } from 'react';
import { CLIENT_ID, SCOPES } from '../config/sheets';

let tokenClient = null;

export function useAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            setIsSignedIn(true);
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` },
            })
              .then(r => r.json())
              .then(info => setUser({ name: info.name, email: info.email, picture: info.picture }));
          }
        },
      });
      setLoading(false);
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const signIn = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    }
  }, []);

  const signOut = useCallback(() => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken);
    }
    setAccessToken(null);
    setIsSignedIn(false);
    setUser(null);
  }, [accessToken]);

  return { isSignedIn, user, accessToken, loading, signIn, signOut };
}
