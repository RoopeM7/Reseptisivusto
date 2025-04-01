import express from "express";
import path from "path";
import mysql from "mysql2";
import session from "express-session";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
const port = 3000;
const host = "localhost";

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "reseptisivusto",
});

const app = express();
app.set("view engine", "ejs");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../views")));
app.use(express.static("includes"));

// MIDDLEWARE KOHTA!!!!
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "salainenavain",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
// MIDDLEWARE KOHTA LOPPUU

// Alkaa koko Js serverin koodi tästä..
app.get("/", async (req, res) => {
  if (!req.session.user_id) {
    // Muistutus Roope, tämä kohta tarkistaa että onko käyttäjä kirjautunut.
    return res.redirect("/register");
  }
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

// REKISTERÖINTI KOHTA!!
app.get("/register", async (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  connection.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        console.error("Virhe TIETOKANNASSA:", err);
        return res.status(500).send("Virhe kirjautumisessa");
      }

      if (results.length > 0) {
        return res.status(400).send("Käyttäjänimi on jo käytössä");
      }

      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).send("Virhe salasanan hashauksessa");
        }
        const query =
          "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        connection.query(
          query,
          [username, email, hashedPassword],
          (err, results) => {
            if (err) {
              console.error("Virhe käyttäjän lisäämisessä:", err);
              return res.status(500).send("Virhe käyttäjän lisäämisessä");
            }
            res.redirect("/login"); // Jos koko hoito onnistuu hänet ohjataan kirjautumis sivulle kirjautumaan.
          }
        );
      });
    }
  );
}); // REKISTERÖINTIKOHTA LOPPUU

// login kohta ALKAA
app.get("/login", (req, res) => {
  res.render("login");
}); // login kohta loppuu

//kategoria kohta
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
}); //kategoria kohta loppuu

// LOGOUT KOHTA ALKAA
// app.get("/logout", (req, res) => {
// req.session.destroy(() => {
//  res.redirect("/login");
// });
// }); // LOGOUT KOHTA LOPPUU

//loppuuu koko js tähän..
app.listen(port, host, () => {
  console.log(` http://localhost:${port} kuunteleee.......`);
});
