let alleBuecher = [];

const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSxOwfniKdDJa8-kRTAJ1cXBSELBJ8Q6m2Jory9Vp3pJcC86Tn2FO6qSgEpD2qT8a6cRxiRh6LC6sGd/pub?output=csv";

fetch(url)
  .then(response => response.text())
  .then(text => {
    const zeilen = text.split("\n");

    let genres = new Set();
    let sprachen = new Set();
    let bucharten = new Set();

    for (let i = 1; i < zeilen.length; i++) {
      if (!zeilen[i]) continue;

      const spalten = zeilen[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      for (let j = 0; j <= 9; j++) {
        spalten[j] = spalten[j] ? spalten[j].replace(/^"|"$/g, '').trim() : "";
      }

      const titel = spalten[0];
      const autor = spalten[1];
      const seiten = parseInt(spalten[2]) || 0;
      const buchart = spalten[3] || "";
      const genre = spalten[4] || "";
      const sprache = spalten[5] || "";
      const erscheinungsjahr = parseInt(spalten[6]) || 0;
      const isbn = spalten[7] || "";
      const gelesen = spalten[8] || "";
      const cover = spalten[9] && spalten[9].startsWith("http")
        ? spalten[9]
        : "https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png";

      alleBuecher.push({titel, autor, buchart, genre, sprache, gelesen, cover, seiten, erscheinungsjahr, isbn});

      if (genre) genres.add(genre);

      if (buchart) {
        buchart.split(/[,\/;]/).forEach(b => {
          b = b.trim();
          if (b) bucharten.add(b);
        });
      }

      if (sprache) {
        sprache.split(/[,\/;]/).forEach(s => {
          s = s.trim();
          if (s) sprachen.add(s);
        });
      }
    }

    // Dropdowns füllen
    const selectGenre = document.getElementById("filterGenre");
        [...genres].sort((a,b) => a.localeCompare(b)).forEach(g => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        selectGenre.appendChild(opt);
        });

    const selectSprache = document.getElementById("filterSprache");
    [...sprachen].sort((a,b) => a.localeCompare(b)).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    selectSprache.appendChild(opt);
    });

    const selectBuchart = document.getElementById("filterBuchart");
        [...bucharten].sort((a,b) => a.localeCompare(b)).forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        selectBuchart.appendChild(opt);
        });

    // Bücher anzeigen
    zeigeBuecher(alleBuecher);

    // Event-Listener
    ["suche","filterGenre","filterSprache","filterBuchart","filterGelesen",
     "minSeiten","maxSeiten","minJahr","maxJahr"].forEach(id => {
      const el = document.getElementById(id);
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", filterBuecher);
    });
  });

function zeigeBuecher(buecher) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  buecher.forEach(b => {
    const div = document.createElement("div");
    div.className = "buch";
    div.innerHTML = `
      <img src="${b.cover}" alt="${b.titel}">
      <div class="titel">${b.titel}</div>
      <div class="autor">${b.autor}</div>
    `;
    grid.appendChild(div);
  });
}

function filterBuecher() {
  const query = document.getElementById("suche").value.toLowerCase();
  const genre = document.getElementById("filterGenre").value;
  const sprache = document.getElementById("filterSprache").value;
  const buchart = document.getElementById("filterBuchart").value;
  const gelesen = document.getElementById("filterGelesen").value;
  const minSeiten = parseInt(document.getElementById("minSeiten").value) || 0;
  const maxSeiten = parseInt(document.getElementById("maxSeiten").value) || Infinity;
  const minJahr = parseInt(document.getElementById("minJahr").value) || 0;
  const maxJahr = parseInt(document.getElementById("maxJahr").value) || Infinity;

  const gefiltert = alleBuecher.filter(b => {
    const buchSprachen = (b.sprache || "").split(/[,\/;]/).map(s => s.trim());
    const buchArten = (b.buchart || "").split(/[,\/;]/).map(s => s.trim());

    return (
      (b.titel.toLowerCase().includes(query) ||
       b.autor.toLowerCase().includes(query) ||
       b.isbn.toLowerCase().includes(query)) &&
      (genre === "" || b.genre === genre) &&
      (sprache === "" || buchSprachen.includes(sprache)) &&
      (buchart === "" || buchArten.includes(buchart)) &&
      (gelesen === "" || b.gelesen === gelesen) &&
      (b.seiten >= minSeiten && b.seiten <= maxSeiten) &&
      (b.erscheinungsjahr >= minJahr && b.erscheinungsjahr <= maxJahr)
    );
  });

  zeigeBuecher(gefiltert);
}

function zeigeBuecher(buecher) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  buecher.forEach(b => {
    const div = document.createElement("div");
    div.className = "buch";

    // Wenn Buch gelesen → leicht golden einfärben
    if (b.gelesen && b.gelesen.toLowerCase() === "ja") {
      div.style.backgroundColor = "#fff8e1"; // dezentes Gold
    } else {
      div.style.backgroundColor = "#f9f9f9"; // Standardfarbe
    }

    div.innerHTML = `
      <img src="${b.cover}" alt="${b.titel}">
      <div class="titel">${b.titel}</div>
      <div class="autor">${b.autor}</div>
    `;
    grid.appendChild(div);

    // Klick-Event für Modal
    div.addEventListener("click", () => {
      document.getElementById("modalCover").src = b.cover;
      document.getElementById("modalTitel").textContent = b.titel;
      document.getElementById("modalAutor").textContent = b.autor;
      document.getElementById("modalISBN").textContent = b.isbn;
      document.getElementById("modalSeiten").textContent = b.seiten;
      document.getElementById("modalJahr").textContent = b.erscheinungsjahr;
      document.getElementById("modalGenre").textContent = b.genre;
      document.getElementById("modalSprache").textContent = b.sprache;
      document.getElementById("modalBuchart").textContent = b.buchart;
      document.getElementById("modalGelesen").textContent = b.gelesen;

      document.getElementById("modal").style.display = "block";
    });
  });
}


// Modal schließen
document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
});

// Modal auch schließen, wenn man außerhalb klickt
window.addEventListener("click", e => {
  if (e.target.id === "modal") {
    document.getElementById("modal").style.display = "none";
  }
});
