const express = require("express");
const cors = require("cors");
const app = express();
const li_tache = require("./route/tache_route");

app.set("views","./page");       
app.set("view engine","ejs");    

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.use("/", li_tache);

app.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});
