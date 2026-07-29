import { createBrowserRouter, useRouteError } from "react-router";
import { lazy, Suspense } from "react";
import AuthProvider from "./utils/context/AuthContext";
import Layout from "./Layout";

// DEFAULT PAGES
const Login = lazy(() => import("./pages/user/Login"));
const Register = lazy(() => import("./pages/user/Register"));
const PasswordRegistration = lazy(() => import("./pages/user/PasswordRegistration"));
const Configuration = lazy(() => import("./pages/user/Configuration"));
const Home = lazy(() => import("./pages/Home"));
const TestingPage = lazy(() => import("./pages/TestingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// CLIENTS PAGES
const Clients = lazy(() => import("./pages/clients/Clients"));

// ORDERS PAGES
const Orders = lazy(() => import("./pages/orders/ServiceOrders"));
const OrderDetail = lazy(() => import("./pages/orders/OrderDetail"));

const PageLoader = () => (
    <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
);

const LazyPage = ({ children }) => (
    <Suspense fallback={<PageLoader />}>
        {children}
    </Suspense>
);

const RootErrorBoundary = () => {
    const error = useRouteError();
    console.error(error);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-base-100 text-base-content">
            <h1 className="text-2xl font-bold mb-2">¡Ups! Algo salió mal.</h1>
            <p className="text-sm opacity-70 mb-4">
                {error?.statusText || error?.message || "Ha ocurrido un error inesperado."}
            </p>
            <button
                type="button"
                onClick={() => window.location.assign('/tickets/')}
                className="btn btn-primary btn-sm rounded-xl"
            >
                Volver al inicio
            </button>
        </div>
    );
};

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LazyPage><Login /></LazyPage>,
        errorElement: <RootErrorBoundary />
    },
    {
        path: "/register",
        element: (
            <LazyPage><Register /></LazyPage>
        ),
        errorElement: <RootErrorBoundary />
    },
    {
        element: <AuthProvider />,
        errorElement: <RootErrorBoundary />,
        children: [
            {
                path: "/home", element: (
                    <Layout>
                        <LazyPage><Home /></LazyPage>
                    </Layout>
                ),
            },
            {
                path: "/create-password",
                element: <LazyPage><PasswordRegistration /></LazyPage>
            },
            {
                path: "/testing",
                element: (
                    <Layout>
                        <LazyPage><TestingPage /></LazyPage>
                    </Layout>
                ),
            },
            {
                path: "/config",
                element: (
                    <Layout>
                        <LazyPage><Configuration /></LazyPage>
                    </Layout>
                ),
            },
            { // CLIENTS
                path: "/clients",
                element: (
                    <Layout>
                        <LazyPage><Clients /></LazyPage>
                    </Layout>
                ),
            },
            { // ORDERS
                path: "/service-orders",
                element: (
                    <Layout>
                        <LazyPage><Orders /></LazyPage>
                    </Layout>
                ),
            },
            {
                path: "/service-orders/detail/:id",
                element: (
                    <Layout>
                        <LazyPage><OrderDetail /></LazyPage>
                    </Layout>
                ),
            },
        ]
    },
    {
        path: "*",
        element: <LazyPage><NotFound /></LazyPage>,
        errorElement: <RootErrorBoundary />
    }
], { basename: import.meta.env.BASE_URL });