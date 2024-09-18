const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

const API_KEY = "EN1QQGR-CNGME86-PS4AAM4-3VDST6S";
const top250Path = path.join(__dirname, "top250.json");

const fetchTop250Movies = async () => {
  try {
    const response = await fetch("https://api.kinopoisk.dev/v1.4/movie?limit=250&sortField=top250&sortType=1", {
  headers: {
    "X-API-KEY": API_KEY,
  },
});

    const data = await response.json();
    console.log("Ответ от API:", data);

    const movies = data.docs
      .filter((movie) => movie.top250 !== null)
      .map((movie) => ({
        id: movie.id,
        title: movie.name || "",
        rating: movie.rating.kp || 0,
        year: movie.year || 0,
        budget: movie.budget?.value || 0,
        gross: movie.fees?.world?.value || 0,
        poster: movie.poster?.url || "",
        position: movie.top250 || 0,
      }));

    fs.writeFileSync(top250Path, JSON.stringify(movies, null, 2), "utf-8");
    console.log("Файл top250.json успешно создан!");
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
  }
};

app.get("/api/films/readall", (req, res) => {
  fs.access(top250Path, fs.constants.F_OK, (err) => {
    if (err) {
      console.log("Файл не найден, начинаем загрузку данных...");
      fetchTop250Movies()
        .then(() => {
          fs.readFile(top250Path, "utf-8", (err, data) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Ошибка при чтении файла" });
            }
            const movies = JSON.parse(data);
            res.json(movies);
          });
        })
        .catch((fetchError) => {
          res.status(500).json({
            message: "Ошибка при загрузке данных с API",
            error: fetchError.message,
          });
        });
    } else {
      fs.readFile(top250Path, "utf-8", (err, data) => {
        if (err) {
          return res.status(500).json({ message: "Ошибка при чтении файла" });
        }
        const movies = JSON.parse(data);
        res.json(movies);
      });
    }
  });
});

app.get("/api/films/read", (req, res) => {
  const movieId = parseInt(req.query.id, 10); 

  if (!movieId) {
    return res.status(400).json({ message: "ID фильма не указан" });
  }

  fs.readFile(top250Path, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Ошибка при чтении файла" });
    }

    const movies = JSON.parse(data);
    const movie = movies.find((m) => m.id === movieId);

    if (!movie) {
      return res.status(404).json({ message: "Фильм не найден" });
    }

    res.json(movie);
  });
});

app.use(express.json()); 

app.get("/api/films/read", (req, res) => {
  const id = parseInt(req.query.id, 10);
  if (!id) {
    return res.status(400).json({ message: "ID фильма не указан" });
  }

  fs.readFile(top250Path, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Ошибка при чтении файла" });
    }

    const movies = JSON.parse(data);
    const movie = movies.find((m) => m.id === id);

    if (!movie) {
      return res.status(404).json({ message: "Фильм не найден" });
    }

    res.json(movie);
  });
});

app.post("/api/films/create", (req, res) => {
  const { title, rating, year, budget, gross, poster, position } = req.body;

  if (!title || !position) {
    return res.status(400).json({ message: "Некорректные данные" });
  }

  fs.readFile(top250Path, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Ошибка при чтении файла" });
    }

    const movies = JSON.parse(data);
    const existingMovie = movies.find((movie) => movie.position === position);

    if (existingMovie) {
      movies.forEach((movie) => {
        if (movie.position >= position) {
          movie.position += 1;
        }
      });
    }

    const newId = Math.max(...movies.map((movie) => movie.id)) + 1;
    const newMovie = {
      id: newId,
      title,
      rating: rating || 0,
      year: year || 0,
      budget: budget || 0,
      gross: gross || 0,
      poster: poster || "",
      position,
    };

    movies.push(newMovie);

    fs.writeFile(top250Path, JSON.stringify(movies, null, 2), "utf-8", (err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка при записи файла" });
      }

      res.status(201).json(newMovie);
    });
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
