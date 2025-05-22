import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { t } from "../lib/fonctions";

export default function Visiteur({ supabase, profile }) {
    const [attributions, setAttributions] = useState([]);
    const [attente, setAttente] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState({});
    const [services, setServices] = useState({});
    const [typesAccueil, setTypesAccueil] = useState({});

    // Réattribution
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedService, setSelectedService] = useState("");
    const [reassignError, setReassignError] = useState("");

    // Charger les données utilisateur pour mapping
    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // Récupérer utilisateurs
            const { data: userData } = await supabase
                .from("utilisateurs")
                .select("id, nom_utilisateur");
            if (userData) {
                const userMap = {};
                userData.forEach(u => {
                    userMap[u.id] = u.nom_utilisateur || "Inconnu";
                });
                setUsers(userMap);
            }

            // Récupérer services
            const { data: serviceData } = await supabase
                .from("services")
                .select("id, nom_service, association!inner(nom), type_accueil!inner(type_accueil)");
            if (serviceData) {
                const serviceMap = {};
                serviceData.forEach(s => {
                    const associationNom = s.association?.nom || "Aucune";
                    const serviceLabel = `${s.nom_service} (${associationNom})`;
                    serviceMap[s.id] = serviceLabel;
                });
                setServices(serviceMap);
            }

            // Récupérer types d'accueil
            const { data: typeData } = await supabase
                .from("types_accueil")
                .select("id, type_accueil");
            if (typeData) {
                const typeMap = {};
                typeData.forEach(t => {
                    typeMap[t.id] = t.type_accueil || "Inconnu";
                });
                setTypesAccueil(typeMap);
            }

            // Récupérer mesures attribuées
            const { data: attData } = await supabase
                .from("attributions")
                .select("*")
                .eq("visiteur", profile.id)
                .order("created_at", { ascending: false });
            setAttributions(attData || []);

            // Récupérer mesures en liste d'attente
            const { data: waitData } = await supabase
                .from("liste_attente")
                .select("id, visiteur, type_accueil, nombre_places, nom_beneficiaire, age_beneficiaire, created_at")
                .eq("visiteur", profile.id)
                .order("created_at", { ascending: true });
            setAttente(waitData || []);
            setLoading(false);
        }

        if (profile) {
            loadData();
        }
    }, [profile]);

    // Charger les places disponibles par service/type_accueil
    const [placesDispo, setPlacesDispo] = useState({});
    useEffect(() => {
        async function loadPlaces() {
            const { data, error } = await supabase
                .from("places_disponibles")
                .select("service, type_accueil, nombre_places");

            if (!error && data) {
                const map = {};
                data.forEach(p => {
                    map[`${p.service}-${p.type_accueil}`] = p.nombre_places;
                });
                setPlacesDispo(map);
            }
        }

        loadPlaces();
    }, []);

    // Ouvrir le modal pour réattribuer
    function openReassignModal(item) {
        setSelectedItem(item);
        setSelectedService("");
        setReassignError("");
        setShowReassignModal(true);
    }

    // Confirmer la réattribution
    async function confirmReassign() {
        const item = selectedItem;
        const serviceId = selectedService;
        const typeId = item.type_accueil;
        const requestedPlaces = item.nombre_places;

        if (!serviceId) {
            setReassignError("Veuillez choisir un service.");
            return;
        }

        const key = `${serviceId}-${typeId}`;
        const available = placesDispo[key] ?? 0;

        if (available < requestedPlaces) {
            setReassignError("Le service sélectionné n'a pas assez de places. Merci d'en choisir un autre.");
            return;
        }

        // Insérer dans attributions
        const { error: insertError } = await supabase.from("attributions").insert({
            visiteur: item.visiteur,
            service: serviceId,
            type_accueil: typeId,
            nombre_places: requestedPlaces,
            nom_beneficiaire: item.nom_beneficiaire,
            age_beneficiaire: item.age_beneficiaire,
        });

        if (insertError) {
            alert("Erreur lors de l'attribution.");
            return;
        }

        // Mettre à jour les places
        await supabase
            .from("places_disponibles")
            .update({ nombre_places: available - requestedPlaces })
            .eq("service", serviceId)
            .eq("type_accueil", typeId);

        // Supprimer de la liste d'attente
        await supabase.from("liste_attente").delete().eq("id", item.id);

        alert("Mesure réattribuée avec succès !");
        window.location.reload();
    }

    // Mettre une attribution en liste d'attente
    async function moveToWaitList(item) {
        const { error: insertError } = await supabase.from("liste_attente").insert({
            visiteur: item.visiteur,
            service: item.service,
            type_accueil: item.type_accueil,
            nombre_places: item.nombre_places,
            nom_beneficiaire: item.nom_beneficiaire,
            age_beneficiaire: item.age_beneficiaire,
            created_at: item.created_at
        });

        if (insertError) {
            alert("Erreur lors de la mise en liste d'attente.");
            return;
        }

        await supabase.from("attributions").delete().eq("id", item.id);
        alert("Mesure mise en liste d'attente avec succès !");
        window.location.reload();
    }

    // Export CSV (sans UUID)
    function exportToCSV(data, filename, fields) {
        const mappedData = data.map(row => {
            const newRow = {};
            for (const field of fields) {
                if (field === "visiteur") {
                    newRow[field] = users[row.visiteur] || "Inconnu";
                } else if (field === "service") {
                    newRow[field] = services[row.service] || "Inconnu";
                } else if (field === "type_accueil") {
                    newRow[field] = typesAccueil[row.type_accueil] || "Inconnu";
                } else {
                    newRow[field] = row[field];
                }
            }
            return newRow;
        });

        const csvRows = [];
        const headers = fields.map(h => `"${h}"`).join(",");
        csvRows.push(headers);

        for (const row of mappedData) {
            const values = fields.map(f => `"${row[f]}"`);
            csvRows.push(values.join(","));
        }

        const csvString = csvRows.join("\r\n");
        const blob = new Blob([`\uFEFF${csvString}`], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Export PDF (sans UUID)
    function exportToPDF(data, filename, fields) {
        const doc = new jsPDF();

        const mappedData = data.map(row => {
            const newRow = {};
            for (const field of fields) {
                if (field === "visiteur") {
                    newRow[field] = users[row.visiteur] || "Inconnu";
                } else if (field === "service") {
                    newRow[field] = services[row.service] || "Inconnu";
                } else if (field === "type_accueil") {
                    newRow[field] = typesAccueil[row.type_accueil] || "Inconnu";
                } else {
                    newRow[field] = row[field];
                }
            }
            return Object.values(newRow);
        });

        const headers = fields.map(f => {
            if (f === "visiteur") return "Juge/Cabinet";
            if (f === "service") return "Service";
            if (f === "type_accueil") return "Type d'accueil";
            if (f === "nom_beneficiaire") return "Nro de dossier";
            if (f === "age_beneficiaire") return "\u00C2ge(s)";
            if (f === "created_at") return "Date d'attribution";
            return f;
        });

        autoTable(doc, {
            head: [headers],
            body: mappedData
        });

        doc.save(`${filename}.pdf`);
    }

    if (loading) return <p>{t("Chargement...")}</p>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10" style={{ fontFamily: '"Segoe UI", sans-serif' }}>
            {/* Liste d'attente */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t("Liste d'attente")}</h2>
                    <div className="space-x-2">
                        <button
                            onClick={() =>
                                exportToCSV(
                                    attente,
                                    "liste_attente",
                                    ["visiteur", "type_accueil", "nombre_places", "nom_beneficiaire", "age_beneficiaire", "created_at"]
                                )
                            }
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={() =>
                                exportToPDF(
                                    attente,
                                    "liste_attente",
                                    ["visiteur", "type_accueil", "nombre_places", "nom_beneficiaire", "age_beneficiaire", "created_at"]
                                )
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>

                {attente.length === 0 ? (
                    <p>{t("Aucune demande en liste d'\u00E9tatente.")}</p>
                ) : (
                    <table className="w-full border border-gray-300">
                        <thead className="bg-yellow-100">
                            <tr>
                                <th className="border p-2 text-left">{t("Juge/Cabinet")}</th>
                                <th className="border p-2 text-left">{t("Type de mesure")}</th>
                                <th className="border p-2 text-right">{t("Places")}</th>
                                <th className="border p-2 text-left">{t("Nro de dossier")}</th>
                                <th className="border p-2 text-left">{t("\u00C2ge(s)")}</th>
                                <th className="border p-2 text-right">{t("Date")}</th>
                                <th className="border p-2 text-right">{t("Actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attente.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="border p-2">{users[item.visiteur] || "Inconnu"}</td>
                                    <td className="border p-2">{typesAccueil[item.type_accueil] || "Inconnu"}</td>
                                    <td className="border p-2 text-right">{item.nombre_places}</td>
                                    <td className="border p-2">{item.nom_beneficiaire}</td>
                                    <td className="border p-2">{item.age_beneficiaire}</td>
                                    <td className="border p-2 text-right">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="border p-2 text-right">
                                        {(profile.role === "admin" || profile.role === "auteur") && (
                                            <button
                                                onClick={() => openReassignModal(item)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                {"R\u00E9attribuer"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* Mesures attribuées */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{t("Mesures attribu\u00E9es")}</h2>
                    <div className="space-x-2">
                        <button
                            onClick={() =>
                                exportToCSV(
                                    attributions,
                                    "attributions",
                                    ["visiteur", "service", "type_accueil", "nom_beneficiaire", "age_beneficiaire", "created_at"]
                                )
                            }
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={() =>
                                exportToPDF(
                                    attributions,
                                    "attributions",
                                    ["visiteur", "service", "type_accueil", "nom_beneficiaire", "age_beneficiaire", "created_at"]
                                )
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>

                {attributions.length === 0 ? (
                    <p>{t("Aucune attribution trouv\u00E9e.")}</p>
                ) : (
                    <table className="w-full border border-gray-300">
                        <thead className="bg-green-100">
                            <tr>
                                <th className="border p-2 text-left">{t("Juge/Cabinet")}</th>
                                <th className="border p-2 text-left">{t("Service")}</th>
                                <th className="border p-2 text-left">{t("Type de mesure")}</th>
                                <th className="border p-2 text-right">{t("Places")}</th>
                                <th className="border p-2 text-left">{t("Nro de dossier")}</th>
                                <th className="border p-2 text-left">{t("\u00C2ge(s)")}</th>
                                <th className="border p-2 text-right">{t("Date")}</th>
                                <th className="border p-2 text-right">{t("Actions")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attributions.map((att) => {
                                const serviceLabel = services[att.service] || "Inconnu";
                                return (
                                    <tr key={`att-${att.id}`} className="hover:bg-gray-50">
                                        <td className="border p-2">{users[att.visiteur] || "Inconnu"}</td>
                                        <td className="border p-2">{serviceLabel}</td>
                                        <td className="border p-2">{typesAccueil[att.type_accueil] || "Inconnu"}</td>
                                        <td className="border p-2 text-right">{att.nombre_places}</td>
                                        <td className="border p-2">{att.nom_beneficiaire}</td>
                                        <td className="border p-2">{att.age_beneficiaire}</td>
                                        <td className="border p-2 text-right">
                                            {new Date(att.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="border p-2 text-right">
                                            {(profile.role === "admin" || profile.role === "auteur") && (
                                                <button
                                                    onClick={() => moveToWaitList(att)}
                                                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                                                >
                                                    {t("Mettre en attente")}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </section>

            {/* Fenêtre modale pour réattribuer */}
            {showReassignModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow w-96">
                        <h3 className="text-lg font-semibold mb-4">{t("Choisissez un service")}</h3>
                        <p>{t("Type de mesure : ") + typesAccueil[selectedItem.type_accueil]}</p>
                        <p>{t("Nombre de places : ") + selectedItem.nombre_places}</p>

                        {reassignError && <p className="text-red-600 mt-2 mb-4">{reassignError}</p>}

                        <label className="block mb-2">{t("Service cible")}</label>
                        <select
                            value={selectedService}
                            onChange={(e) => setSelectedService(e.target.value)}
                            className="w-full p-2 border rounded mb-4"
                        >
                            <option value="">{t("-- Choisir --")}</option>
                            {Object.entries(services).map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowReassignModal(false);
                                    setSelectedItem(null);
                                    setReassignError("");
                                }}
                                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                {t("Annuler")}
                            </button>
                            <button
                                onClick={confirmReassign}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                {t("Confirmer")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}