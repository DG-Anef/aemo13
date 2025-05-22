// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import "../index.css";
import { t } from "../lib/fonctions";

export default function Header({ session, profile, supabase }) {
    const navigate = useNavigate();

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate("/login");
    }

    return (
        <header session={session} profile={profile} supabase={supabase}
            className="bg-gray-50 border-b border-gray-300 px-6 py-3 shadow-sm"
            style={{ fontFamily: '"Segoe UI", Roboto, sans-serif' }}
        >
            <div className="max-w-6xl mx-auto flex justify-between items-center">
            {/* Utilisateur + bouton déconnexion à droite */}
                <div className="flex align-left items-center gap-4">
                    <div className="px-4 py-2 text-sm font-medium text-red-700 hover:text-red-900"
                        style={{ fontFamily: '"Segoe UI", sans-serif' }}>
                        {t("Utilisateur connect\u00E9 : ")}{profile?.nom_utilisateur || ""}
                    </div>
                    {session && (
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-red-700 hover:text-red-900"
                            style={{ fontFamily: '"Segoe UI", sans-serif' }}
                        >
                            {"D\u00E9connexion"}
                        </button>
                    )}
                </div>
                {/* Groupe de liens à gauche */}
                <nav className="flex space-x-6">
                    {session && (
                        <>
                            <Link
                                to="/dashboard"
                                className="text-blue-700 font-medium hover:text-blue-900 hover:underline"
                            >
                                Tableau de bord
                            </Link>
                            {profile?.role === "admin" && (
                                <Link
                                    to="/admin"
                                    className="text-blue-700 font-medium hover:text-blue-900 hover:underline"
                                >
                                    Console d'administration
                                </Link>
                            )}
                            {profile?.role === "auteur" && (
                                <Link
                                    to="/auteur"
                                    className="text-blue-700 font-medium hover:text-blue-900 hover:underline"
                                >
                                    Gestion des services
                                </Link>
                            )}
                            {profile?.role === "admin" && (
                                <Link
                                    to="/auteur"
                                    className="text-blue-700 font-medium hover:text-blue-900 hover:underline"
                                >
                                    Gestion des services
                                </Link>
                            )}
                            {profile?.role === "visiteur" && (
                                <Link
                                    to="/visiteur"
                                    className="text-blue-700 font-medium hover:text-blue-900 hover:underline"
                                >
                                    Gestion des attributions et liste d'attente
                                </Link>
                            )}
                            {profile?.role === "admin" && (
                                <Link
                                    to="/visiteur"
                                    className="text-blue-700 font-medium hover:text-blue-900 hover:underline"
                                >
                                    Gestion des attributions et liste d'attente
                                </Link>
                            )}
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}