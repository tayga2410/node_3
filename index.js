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

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
