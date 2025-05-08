import express from "express"; // MUISTA ROOPE KORJATA SUOSIKKIRESEPTI NAPPI TOIMINTO KAIKKI
import path from "path";
import mysql from "mysql2";
import session from "express-session";
import bcrypt from "bcrypt";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import fs from "fs/promises";
const port = 3000;
const host = "localhost";
// SUPERDUPER TÄRKEÄ TÄMÄ YHDISTÄÄ TIETOKANNAN!!!!!!!!!!
const jsonData = await fs.readFile("./dbconfig.json", "utf-8");
const dbconfig = JSON.parse(jsonData);
// YHDISTÄÄ TIETOKANNNANNN!!!!!!!!!!
const connection = mysql.createConnection(dbconfig);

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
  const error = req.session.error;
  delete req.session.error;
  res.render("login", { error });
});

app.post("/login", (req, res) => {
  const { identifier, password } = req.body;

  const query = "SELECT * FROM users WHERE username = ? OR email = ?";
  connection.query(query, [identifier, identifier], async (err, results) => {
    if (err) {
      console.error("Tietokantavirhe:", err);
      req.session.error = "PALVELIN VIRHE. Yritä uudelleen.";
      return res.redirect("/login");
    }

    if (results.length === 0) {
      req.session.error = "Virheellinen käyttäjätunnus tai salasana.";
      return res.redirect("/login");
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      req.session.error = "Virheellinen käyttäjätunnus tai salasana.";
      return res.redirect("/login");
    }

    req.session.user = { id: user.id, username: user.username };
    res.redirect("/index");
  });
});
// login kohta loppuu!!

