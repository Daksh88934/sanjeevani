import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </React.StrictMode>,
)