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

app.get("/", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/index");
  }
});

// Alkaa koko Js serverin koodi tästä..
app.get("/index", async (req, res) => {
  if (!req.session.user) {
    // Muistutus Roope, tämä kohta tarkistaa että onko käyttäjä kirjautunut.
    return res.redirect("/register");
  }
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/categories.php`
    );
    const data = await response.json();
    const categories = data.categories;
    res.render("index", { categories, username: req.session.username }); // lisätty username: req.session.username uloskirjautumista varten
  } catch (error) {
    console.error("Virhe haettaessa eri KATEGORIOITA:", error);
    res.status(500).send("API-haku EPÄONNISTUI");
  }
});

//uloskirjautuminen
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});
//uloskirjautuminen

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
});

app.post("/login", (req, res) => {
  const { identifier, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ? OR email = ?";
  connection.query(query, [identifier, identifier], async (err, results) => {
    if (err) {
      console.error("Tietokantavirhe:", err);
      return res.status(500).send("Virhe kirjautumisessa, yritä uudelleen.");
    }

    if (results.length === 0) {
      return res.status(400).send("VIRHEELLINEN käyttäjätunnus tai salasana");
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(400).send("VIRHEELLINEN käyttäjätunnus tai salasana");
    }

    req.session.user = { id: user.id, username: user.username };
    res.redirect("/index");
  });
});
// login kohta loppuu

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

/*LOGOUT KOHTA ALKAA
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/register");
  });
}); */ // LOGOUT KOHTA LOPPUU

// haku kohta alkaa
app.get("/search", async (req, res) => {
  const searchQuery = req.query.q;
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchQuery}`
    );
    const data = await response.json();
    console.log(data);
    let meals = data.meals;

    const response2 = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchQuery}`
    );
    const data2 = await response2.json();
    console.log(data2);
    if (!meals) {
      meals = []; // Jos ei löydy, tyhjennetään taulukko
    }
    const meals2 = meals.concat(data2.meals);

    if (meals2 && meals2.length > 0) {
      res.render("category", { meals: meals2, categoryName: "Hakutulokset" });
    } else {
      res.status(404).send("Reseptiä ei löytynyt.");
    }
  } catch (error) {
    console.error("VIRHE HAETTAESSA RESEPTEJÄ HAKUTOIMINNOLLA:", error);
    res.status(500).send("API-haku EPÄONNISTUI");
  }
});
//haku kohta loppuu tähän

//Arvostelujen mahdollistaminen/lisääminen ALKAA TÄSTÄ!!
app.post("/review", (req, res) => {
  const { mealId, rating, comment } = req.body;
  const userId = req.session.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Kirjaudu sisään arvostellaksesi" });
  }

  if (rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ message: "Arvion täytyy olla välillä 1–5 tähteä" });
  }

  const query = `INSERT INTO reviews (user_id, mealid, rating, comment) VALUES (?, ?, ?, ?)`;
  connection.query(query, [userId, mealId, rating, comment], (err, result) => {
    if (err)
      return res.status(500).json({ message: "Virhe arvostelua tallentaessa" });
    res.status(201).json({ message: "Arvostelu tallennettu!" });
    console.log("Meal ID:", mealId); // Debugggausta varten tehty!!
  });
});
//ARVOSTELUJEN MAHDOLLISTAMINEN/LISÄÄMINEN LOPPUU TÄHÄN!!

//loppuuu koko js tähän..
app.listen(port, host, () => {
  console.log(` http://localhost:${port} kuunteleee.......`);
});
