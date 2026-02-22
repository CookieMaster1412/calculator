let alleBuecher = [];

const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSxOwfniKdDJa8-kRTAJ1cXBSELBJ8Q6m2Jory9Vp3pJcC86Tn2FO6qSgEpD2qT8a6cRxiRh6LC6sGd/pub?output=csv";

fetch(url)
  .then(response => response.text())
  .then(text => {
    const zeilen = text.split("\n");

    let genres = new Set();
    let sprachen = new Set();
    let bucharten = new Set();
    let besitzerSet = new Set();

    for (let i = 1; i < zeilen.length; i++) {
      if (!zeilen[i]) continue;

      const spalten = zeilen[i]
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map(s => s.replace(/^"|"$/g, '').trim());
      while (spalten.length < 11) spalten.push("");

      const titel = spalten[0] ? spalten[0] : "Unbekannt";
      const autor = spalten[1] ? spalten[1] : "Unbekannt";
      const seiten = spalten[2] ? parseInt(spalten[2]) : null;
      const buchart = spalten[3] || "";
      const genre = spalten[4] || "";
      const sprache = spalten[5] || "";
      const erscheinungsjahr = spalten[6] ? parseInt(spalten[6]) : null;
      const isbn = spalten[7] || "";
      const gelesen = spalten[8] || "";
      const cover = spalten[9] && spalten[9].startsWith("http")
        ? spalten[9]
        : "https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png";
      const besitzer = spalten[11] || "";
      const serie = spalten[10] || "";

      alleBuecher.push({titel, autor, buchart, genre, sprache, gelesen, cover, seiten, erscheinungsjahr, isbn, serie, besitzer});

      if (genre) {
        genre.split(/[,\/;]/).forEach(t => {
          t = t.trim();
          if (t) genres.add(t);
        });
      }

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

      if (besitzer) besitzerSet.add(besitzer);
    }

    // Dropdowns alphabetisch füllen
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

    const selectBesitzer = document.getElementById("filterBesitzer");
    [...besitzerSet].sort((a,b) => a.localeCompare(b)).forEach(b => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      selectBesitzer.appendChild(opt);
    });

    // Event-Listener für alle Filter gleichzeitig
    ["suche","filterGenre","filterSprache","filterBuchart","filterGelesen",
     "minSeiten","maxSeiten","minJahr","maxJahr","filterBesitzer"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(el.tagName === "INPUT" ? "input" : "change", filterBuecher);
    });

    // Bücher initial anzeigen
    zeigeBuecher(alleBuecher);
  });

// Funktion: Bücher ins Grid schreiben
function zeigeBuecher(buecher) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  buecher.forEach(b => {
    const div = document.createElement("div");
    div.className = "buch";

    // leichte goldene Färbung, wenn gelesen
    div.style.backgroundColor = b.gelesen.toLowerCase() === "ja" ? "#fff8e1" : "#f9f9f9";

    div.innerHTML = `
      <img src="${b.cover}" alt="Cover"
        loading="lazy"
        onerror="this.src='https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png'">
      <div class="titel">${b.titel}</div>
      <div class="autor">${b.autor}</div>
    `;

    grid.appendChild(div);

    // Modal öffnen beim Klick
    div.addEventListener("click", () => {
      const modalImg = document.getElementById("modalCover");
        modalImg.src = b.cover;
        modalImg.onerror = () => {
          modalImg.src = "https://bookstoreromanceday.org/wp-content/uploads/2020/08/book-cover-placeholder.png";
        };
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

// Funktion: Filter anwenden
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
  const besitzer = document.getElementById("filterBesitzer").value;

  const gefiltert = alleBuecher.filter(b => {
    const buchSprachen = (b.sprache || "").split(/[,\/;]/).map(s => s.trim());
    const buchArten = (b.buchart || "").split(/[,\/;]/).map(s => s.trim());
    const buchGenres = (b.genre || "").split(/[,\/;]/).map(g => g.trim());

    return (
      (b.titel.toLowerCase().includes(query) || 
       b.autor.toLowerCase().includes(query) || 
       b.isbn.toLowerCase().includes(query) ||
      b.serie.toLowerCase().includes(query)) &&
      (genre === "" || buchGenres.includes(genre)) &&
      (sprache === "" || buchSprachen.includes(sprache)) &&
      (buchart === "" || buchArten.includes(buchart)) &&
      (gelesen === "" || b.gelesen === gelesen) &&
      (
  (minSeiten === 0 && maxSeiten === Infinity)
    ? true
    : (b.seiten !== null && b.seiten >= minSeiten && b.seiten <= maxSeiten)
) &&
(
  (minJahr === 0 && maxJahr === Infinity)
    ? true
    : (b.erscheinungsjahr !== null && b.erscheinungsjahr >= minJahr && b.erscheinungsjahr <= maxJahr)
)&&
      (besitzer === "" || b.besitzer === besitzer)
    );
  });

  zeigeBuecher(gefiltert);
}

// Modal schließen
document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
});

// Modal auch schließen, wenn außerhalb geklickt wird
window.addEventListener("click", e => {
  if (e.target.id === "modal") {
    document.getElementById("modal").style.display = "none";
  }
});