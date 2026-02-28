const express = require("express")
const router = express.Router();
const db = require("../config/db")


router.get("/", (req, res) => {
    const recherche       = req.query.recherche       || "";
    const filtre_statut   = req.query.filtre_statut   || "";
    const filtre_priorite = req.query.filtre_priorite || "";


    let sql    = "SELECT * FROM tache WHERE 1=1";
    let params = [];

    
    if (recherche !== "") {
        sql += " AND (titre LIKE ? OR description LIKE ?)";
        params.push("%" + recherche + "%");
        params.push("%" + recherche + "%");
    }

    
    if (filtre_statut !== "") {
        sql += " AND statut = ?";
        params.push(filtre_statut);
    }


    if (filtre_priorite !== "") {
        sql += " AND priorite = ?";
        params.push(filtre_priorite);
    }

    db.query(sql, params, (err, taches) => {
        if (err) return res.status(500).json(err);


        const aujourd_hui = new Date().toISOString().slice(0, 10);
        taches.forEach(function(tache) {
            tache.en_retard = (tache.statut.toLowerCase() !== "terminer" && tache.date_limite < aujourd_hui);
        });

        res.render('index', {
            taches:           taches,
            recherche:        recherche,
            filtre_statut:    filtre_statut,
            filtre_priorite:  filtre_priorite
        });
    });
});


router.post("/tache", (req, res) => {
    const { titre, description, responsable, priorite, date_limite, statut } = req.body;

    const date_creation = new Date().toISOString().slice(0, 10);
    const sql = "INSERT INTO tache (titre, description, responsable, priorite, date_creation, date_limite, statut) VALUES (?, ?, ?, ?, ?, ?, ?)";


    db.query(sql, [titre, description, responsable, priorite, date_creation, date_limite, statut], (err, result) => {
        if (err) return res.status(500).json(err);
        res.redirect('/');
    });
});

router.post("/tache/:id/delete", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM tache WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.redirect('/');
    });
});


router.post("/modifier/:id", (req, res) => {
    const { titre, description, priorite, date_limite, responsable } = req.body;
    db.query("UPDATE tache SET titre=?, description=?, priorite=?, date_limite=?, responsable=? WHERE id=?",
        [titre, description, priorite, date_limite, responsable, req.params.id], () => res.redirect("/"));
});


router.get("/modifier/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM tache WHERE id = ?", [id], (err, result) => {
        if (err || result.length === 0) return res.redirect("/");
        res.render("tache_modifier", { tache: result[0] });
    });
});

router.get("/changer/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT statut FROM tache WHERE id=?", [id], (err, result) => {
        if (err || result.length === 0) return res.redirect("/");
        let nouveau;
        if (result[0].statut.toLowerCase() === "a faire") nouveau = "en cours";
        else if (result[0].statut.toLowerCase() === "en cours") nouveau = "Terminer";
        else return res.redirect("/");
        db.query("UPDATE tache SET statut=? WHERE id=?", [nouveau, id], () => res.redirect("/"));
    });
});


router.get("/dashboard", (req, res) => {

    db.query("SELECT statut, priorite, date_limite FROM tache", (err, taches) => {
        if (err) return res.status(500).send("Erreur DB");

        const aujourd_hui = new Date().toISOString().slice(0, 10);

        let total     = taches.length;
        let terminee  = 0;
        let retard    = 0;
        let priorites = { basse: 0, moyenne: 0, haute: 0 };

        taches.forEach(function(tache) {

            // Compter les terminées
            if (tache.statut.toLowerCase() === "terminer") terminee++;

            // Compter les retards
            let dl = tache.date_limite ? new Date(tache.date_limite).toISOString().slice(0,10) : null;
            if (tache.statut.toLowerCase() !== "terminer" && dl && dl < aujourd_hui) retard++;

            // Compter les priorités
            if (priorites[tache.priorite] !== undefined) priorites[tache.priorite]++;
        });

        // Calculer le pourcentage
        let pct = total > 0 ? Math.round((terminee / total) * 100) : 0;

        res.render("tableau_bord", {
            total:     total,
            terminee:  terminee,
            retard:    retard,
            pct:       pct,
            priorites: priorites
        });
    });
});

module.exports = router;
