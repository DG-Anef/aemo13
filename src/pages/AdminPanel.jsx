// src/pages/AdminPanel.jsx
import { useEffect, useState } from "react";
import { t } from "../lib/fonctions";

export default function AdminPanel({ supabase, profile }) {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ nom_utilisateur: "", email: "", role: "visiteur" });
    const [associations, setAssociations] = useState([]);
    const [newAssociation, setNewAssociation] = useState({ nom: "" });
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({ nom_service: "", association: "", type_accueil: "" });
    const [typesAccueil, setTypesAccueil] = useState([]);

    useEffect(() => {
        fetchUsers();
        fetchAssociations();
        fetchServices();
        fetchTypesAccueil();
    }, []);

    async function fetchUsers() {
        const { data, error } = await supabase.from("utilisateurs").select("id, nom_utilisateur, email, role, association (id, nom)");
        if (!error) setUsers(data);
    }

    async function fetchAssociations() {
        const { data, error } = await supabase.from("associations").select("id, nom");
        if (!error) setAssociations(data);
    }

    
    async function fetchServices() {
        const {data, error } = await supabase
            .from("services")
            .select(`
            id,
            nom_service,
            type_accueil (
                id,
                type_accueil
            ),
            association (
                id,
                nom
            ),
            places_autorisees
        `);
        if (!error) setServices(data);
    }

    async function fetchTypesAccueil() {
        const { data, error } = await supabase.from("types_accueil").select("id, type_accueil");
        if (!error) setTypesAccueil(data);
    }

    async function addUser() {
        await supabase.from("utilisateurs").insert([newUser]);
        setNewUser({ nom_utilisateur: "", email: "", role: "visiteur" });
        fetchUsers();
    }

    async function updateUser(id, field, value) {
        await supabase.from("utilisateurs").update({ [field]: value }).eq("id", id);
        fetchUsers();
    }

    async function deleteUser(id) {
        await supabase.from("utilisateurs").delete().eq("id", id);
        fetchUsers();
    }

    async function addAssociation() {
        await supabase.from("associations").insert([newAssociation]);
        setNewAssociation({ nom: "" });
        fetchAssociations();
    }

    async function updateAssociation(id, field, value) {
        await supabase.from("associations").update({ [field]: value }).eq("id", id);
        fetchAssociations();
    }

    async function deleteAssociation(id) {
        await supabase.from("associations").delete().eq("id", id);
        fetchAssociations();
    }

    async function addService() {
        await supabase.from("services").insert([newService]);
        setNewService({ nom_service: "", association: "", type_accueil: "", places_autorisees: "" });
        fetchServices();
    }

    async function updateService(id, field, value) {
        await supabase.from("services").update({ [field]: value }).eq("id", id);
        fetchServices();
    }

    async function deleteService(id) {
        await supabase.from("services").delete().eq("id", id);
        fetchServices();
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-16">
            <h1 className="text-3xl font-bold mb-8">{t("Panneau d'administration")}</h1>

            {/* Utilisateurs */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Utilisateurs</h2>
                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 border">Nom</th>
                            <th className="p-3 border">Email</th>
                            <th className="p-3 border">Association</th>
                            <th className="p-3 border">{("R\u00F4le")}</th>
                            <th className="p-3 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u)  => (
                            <tr key={u.id} className="border-t">
                                <td className="p-2 border"><input className="w-full" value={u.nom_utilisateur} onChange={(e) => updateUser(u.id, "nom_utilisateur", e.target.value)} /></td>
                                <td className="p-2 border"><input className="w-full" value={u.email} onChange={(e) => updateUser(u.id, "email", e.target.value)} /></td>
                                <td className="p-2 border">
                                    <select
                                        value={u.association?.id || ""}
                                        onChange={(e) => updateUser(u.id, "association", e.target.value)}
                                        className="w-full"
                                    >
                                        <option value="">Choisir l'association</option>
                                        {associations.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.nom}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border">
                                    <select value={u.role} onChange={(e) => updateUser(u.id, "role", e.target.value)}>
                                        <option value="admin">admin</option>
                                        <option value="auteur">auteur</option>
                                        <option value="visiteur">visiteur</option>
                                    </select>
                                </td>
                                <td className="p-2 border"><button className="text-red-600" onClick={() => deleteUser(u.id)}>Supprimer</button></td>
                            </tr>
                        ))}
                        <tr className="border-t">
                            <td><input value={newUser.nom_utilisateur} onChange={(e) => setNewUser({ ...newUser, nom_utilisateur: e.target.value })} /></td>
                            <td className="p-2 border">
                                <input
                                    value={newUser.email || ""}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </td>
                            <td className="p-2 border">
                                <select
                                    value={newUser.association || ""}
                                    onChange={(e) =>
                                        setNewUser({ ...newUser, association: e.target.value })
                                    }
                                    className="w-full p-1 border-round"
                                >
                                    <option value="">Choisir l'association</option>
                                    {associations.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.nom}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="admin">admin</option>
                                    <option value="auteur">auteur</option>
                                    <option value="visiteur">visiteur</option>
                                </select>
                            </td>
                            <td><button className="text-green-600" onClick={addUser}>Ajouter</button></td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Associations */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Associations</h2>
                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 border">Nom</th>
                            <th className="p-3 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {associations.map((a) => (
                            <tr key={a.id} className="border-t">
                                <td className="p-2 border"><input className="w-full" value={a.nom} onChange={(e) => updateAssociation(a.id, "nom", e.target.value)} /></td>
                                <td className="p-2 border"><button className="text-red-600" onClick={() => deleteAssociation(a.id)}>Supprimer</button></td>
                            </tr>
                        ))}
                        <tr className="border-t">
                            <td><input value={newAssociation.nom} onChange={(e) => setNewAssociation({ nom: e.target.value })} /></td>
                            <td><button className="text-green-600" onClick={addAssociation}>Ajouter</button></td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Services */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Services</h2>
                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 border">Nom</th>
                            <th className="p-3 border">Association</th>
                            <th className="p-3 border">Type d'accueil</th>
                            <th className="p-3 border">{"Places autoris\u00E9es"}</th>
                            <th className="p-3 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((s) => (
                            <tr key={s.id} className="border-t hover:bg-gray-50">
                                <td className="p-2 border">
                                    <input
                                        className="w-full p-1 border rounded"
                                        value={s.nom_service || ""}
                                        onChange={(e) => updateService(s.id, "nom_service", e.target.value)}
                                    />
                                </td>
                                <td className="p-2 border">
                                    <select
                                        value={s.association?.id || ""}
                                        onChange={(e) => updateService(s.id, "association", e.target.value)}
                                        className="w-full p-1 border rounded"
                                    >
                                        <option value="">Choisir</option>
                                        {associations.map((a) => (
                                            <option key={a.id} value={a.id}>{a.nom}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border">
                                    <select
                                        value={s.type_accueil?.id || ""}
                                        onChange={(e) => updateService(s.id, "type_accueil", e.target.value)}
                                        className="w-full p-1 border rounded"
                                    >
                                        <option value="">Choisir</option>
                                        {typesAccueil.map((t) => (
                                            <option key={t.id} value={t.id}>{t.type_accueil}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="number"
                                        min="0"
                                        value={s.places_autorisees || 0}
                                        onChange={(e) => updateService(s.id, "places_autorisees", parseInt(e.target.value, 10))}
                                        className="w-full p-1 border rounded text-center"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => deleteService(s.id)}
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        <tr className="border-t bg-gray-50">
                            <td className="p-2 border">
                                <input
                                    value={newService.nom_service || ""}
                                    onChange={(e) => setNewService({ ...newService, nom_service: e.target.value })}
                                    className="w-full p-1 border rounded"
                                />
                            </td>
                            <td className="p-2 border">
                                <select
                                    value={newService.association || ""}
                                    onChange={(e) => setNewService({ ...newService, association: e.target.value })}
                                    className="w-full p-1 border rounded"
                                >
                                    <option value="">Choisir</option>
                                    {associations.map((a) => (
                                        <option key={a.id} value={a.id}>{a.nom}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-2 border">
                                <select
                                    value={newService.type_accueil || ""}
                                    onChange={(e) => setNewService({ ...newService, type_accueil: e.target.value })}
                                    className="w-full p-1 border rounded"
                                >
                                    <option value="">Choisir</option>
                                    {typesAccueil.map((t) => (
                                        <option key={t.id} value={t.id}>{t.type_accueil}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-2 border">
                                <input
                                    type="number"
                                    min="0"
                                    value={newService.places_autorisees || ""}
                                    onChange={(e) => setNewService({ ...newService, places_autorisees: parseInt(e.target.value, 10) || "" })}
                                    className="w-full p-1 border rounded text-center"
                                />
                            </td>
                            <td className="p-2 border">
                                <button
                                    className="text-green-600 hover:text-green-800"
                                    onClick={addService}
                                >
                                    Ajouter
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
}
