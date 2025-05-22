import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import supabase from "./lib/supabaseClient";
import "./index.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import Header from "./components/Header";
import Auteur from "./pages/Auteur";
import Visiteur from "./pages/Visiteur";

export default function App() {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        async function loadSession() {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setLoading(false);
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((_, newSession) => {
            setSession(newSession);
            if (newSession && newSession.user) fetchProfile(newSession.user.id);
            else {
                setProfile(null);
                setLoading(false);
            }
        });

        loadSession();

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    async function fetchProfile(user_id) {
        const { data, error } = await supabase
            .from("utilisateurs")
            .select("id, role, association, nom_utilisateur")
            .eq("id", user_id)
            .single();

        if (!error && data) {
            setProfile(data);
        }
        setLoading(false);
    }

    useEffect(() => {
        if (loading || !session || !profile) return;

        if (profile.role === "admin" && location.pathname === "/login") {
            navigate("/admin", { replace: true });
        }
    }, [loading, session, profile, location.pathname, navigate]);

    if (loading) return <p>Chargement...</p>;

    return (
        <>
            <Header session={session} profile={profile} supabase={supabase} />
            <Routes>
              <Route
                path="/aemo13/login"
                element={
                  session ? (
                    profile?.role === "admin" ? (
                      <Navigate to="/aemo13/admin" replace />
                    ) : (
                      <Navigate to="/aemo13/dashboard" replace />
                    )
                  ) : (
                    <Login supabase={supabase} />
                  )
                }
              />
              <Route
                path="/aemo13/dashboard"
                element={
                  session ? (
                    <Dashboard supabase={supabase} profile={profile} />
                  ) : (
                    <Navigate to="/aemo13/login" replace />
                  )
                }
              />
              <Route
                path="/aemo13/admin"
                element={
                  session && profile?.role === "admin" ? (
                    <AdminPanel supabase={supabase} />
                  ) : (
                    <Navigate to="/aemo13/login" replace />
                  )
                }
              />
              <Route
                path="/aemo13/visiteur"
                element={
                  session && (profile?.role === "visiteur" || profile?.role === "admin") ? (
                    <Visiteur supabase={supabase} profile={profile} />
                  ) : (
                    <Navigate to="/aemo13/dashboard" replace />
                  )
                }
              />
              <Route
                path="/aemo13/auteur"
                element={
                  session && (profile?.role === "auteur" || profile?.role === "admin") ? (
                    <Auteur supabase={supabase} profile={profile} />
                  ) : (
                    <Navigate to="/aemo13/dashboard" replace />
                  )
                }
              />
              <Route
                path="*"
                element={
                  session ? (
                    <Navigate to="/aemo13/dashboard" replace />
                  ) : (
                    <Navigate to="/aemo13/login" replace />
                  )
                }
              />
            </Routes>
        </>
    );
}
