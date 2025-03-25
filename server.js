import express from "express";
import path from "path";
//import mysql from "mysql2/promise";
//import session from "express-session";
//import bcrypt from "bcrypt";
//import fetch from "node-fetch";
import { fileURLToPath } from "url";
const port = 3000;
const host = "localhost";

const app = express();
app.set("view engine", "ejs");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../views")));
app.use(express.static("includes"));

// Alkaa koko Js serverin koodi tästä..
app.get("/", (req, res) => {
  res.render("index");
});

//loppuuu koko js tähän..
app.listen(port, host, () => {
  console.log(` http://localhost:${port} kuunteleee.......`);
});
