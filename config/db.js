const mysql=require("mysql2")

const db=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"FALLOU01",
    database:"projet_examen"
})
db.connect(err=>{
    if (err) {
      console.log("erreur",err);
         
    }
    console.log("vous connecter a mysql");
    
})
module.exports=db;