//Profiili kohta alkaa!!
app.get("/profile", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user.id; // HAEMME käyttäjän ID sessionista!!

    const [users] = await connection
      .promise()
      .query("SELECT id, username FROM users WHERE id = ?", [userId]); // HAEMME  käyttäjän tiedot!!
    const user = users[0];

    // HAEMME KÄYTTÄJÄN KAIKKI ARVOSTELUT JÄTTÄEN SUOSIKIT POIS!!
    const [rawReviews] = await connection.promise().query(
      `
      SELECT * FROM reviews 
      WHERE user_id = ? 
        AND (rating IS NOT NULL OR comment IS NOT NULL)
      ORDER BY created DESC
    `,
      [userId]
    );

    // HAKEE kaikki käyttäjän suosikit!!
    const [rawFavorites] = await connection.promise().query(
      `
      SELECT * FROM reviews 
      WHERE user_id = ? 
        AND is_favorite = 1
      ORDER BY created DESC
    `,
      [userId]
    );

    // Muodostetaan suosikkireseptit
    const favoriteReviews = await Promise.all(
      rawFavorites.map(async (review) => {
        try {
          const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${review.recipe_id}`
          );
          const data = await response.json();
          const recipe = data.meals ? data.meals[0] : null;

          // Tarkistetaan onko resepti arvosteltu!!
          const isReviewed = rawReviews.some(
            (r) => r.recipe_id === review.recipe_id
          );

          return {
            ...review,
            recipe_name: recipe ? recipe.strMeal : "Tuntematon resepti",
            recipe_thumb: recipe ? recipe.strMealThumb : "",
            isReviewed, // katsomme onko tämä suosikki myös arvosteltu
          };
        } catch (error) {
          console.error("Error fetching favorite recipe:", error.message);
          return {
            ...review,
            recipe_name: "Tuntematon resepti",
            recipe_thumb: "",
            isReviewed: false,
          };
        }
      })
    );

    // Muokkaa ja yhdistäää kaikki arvostelut!!
    const updatedReviews = await Promise.all(
      rawReviews.map(async (review) => {
        try {
          const response = await fetch(
            `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${review.recipe_id}`
          );
          const data = await response.json();
          const recipe = data.meals ? data.meals[0] : null;

          return {
            ...review,
            recipe_name: recipe ? recipe.strMeal : "Tuntematon resepti",
            recipe_thumb: recipe ? recipe.strMealThumb : "",
          };
        } catch (error) {
          console.error("Error fetching recipe:", error.message);
          return {
            ...review,
            recipe_name: "Tuntematon resepti",
            recipe_thumb: "",
          };
        }
      })
    );

    // lataa profiilisuvun ja sen tiedot, arvostelut, suosikit jnejne..
    res.render("profile", {
      user,
      reviews: updatedReviews, // Käyttäjän kaikki arvostelut
      favorites: favoriteReviews, // Käyttäjän suosikkireseptit
    });
  } catch (error) {
    console.error("Virhe profiilin luonnissa:", error);
    res.status(500).send("Jotain meni pieleen...");
  }

  process.on("exit", () => {
    connection.end();
  });
});

//Profiili kohta loppuu!!

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
}); // kategoria kohta loppuu
//Reseprti sivu kohta alkaa
app.get("/reseptisivu/:id", async (req, res) => {
  const recipeId = req.params.id; // reseptinid
  const userId = req.session.user?.id; // käyttäjän ID, jos on kirjautunut

  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}` // TÄMÄ HAKEE RESEPTIN APISTA!!
    );
    const data = await response.json();
    const resepti = data.meals ? data.meals[0] : null; // TARKISTUS ETTÄ RESEPTI LÖYTYISI!!

    if (!resepti) {
      return res.status(404).send("Reseptiä ei löytynyt.");
    }

    // Hakees arvostelut tietokannasta
    const reviewsQuery = `
  SELECT reviews.rating, reviews.comment, users.username
  FROM reviews
  JOIN users ON reviews.user_id = users.id
  WHERE reviews.recipe_id = ?
    AND reviews.comment IS NOT NULL
    AND reviews.rating IS NOT NULL
`;
    // Lisätty reviews.comment ja reviews.rating IS NOT NULL jotta reseptin poistaminen onnistuisi!!
    connection.query(reviewsQuery, [recipeId], (err, reviewRows) => {
      if (err) {
        console.error("Virhe arvostelujen haussa:", err);
        return res.status(500).send("Virhe arvostelujen haussa");
      }

      // Tämä hakee ja tekee arvosteluiden keskiarvon!!
      const avgQuery = `
        SELECT AVG(rating) AS avgRating FROM reviews WHERE recipe_id = ?
      `;
      connection.query(avgQuery, [recipeId], (err, avgRows) => {
        if (err) {
          console.error("Virhe keskiarvohaussa:", err);
          return res.status(500).send("Virhe keskiarvon haussa");
        }

        const avg = avgRows[0].avgRating;
        const formattedAvg = avg ? parseFloat(avg).toFixed(1) : null;

        // Tarkistaa onko resepti jo suosikki käyttäjällä
        let isFavorite = false;
        if (userId) {
          const checkFavoriteQuery = `
            SELECT * FROM reviews WHERE user_id = ? AND recipe_id = ? AND is_favorite = 1
          `;
          connection.query(
            checkFavoriteQuery,
            [userId, recipeId],
            (err, favoriteRows) => {
              if (err) {
                console.error("Virhe suosikin tarkistuksessa:", err);
              }
              // Jos löytyy suosikkiksi merkitty resepti, tämä laittaa is Favorite true jotta ei voi uudestaan lisää suosikiksi!!!
              isFavorite = favoriteRows.length > 0;

              // Renderöidään resepti, arvostelut ja suosikkitieto
              res.render("reseptisivu", {
                resepti,
                reviews: reviewRows,
                avgRating: formattedAvg,
                user: req.session.user,
                recipeId: recipeId,
                isFavorite: isFavorite, // Lähettää tiedon, onko juuri tämä resepti jo suosikki!!
              });
            }
          );
        } else {
          // Jos käyttäjä ei ole kirjautunut, renderöidään vain resepti ja arvostelut
          res.render("reseptisivu", {
            resepti,
            reviews: reviewRows,
            avgRating: formattedAvg,
            user: req.session.user,
            recipeId: recipeId,
            isFavorite: false, // Käyttäjä ei ole kirjautunut, reseptin on mahdotonta olla suosikissa!!
          });
        }
      });
    });
  } catch (error) {
    console.error("VIRHE HAETTAESSA RESEPTIÄ:", error);
    res.status(500).send("API-haku epäonnistui");
  }
});
//resepti sivu kohta loppuu

// haku kohta alkaa
app.get("/search", async (req, res) => {
  const searchQuery = req.query.q;
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchQuery}`
    );
    const data = await response.json();
    let meals = data.meals;

    const response2 = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${searchQuery}`
    );
    const data2 = await response2.json();

    if (!meals) {
      meals = [];
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
// haku kohta loppuu tähän

//Arvostelujen mahdollistaminen/lisääminen ALKAA TÄSTÄ!!
app.post("/review", (req, res) => {
  const { mealId, rating, comment } = req.body;
  const userId = req.session.user?.id;

  if (!userId) {
    return res.status(401).send("Kirjaudu sisään arvostellaksesi.");
  }

  const parsedRating = parseInt(rating);

  if (parsedRating < 1 || parsedRating > 5) {
    return res.status(400).send("Arvion täytyy olla välillä 1–5 tähteä.");
  }

  // Tarkista onko kÄYTTÄJÄ JO arvosteelllut juuri tämän reseptinn
  const checkReviewQuery = `
    SELECT * FROM reviews
    WHERE user_id = ? AND recipe_id = ? AND (rating IS NOT NULL OR comment IS NOT NULL)
  `;

  connection.query(
    checkReviewQuery,
    [userId, mealId],
    (err, existingReview) => {
      if (err) {
        console.error("Virhe tarkistettaessa arvostelua:", err);
        return res.status(500).send("Virhe tarkistettaessa arvostelua.");
      }

      if (existingReview.length > 0) {
        return res.status(400).send("Olet jo arvostellut tämän reseptin.");
      }

      // Jos ei ole arvosteltu, tulee/lisää uuden arvostelun!
      const insertQuery = `
      INSERT INTO reviews (user_id, recipe_id, rating, comment)
      VALUES (?, ?, ?, ?)
    `;

      connection.query(
        insertQuery,
        [userId, mealId, parsedRating, comment],
        (err, result) => {
          if (err) {
            console.error("Virhe arvostelua tallentaessa:", err);
            return res.status(500).send("Virhe arvostelua tallentaessa.");
          }

          console.log("Arvostelu tallennettu käyttäjältä:", userId);

          // Ohjaa takaisin reseptisivull
          res.redirect(`/reseptisivu/${mealId}`);
        }
      );
    }
  );
});

app.get("/reviews/:mealId", (req, res) => {
  const mealid = req.params.mealid;

  const arvio = `SELECT user_id, rating, comment, datetime(created, 'localtime') as created FROM reviews WHERE recipe_id = ? ORDER BY created DESC`;

  const keskiarvio = `SELECT ROUND(AVG(rating), 1) as average FROM reviews WHERE recipe_id = ?`;

  connection.query(arvio, [mealid], (err, arvio) => {
    if (err) {
      console.error("Arvostelujen hakuvirhe:", err);
      return res.status(500).json({ message: "Virhe arvostelun haettaessa" });
    }

    connection.query(keskiarvio, [mealid], (err, keskiarvio) => {
      if (err) {
        console.error("Keskiarvion hakuvirhe:", err);
        return res
          .status(500)
          .json({ message: "Virhe keskiarvion haettaessa" });
      }

      const keskiarvo = keskiarvio[0].average || 0;
      res.json({ keskiarvo, arvio });
    });
  });
});
//ARVOSTELUJEN MAHDOLLISTAMINEN/LISÄÄMINEN LOPPUU TÄHÄN!!

// tästä alkaa suosikkireseptin lisääminen Profiiliin!!
app.post("/lisaa-suosikiksi", async (req, res) => {
  const userId = req.session.user.id;
  const recipeId = req.body.recipeId;

  try {
    // TARKASTAA, ONKO KÄYTTÄJÄ ARVOSTELLUT RESEPTIN
    const [existingReview] = await connection
      .promise()
      .query("SELECT * FROM reviews WHERE user_id = ? AND recipe_id = ?", [
        userId,
        recipeId,
      ]);

    if (existingReview.length === 0) {
      // Jos arvostelua ei ole, luodaan uusi arvostelu
      await connection.promise().query(
        "INSERT INTO reviews (user_id, recipe_id, is_favorite) VALUES (?, ?, ?)",
        [userId, recipeId, 1] // MERKITÄÄN TÄMÄ RESEPTI SUOSIKIKSI
      );
    } else {
      // Jos arvostelu on jo olemassa päivitetään se suosikiksi
      await connection
        .promise()
        .query(
          "UPDATE reviews SET is_favorite = 1 WHERE user_id = ? AND recipe_id = ?",
          [userId, recipeId]
        );
    }
    res.redirect("/profile");
  } catch (error) {
    console.error("Virhe suosikin lisäämisessä:", error);
    res.status(500).send("Suosikkia ei voitu lisätä.");
  }
});

// tähän loppuu suosikkireseptin lisääminen Profiiliin!!

// TÄSTÄ ALKAA suosikki reseptin poistaminen!!!
app.post("/poista-suosikista", async (req, res) => {
  const { recipeId } = req.body;
  const userId = req.session.user.id;

  try {
    // Päivittää `is_favorite` kenttän jotta se ei enää näy profiili sivulla!!
    await connection
      .promise()
      .query(
        "UPDATE reviews SET is_favorite = 0 WHERE user_id = ? AND recipe_id = ?",
        [userId, recipeId]
      );

    res.redirect("/profile"); // Siirtää meidät takaisin profiilisivulle
  } catch (error) {
    console.error("Virhe suosikin poistossa:", error);
    res.status(500).send("Suosikin poistaminen epäonnistui.");
  }
});
// TÄHÄN LOPPUU suosikin poistaminen!!!!

// Arvostelun poistaminen funktio kohta!!!
app.post("/poista-arvostelu", async (req, res) => {
  const { reviewId } = req.body;
  try {
    await connection
      .promise()
      .query(`UPDATE reviews SET rating = NULL, comment = NULL WHERE id = ?`, [
        reviewId,
      ]);
    res.redirect("/profile");
  } catch (error) {
    console.error("Virhe arvostelun poistossa:", error);
    res.status(500).send("Arvostelua ei voitu poistaa.");
  }
});
// Arvostelun poistamis funktio kohta loppuu!!!

//loppuuu koko js tähän..
app.listen(port, host, () => {
  console.log(` http://localhost:${port} kuunteleee.......`);
});
