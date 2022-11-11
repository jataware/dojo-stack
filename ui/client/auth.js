import axios from 'axios';
import React, { useContext, createContext, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';

export const authStatusEndpoint = '/api/dojo/auth/status';
export const authContext = createContext();

export function AuthWrapper({ children }) {
  const user = null;
  const isAuthenticated = false;
  const auth_url = null;
  const defaultState = {
    user,
    isAuthenticated,
    auth_url,
  };
  const [auth, setAuth] = useState(defaultState);

  function getAuth() {
    if (!auth.isAuthenticated) {
      axios.post(authStatusEndpoint, {}).then((userData) => {
        if (userData.data.authenticated) {
          setAuth({
            ...auth,
            user: userData.data.user,
            isAuthenticated: userData.data.authenticated,
          });
        }
      });
    }
    return {
      auth,
      setAuth
    };
  }


// TODO: remove this true


  const authValue = (process.env.AUTH_ENABLED || true ? getAuth() : {});
  return (
    <authContext.Provider value={authValue}>
      {children}
    </authContext.Provider>
  );
}

export function useAuth() {
  return useContext(authContext);
}

export function ProtectedRoute({ children, ...props }) {


// TODO: turn this back on


  // if (!process.env.AUTH_ENABLED) {
  //   return <Route {...props} render={
  //     ({ location }) => {
  //       return children;
  //     }}
  //   />
  // }

  const { auth } = useAuth();
  if (auth.isAuthenticated) {
    return (
      <Route
        {...props}
        render={
          ({ location }) => {
            return children;
          }
        }
      />
    );
  } else {
    axios.post(authStatusEndpoint, {}).then((response) => {
        if (!response?.data?.authenticated && response?.data?.auth_url) {
            window.location = response.data.auth_url;
            return <Redirect to={response.data.auth_url}/>
        }
    });
    return <h1>Checking Authentication</h1>
  }
}

export function AuthRedirectHandler({ children }) {
  const { auth, setAuth } = useAuth();
  const params = new URLSearchParams(location.search);
  const payload = { auth_code: params.get('code') };

  axios.post(authStatusEndpoint, payload).then((response) => {
    const newUser = response.data.user;
    setAuth({
      ...auth,
      user: newUser,
      isAuthenticated: true,
    });
    setTimeout(() => { document.location = '/'; }, 30);
  });

  return (
    <div>
      <h1>Handling auth</h1>
    </div>
  );
}