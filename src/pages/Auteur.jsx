import { useEffect, useState } from "react";
import { t } from "../lib/fonctions";

export default function Auteur({ supabase, profile }) {
    const [services, setServices] = useState([]);
    const [typesAccueil, setTypesAccueil] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pour ajouter un nouveau service
    const [newService, setNewService] = useState({
        nom_service: "",
        type_accueil: "",
        places_autorisees: 0,
    });

    // Récupérer les données au montage
    useEffect(() => {
        async function loadData() {
            await fetchServices();
            await fetchTypesAccueil();
            setLoading(false);
        }

        if (profile) {
            loadData();
        }
    }, [profile]);

    // Charger les services liés à l'association du profil auteur
    async function fetchServices() {
        const { data, error } = await supabase
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
            `)
            .eq("association", profile.association); // Filtrage par association du profil

        if (!error && data) {
            setServices(data);
        } else {
            setServices([]);
        }
    }

    // Charger les types d'accueil disponibles
    async function fetchTypesAccueil() {
        const { data, error } = await supabase.from("types_accueil").select("id, type_accueil");
        if (!error && data) {
            setTypesAccueil(data);
        } else {
            setTypesAccueil([]);
        }
    }

    // Ajouter un nouveau service lié à l'association du profil
    async function addService() {
        const { nom_service, type_accueil, places_autorisees } = newService;

        if (!nom_service || !type_accueil || places_autorisees === "") {
            alert(t("Veuillez remplir tous les champs."));
            return;
        }

        const serviceToInsert = {
            nom_service,
            type_accueil,
            association: profile.association,
            places_autorisees: parseInt(places_autorisees, 10),
        };

        const { error } = await supabase.from("services").insert([serviceToInsert]);
        if (error) {
            console.error("Erreur lors de l'ajout du service", error);
            alert(t("Échec de l'ajout du service"));
            return;
        }

        setNewService({ nom_service: "", type_accueil: "", places_autorisees: "" });
        fetchServices();
    }

    // Mettre à jour un service existant
    async function updateService(id, field, value) {
        const updateData = {};
        updateData[field] = value;

        const { error } = await supabase
            .from("services")
            .update(updateData)
            .eq("id", id);

        if (!error) {
            fetchServices();
        } else {
            console.error("Erreur lors de la mise à jour du service", error);
        }
    }

    // Supprimer un service
    async function deleteService(id) {
        if (window.confirm(t("Êtes-vous sûr de vouloir supprimer ce service ?"))) {
            const { error } = await supabase.from("services").delete().eq("id", id);
            if (!error) {
                fetchServices();
            } else {
                alert(t("Erreur lors de la suppression du service."));
            }
        }
    }

    if (loading) return <p>{t("Chargement...")}</p>;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-16">
            <h1 className="text-3xl font-bold mb-8">{t("Panneau de gestion des services")}</h1>

            {/* Section Services */}
            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">Services de l'association {profile.association}</h2>
                <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 border">Nom</th>
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
                                        value={s.type_accueil?.id || ""}
                                        onChange={(e) => updateService(s.id, "type_accueil", e.target.value)}
                                        className="w-full p-1 border rounded"
                                    >
                                        <option value="">Choisir</option>
                                        {typesAccueil.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.type_accueil}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2 border">
                                    <input
                                        type="number"
                                        min="0"
                                        value={s.places_autorisees || 0}
                                        onChange={(e) =>
                                            updateService(s.id, "places_autorisees", parseInt(e.target.value, 10))
                                        }
                                        className="w-full p-1 border rounded text-center"
                                    />
                                </td>
                                <td className="p-2 border">
                                    <button
                                        className="text-red-600 hover:text-red-800"
                                        onClick={() => deleteService(s.id)}
                                    >
                                        {t("Supprimer")}
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {/* Formulaire d'ajout */}
                        <tr className="border-t bg-gray-50">
                            <td className="p-2 border">
                                <input
                                    value={newService.nom_service || ""}
                                    onChange={(e) =>
                                        setNewService({ ...newService, nom_service: e.target.value })
                                    }
                                    placeholder="Nom du service"
                                    className="w-full p-1 border rounded"
                                />
                            </td>
                            <td className="p-2 border">
                                <select
                                    value={newService.type_accueil || ""}
                                    onChange={(e) =>
                                        setNewService({ ...newService, type_accueil: e.target.value })
                                    }
                                    className="w-full p-1 border rounded"
                                >
                                    <option value="">Choisir</option>
                                    {typesAccueil.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.type_accueil}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-2 border">
                                <input
                                    type="number"
                                    min="0"
                                    value={newService.places_autorisees || ""}
                                    onChange={(e) =>
                                        setNewService({ ...newService, places_autorisees: e.target.value })
                                    }
                                    className="w-full p-1 border rounded text-center"
                                />
                            </td>
                            <td className="p-2 border">
                                <button
                                    className="text-green-600 hover:text-green-800"
                                    onClick={addService}
                                >
                                    {t("Ajouter")}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
}