import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import {Navigate, useNavigate, useLocation } from "react-router-dom";
//import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
                path="/login"
                element={
                  session ? (
                    profile?.role === "admin" ? (
                      <Navigate to="/admin" replace />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  ) : (
                    <Login supabase={supabase} />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  session ? (
                    <Dashboard supabase={supabase} profile={profile} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  session && profile?.role === "admin" ? (
                    <AdminPanel supabase={supabase} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/visiteur"
                element={
                  session && (profile?.role === "visiteur" || profile?.role === "admin") ? (
                    <Visiteur supabase={supabase} profile={profile} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/auteur"
                element={
                  session && (profile?.role === "auteur" || profile?.role === "admin") ? (
                    <Auteur supabase={supabase} profile={profile} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="*"
                element={
                  session ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
        </>
    );
}
