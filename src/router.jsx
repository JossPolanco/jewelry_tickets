import { createBrowserRouter, useRouteError } from "react-router";
import { lazy, Suspense } from "react";
import AuthProvider from "./utils/AuthContext";
import Layout from "./Layout";

// Lazy loaded page components
const Login = lazy(() => import("./pages/user/Login"));
const Register = lazy(() => import("./pages/user/Register"));
const PasswordRegistration = lazy(() => import("./pages/user/PasswordRegistration"));
const Configuration = lazy(() => import("./pages/user/Configuration"));
const Home = lazy(() => import("./pages/Home"));
const TestingPage = lazy(() => import("./pages/TestingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
                path: "/drawing",
                element: (
                    <Layout>
                        <LazyPage><DrawingPage /></LazyPage>
                    </Layout>
                ),
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
            {
                path: "/chat",
                element: (
                    <LazyPage><Chat /></LazyPage>
                )
            },
            {
                path: "/starred-messages",
                element: (
                    <LazyPage><StarredMessages /></LazyPage>
                )
            },
            {
                path: "/tasks",
                element: (
                    <Layout>
                        <LazyPage><Tasks /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/task/:id",
                element: (
                    <Layout>
                        <LazyPage><TaskDetail /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/dates",
                element: (
                    <Layout>
                        <LazyPage><Dates /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/date/:id",
                element: (
                    <Layout>
                        <LazyPage><DateDetail /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/notes",
                element: (
                    <Layout>
                        <LazyPage><Notes /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/notes-gallery",
                element: (
                    <Layout>
                        <LazyPage><NotesGallery /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/diary",
                element: (
                    <Layout>
                        <LazyPage><Diary /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/diary-detail/:currentDate",
                element: (
                    <Layout>
                        <LazyPage><DiaryDetail /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/anniversaries",
                element: (
                    <Layout>
                        <LazyPage><Anniversaries /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/anniversary-detail/:id",
                element: (
                    <Layout>
                        <LazyPage><AnniversaryDetail /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/geolocation",
                element: (
                    <Layout>
                        <LazyPage><Geolocation /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/games",
                element: (
                    <Layout>
                        <LazyPage><Games /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/pinturillo",
                element: (
                    <Layout>
                        <LazyPage><Pinturillo /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "/pinturillo/newgame",
                element: (
                    <Layout>
                        <LazyPage><PintNewGame /></LazyPage>
                    </Layout>
                )
            },
            {
                path: "pinturillo/play/:id",
                element: (
                    <Layout>
                        <LazyPage><PinturilloGuess /></LazyPage>
                    </Layout>
                )
            }
        ]
    },
    {
        path: "*",
        element: <LazyPage><NotFound /></LazyPage>,
        errorElement: <RootErrorBoundary />
    },
    {
        path: "/anniversary",
        element: <LazyPage><Anniversary /></LazyPage>,
        errorElement: <RootErrorBoundary />
    }
], { basename: '/tickets' });