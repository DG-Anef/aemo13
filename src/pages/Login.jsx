import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login({ supabase, profile }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setError(null);
        console.log("Tentative de connexion avec :", email);

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error("Erreur de connexion :", authError.message);
            setError(authError.message);
        } else {
            navigate("/aemo13/dashboard");
            window.location.href = "/aemo13/";
        }
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Connexion</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="email"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
                    Se connecter
                </button>
            </form>
        </div>
    );
}
