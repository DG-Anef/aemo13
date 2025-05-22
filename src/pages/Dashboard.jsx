sion﻿//src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { t } from "../lib/fonctions";

export default function Dashboard({ supabase, profile }) {
    const [services, setServices] = useState([]);
    const [places, setPlaces] = useState({});
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({});
    const [formAttribution, setFormAttribution] = useState({
        service_id: "",
        type_accueil_id: "",
        nom_beneficiaire: "",
        age_beneficiaire: "",
        nombre_places: 1,
    });
    const [typesAccueil, setTypesAccueil] = useState([]);
    const [error, setError] = useState(null);
    const [confirmMismatch, setConfirmMismatch] = useState(false);

    useEffect(() => {
        async function loadAll() {
            setLoading(true);
            await fetchTypesAccueil();
            await fetchServices();
            await fetchPlaces();
            setLoading(false);
        }

        if (profile) {
            loadAll();
        }
    }, [profile]);

    // Charger les types d'accueil
    async function fetchTypesAccueil() {
        const { data, error } = await supabase.from("types_accueil").select("id, type_accueil");
        if (!error && data) {
            setTypesAccueil(data);
        } else {
            console.error("Erreur lors du chargement des types d'accueil", error);
        }
    }

    // Charger les services avec type_accueil (objet) et association
    async function fetchServices() {
        let query = supabase
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

        if (profile.role === "auteur") {
            query = query.eq("association.id", profile.association);
        }

        const { data, error } = await query;

        if (!error && data) {
            setServices(data);
        } else {
            setServices([]);
            console.error("Erreur lors du chargement des services", error);
        }
    }

    // Charger les places disponibles par service
    async function fetchPlaces() {
        const { data, error } = await supabase
            .from("places_disponibles")
            .select("id, service, nombre_places, created_at");

        if (!error && data) {
            const placesMap = {};
            data.forEach(p => {
                placesMap[p.service] = p;
            });
            setPlaces(placesMap);
        } else {
            setPlaces({});
            console.error("Erreur lors du chargement des places", error);
        }
    }

    // Obtenir le nombre de places (0 si inexistant)
    function getNombrePlaces(serviceId) {
        return places[serviceId]?.nombre_places ?? 0;
    }

    // Mise à jour du formulaire édition places
    function handleChange(e, serviceId) {
        const value = e.target.value;
        setForm(prev => ({
            ...prev,
            [serviceId]: value
        }));
    }

    async function handleSubmit(e, serviceId) {
        e.preventDefault();
        setError(null);

        const nbPlaces = parseInt(form[serviceId], 10);
        if (isNaN(nbPlaces) || nbPlaces < 0) {
            setError("Veuillez entrer un nombre valide.");
            return;
        }

        const existingPlace = places[serviceId];
        const now = new Date();
        //now.setHours(0, 0, 0, 0); // Met à minuit

        if (existingPlace) {
            const { error: updateError } = await supabase
                .from("places_disponibles")
                .update({ 
                    nombre_places: nbPlaces,
                    created_at: now.toISOString()
                })
                .eq("id", existingPlace.id);

            if (updateError) {
                setError(updateError.message);
            } else {
                await fetchPlaces();
            }
        } else {
            const serviceData = services.find(s => s.id === serviceId);
            const typeAccueilId = serviceData?.type_accueil?.id;

            const { error: insertError } = await supabase.from("places_disponibles").insert({
                service: serviceId,
                type_accueil: typeAccueilId,
                nombre_places: nbPlaces,
                created_at: now.toISOString()
            });

            if (insertError) {
                setError(insertError.message);
            } else {
                await fetchPlaces();
            }
        }
        // Recharge les places pour mettre à jour le tableau
        fetchPlaces();
    }

    // Gérer le formulaire d'attribution
    function handleAttributionChange(e) {
        const { name, value } = e.target;
        setFormAttribution((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmitAttribution(e) {
        e.preventDefault();
        setError(null);

        const {
            service_id,
            type_accueil_id,
            nom_beneficiaire,
            age_beneficiaire,
            nombre_places,
        } = formAttribution;

        const serviceId = service_id; // UUID est une chaîne, pas un nombre
        const typeId = type_accueil_id; // UUID aussi
        const requestedPlaces = parseInt(nombre_places, 10);

        // Vérifie que les valeurs ne sont pas vides ou invalides
        if (
            !serviceId ||
            !typeId ||
            !nom_beneficiaire ||
            !age_beneficiaire ||
            isNaN(requestedPlaces) ||
            requestedPlaces <= 0
        ) {
            setError("Veuillez remplir tous les champs correctement.");
            return;
        }

        const service = services.find((s) => s.id === serviceId);
        if (!service) {
            setError("Service introuvable.");
            return;
        }

        // Vérifier si le type d'accueil choisi correspond au service
        const serviceTypeAccueilId = service.type_accueil?.id;
        //console.log("ID du profile:", profile.id)
        if (typeId !== serviceTypeAccueilId && !confirmMismatch) {
            if (
                window.confirm(
                    "Le type d'accueil choisi ne correspond pas au service. Êtes-vous sûr de vouloir continuer ?"
                )
            ) {
                setConfirmMismatch(true);
            } else {
                return;
            }
        }

        const currentPlace = places[serviceId];
        const availablePlaces = currentPlace?.nombre_places ?? 0;

        // Insertion sans try/catch
        if (availablePlaces >= requestedPlaces || availablePlaces < 0) {
            const { error: attributionError } = await supabase.from("attributions").insert({
                visiteur: profile.id,
                service: serviceId,
                type_accueil: typeId,
                nombre_places: requestedPlaces,
                nom_beneficiaire,
                age_beneficiaire,
            });

            if (attributionError) {
                setError(attributionError.message);
                console.error("Erreur lors de l'insertion dans attributions", attributionError);
                return;
            }

            // Mettre à jour les places disponibles
            const { error: updateError } = await supabase
                .from("places_disponibles")
                .update({ nombre_places: availablePlaces - requestedPlaces })
                .eq("id", currentPlace.id);

            if (updateError) {
                setError(updateError.message);
                console.error("Erreur lors de la mise à jour des places disponibles", updateError);
                return;
            }

            await fetchPlaces();
            await supabase
                .from("places_disponibles")
                .update({ nombre_places: availablePlaces - requestedPlaces })
                .eq("id", currentPlace.id);

            // Réinitialise le formulaire
            setFormAttribution({
                service_id: "",
                type_accueil_id: "",
                nom_beneficiaire: "",
                age_beneficiaire: "",
                nombre_places: 1,
            });

            setConfirmMismatch(false);
            alert("Réservation effectuée !");
        } else {
            const { error: waitlistError } = await supabase.from("liste_attente").insert({
                visiteur: profile.id,
                type_accueil: typeId,
                nombre_places: requestedPlaces,
                nom_beneficiaire,
                age_beneficiaire,
            });

            if (waitlistError) {
                setError(waitlistError.message);
                console.error("Erreur lors de l'insertion en liste d'attente", waitlistError);
                return;
            }

            alert("Aucune place disponible. Votre demande a été mise en liste d'attente.");

            // Réinitialise le formulaire
            setFormAttribution({
                service_id: "",
                type_accueil_id: "",
                nom_beneficiaire: "",
                age_beneficiaire: "",
                nombre_places: 1,
            });

            setConfirmMismatch(false);        }
    }
    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-xl font-bold mb-6">{t("Gestion des Places Disponibles en AEMO - TPE Marseille")}</h1>

            {(profile.role === "admin" || profile.role === "auteur") && (
                <p className="mb-6 text-sm text-gray-600">
                    {t("Pour chaque service, saisissez ou mettez à jour le nombre de places disponibles.")}
                </p>
            )}

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <section>
                <h2 className="text-lg font-semibold mb-4">{t("Liste des Services & Mesures Disponibles")}</h2>
                {loading ? (
                    <p>{t("Chargement des données...")}</p>
                ) : services.length === 0 ? (
                    <p>t(Aucun service trouvé.)</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 text-left">{t("Association")}</th>
                                    <th className="border border-gray-300 p-2 text-left">{t("Service")}</th>
                                    <th className="border border-gray-300 p-2 text-left">{t("Type de mesures")}</th>
                                    <th className="border border-gray-300 p-2 text-right">{t("Places autorisées")}</th>
                                    <th className="border border-gray-300 p-2 text-right" > {t("Places disponibles")}</th>
                                    {(profile.role === "admin" || profile.role === "auteur") && (
                                        <th className="border border-gray-300 p-2 text-right">{t("Mise à jour des disponibilités")}</th>
                                            )}
                                    <th className="border border-gray-300 p-2 text left">{t("Date de mise à jour")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map((service) => (
                                    <tr key={service.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2">
                                            {service.association?.nom || "Inconnue"}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {service.nom_service}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2">
                                            {service.type_accueil?.type_accueil || "Non défini"}
                                        </td>
                                        <td className="border border-gray-300 p-2 text-right">
                                            {service.places_autorisees ?? "-"}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2"
                                            style={{ textAlign: "center", fontWeight: "bold" }}>
                                            {getNombrePlaces(service.id)}
                                        </td>
                                        {(profile.role === "admin" || profile.role === "auteur") && (
                                            <td className="border border-gray-300 px-4 py-2">
                                                <form onSubmit={(e) => handleSubmit(e, service.id)}>
                                                    <div className="flex gap-2 items-center">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            defaultValue={getNombrePlaces(service.id)}
                                                            onChange={(e) => handleChange(e, service.id)}
                                                            className="w-10 p-1 border rounded text-center"
                                                            style={{ width: "80px" }}
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="Valider le nombre de places"
                                                        >
                                                            ✔️
                                                        </button>
                                                    </div>
                                                </form>
                                            </td>
                                        )}
                                        <td className="border border-gray-300 px-4 py-2 text-left">
                                            {places[service.id]?.created_at
                                                ? new Date(places[service.id].created_at).toLocaleDateString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Section Attribution */}
            {(profile.role === "admin" || profile.role === "visiteur") && (
                <section className="mt-10 bg-white p-6 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">{t("Attribution de mesure")}</h2>
                    <form onSubmit={handleSubmitAttribution} className="space-y-4">
                        <div>
                            <label className="block font-semibold mb-1">Service : </label>
                            <select
                                name="service_id"
                                value={formAttribution.service_id}
                                onChange={handleAttributionChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">-- Choisir un service --</option>
                                {services.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.nom_service} ({s.association?.nom})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Type de mesure : </label>
                            <select
                                name="type_accueil_id"
                                value={formAttribution.type_accueil_id}
                                onChange={handleAttributionChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">-- Choisir un type de mesure --</option>
                                {typesAccueil.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.type_accueil}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold mb-1">{t("Numéro de dossier : ")}</label>
                                <input
                                    type="text"
                                    name="nom_beneficiaire"
                                    value={formAttribution.nom_beneficiaire}
                                    onChange={handleAttributionChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Exemple: Jean Dupont"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block font-semibold mb-1">Âge du/des bénéficiaire(s) : </label>
                                <input
                                    type="text"
                                    name="age_beneficiaire"
                                    value={formAttribution.age_beneficiaire}
                                    onChange={handleAttributionChange}
                                    className="w-full p-2 border rounded"
                                    placeholder="Exemple: 5 ans"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block font-semibold mb-1">Nombre de mesures demandées : </label>
                            <input
                                type="number"
                                name="nombre_places"
                                min="1"
                                value={formAttribution.nombre_places}
                                onChange={handleAttributionChange}
                                className="w-24 p-2 border rounded"
                                required
                            />
                        </div>
                        {error && <p className="text-red-600">{error}</p>}
                        <button
                            type="submit"
                            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                        >
                            Attribuer la mesure
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}
