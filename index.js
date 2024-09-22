const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const port = 3000;

const API_KEY = "EN1QQGR-CNGME86-PS4AAM4-3VDST6S";
const top250Path = path.join(__dirname, "top250.json");

const fetchTop250Movies = async () => {
  try {
    const response = await axios.get("https://api.kinopoisk.dev/v1.4/movie?page=1&limit=250&selectFields=id&selectFields=name&selectFields=poster&selectFields=top250&notNullFields=top250&sortField=rating.kp&sortType=-1&type=movie", {
      headers: {
        "X-API-KEY": API_KEY,
        'accept': 'application/json',
      }
    });

    const movies = response.data.docs;
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

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
