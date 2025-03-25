import express from "express";
import path from "path";
//import mysql from "mysql2/promise";
//import session from "express-session";
//import bcrypt from "bcrypt";
import fetch from "node-fetch";
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
app.get("/", async (req, res) => {
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/categories.php`
    );
    const data = await response.json();
    const categories = data.categories;

    res.render("index", { categories });
  } catch (error) {
    console.error("Virhe haettaessa eri KATEGORIOITA:", error);
    res.status(500).send("API-haku EPÄONNISTUI");
  }
});

app.get("/category/:categoryName", async (req, res) => {
  const categoryName = req.params.categoryName;
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoryName}`
    );
    const data = await response.json();
    const meals = data.meals;

    res.render("category", { meals, categoryName });
  } catch (error) {
    console.error(`VIRHE HAETTAESSA ${categoryName} reseptejä:`, error);
    res.status(500).send("API-haku EPÄONNISTUI");
  }
});

app.get("/reseptisivu/:id", async (req, res) => {
  const recipeId = req.params.id;
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`
    );
    const data = await response.json();
    const resepti = data.meals[0]; // [0] avulla tulee ensimmäinen resepti

    res.render("reseptisivu", { resepti });
  } catch (error) {
    console.error("VIRHE HAETTAESSA RESEPTEJÄ:", error);
    res.status(500).send("API-haku EPÄONNISTUI!!!");
  }
});

//loppuuu koko js tähän..
app.listen(port, host, () => {
  console.log(` http://localhost:${port} kuunteleee.......`);
});
