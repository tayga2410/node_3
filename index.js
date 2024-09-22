const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(express.json());

const API_KEY = "EN1QQGR-CNGME86-PS4AAM4-3VDST6S";
const top250Path = path.join(__dirname, "top250.json");

const fetchTop250Movies = async () => {
  try {
    const response = await axios.get("https://api.kinopoisk.dev/v1.4/movie?page=1&limit=250&selectFields=name&selectFields=poster&selectFields=top250&notNullFields=top250&sortField=rating.kp&sortType=-1&type=movie", {
      headers: {
        "X-API-KEY": API_KEY,
        'accept': 'application/json',
      }
    });

    const movies = response.data.docs.map((movie, index) => ({
      id: index + 1, 
      name: movie.name,
      poster: movie.poster,
      top250: movie.top250,
    }));
    
    fs.writeFileSync(top250Path, JSON.stringify(movies, null, 2), "utf-8");
    console.log("Файл top250.json успешно создан!");
    return movies;
  } catch (error) {
    console.error("Ошибка при получении данных:", error);
    return [];
  }
};

const getMoviesFromFile = () => {
  try {
    const data = fs.readFileSync(top250Path, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Ошибка при чтении файла:", error);
    return [];
  }
};

app.get("/api/films/readall", async (req, res) => {
  if (!fs.existsSync(top250Path)) {
    console.log("Файл top250.json не найден. Получение данных с Кинопоиска...");
    const movies = await fetchTop250Movies();
    const sortedMovies = movies.sort((a, b) => a.position - b.position);
    return res.json(sortedMovies);
  } else {
    console.log("Чтение данных из файла top250.json...");
    const movies = getMoviesFromFile();
    const sortedMovies = movies.sort((a, b) => a.position - b.position);
    return res.json(sortedMovies);
  }
});

app.get("/api/films/read", (req, res) => {
  const { id } = req.query;
  const movies = getMoviesFromFile();
  const movie = movies.find(movie => movie.id === Number(id)); 
  if (!movie) {
    return res.status(404).json({ error: "Фильм не найден" });
  }
  return res.json(movie);
});

app.post("/api/films/create", (req, res) => {
  const { name, poster, top250 } = req.body;

  if (!name || !poster || top250 === undefined) {
    return res.status(400).json({ error: "Недостаточно данных для создания фильма" });
  }

  const movies = getMoviesFromFile();

  movies.forEach(movie => {
    if (movie.top250 >= top250) {
      movie.top250 += 1; 
    }
  });

  const newMovie = {
    id: movies.length > 0 ? Math.max(...movies.map(movie => movie.id)) + 1 : 1, 
    name,
    poster,
    top250
  };

  movies.push(newMovie);
  
  movies.sort((a, b) => a.top250 - b.top250);

  fs.writeFileSync(top250Path, JSON.stringify(movies, null, 2), "utf-8");
  
  return res.status(201).json(newMovie);
});

app.post("/api/films/update", (req, res) => {
  const { id, name, poster, top250 } = req.body;
  const movies = getMoviesFromFile();
  const movie = movies.find(movie => movie.id === id);

  if (!movie) {
    return res.status(404).json({ error: "Фильм не найден" });
  }

  if (name) movie.name = name;
  if (poster) movie.poster = poster;

  if (top250 !== undefined) {
    if (movies.some(m => m.top250 === top250 && m.id !== id)) {
      movies.forEach(m => {
        if (m.top250 >= top250 && m.id !== id) {
          m.top250++;
        }
      });
    }
    movie.top250 = top250;
  }

  fs.writeFileSync(top250Path, JSON.stringify(movies, null, 2), "utf-8");

  return res.json(movie);
});

app.delete("/api/films/delete", (req, res) => {
  const { id } = req.body;
  const movies = getMoviesFromFile();
  const movieIndex = movies.findIndex(movie => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ error: "Фильм не найден" });
  }

  movies.splice(movieIndex, 1);

  movies.forEach((movie, index) => {
    movie.top250 = index + 1;
  });

  fs.writeFileSync(top250Path, JSON.stringify(movies, null, 2), "utf-8");

  return res.json({ message: "Фильм удалён" });
});



app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
