import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";
import ReactDOM from "react-dom/client";
import { router } from "./router";
import Layout from "./Layout";
import React from "react";

const root = ReactDOM.createRoot(document.getElementById("root"));
const queryClient = new QueryClient()

// APPLY THEME
const savedTheme = localStorage.getItem('theme') || 'valentine';
document.documentElement.setAttribute('data-theme', savedTheme);

root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </React.StrictMode>
);
