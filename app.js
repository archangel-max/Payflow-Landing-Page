/* =========================================================
   app.js  –  PayFlow live integrations
   ========================================================= */

// const ALPHA_VANTAGE_KEY = "GTLXVM0VYEO3F66F";
const ALPHA_VANTAGE_KEY = "5OTD3NA41UUNC6WQ";
const EXCHANGE_RATE_KEY = "d96823fddf450a5ec2cbd29e";
const GNEWS_KEY = "d05c44170bf96754d1e36cfc03a81a7c";

// ─── HELPERS ──────────────────────────────────────────────

function formatPrice(n) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// =========================================================
// 1.  STOCK CHART
// =========================================================
const container = document.getElementById("chart");

const chart = LightweightCharts.createChart(container, {
  width: document.getElementById("chart").clientWidth,
  height: 350,

  // ── Background & grid ──
  layout: {
    background: { color: "#1a1a1a" },
    textColor: "#94a3b8",
    fontFamily: "Manrope, sans-serif",
    fontSize: 11,
  },
  grid: {
    vertLines: { color: "rgba(148,163,184,0.1)" },
    horzLines: { color: "rgba(148,163,184,0.1)" },
  },
  // ── Crosshair ──
  crosshair: {
    vertLine: { color: "#0b57d0", labelBackgroundColor: "#0b57d0" },
    horzLine: { color: "#0b57d0", labelBackgroundColor: "#0b57d0" },
  },
  // ── Right price axis ──
  rightPriceScale: {
    borderColor: "rgba(148,163,184,0.2)",
  },
  // ── Time axis ──
  timeScale: {
    borderColor: "rgba(148,163,184,0.2)",
    timeVisible: true,
  },
});

// Watches the container and resizes the chart to always fit
const resizeObserver = new ResizeObserver((entries) => {
  const { width, height } = entries[0].contentRect;
  chart.applyOptions({
    width: width,
    height: height || 350,
  });
  chart.timeScale().fitContent();
});

resizeObserver.observe(container);

const candleSeries = chart.addCandlestickSeries({
  upColor: "#067a58", // green candle body
  downColor: "#c21f2f", // red candle body
  borderUpColor: "#067a58",
  borderDownColor: "#c21f2f",
  wickUpColor: "#067a58",
  wickDownColor: "#c21f2f",
});

// 1. DEFINE FIRST (IMPORTANT)
let lastCandle = {
  time: Math.floor(Date.now() / 1000),
  open: 100,
  high: 105,
  low: 95,
  close: 102,
};

// 2. RANDOM GENERATOR
function getRandomCandle(last) {
  const change = (Math.random() - 0.5) * 1000;

  const open = last.close;
  const close = open + change;

  return {
    time: Math.floor(Date.now() / 1000),
    open: open,
    high: Math.max(open, close) + Math.random(),
    low: Math.min(open, close) - Math.random(),
    close: close,
  };
}

// 3. SET INITIAL DATA
candleSeries.setData([lastCandle]);

// 4. LIVE UPDATE LOOP
setInterval(() => {
  const newCandle = getRandomCandle(lastCandle);

  candleSeries.update(newCandle);

  lastCandle = newCandle;
}, 2000);

// =========================================================
// 2.  CURRENCY CONVERTER
// =========================================================
const API_KEY = "YOUR_API_KEY_HERE"; // Get free key from exchangerate-api.com

const amountInput = document.getElementById("amount");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const convertedAmount = document.getElementById("convertedAmount");
const exchangeRateDisplay = document.getElementById("exchangeRate");

// Fetch exchange rate and convert
async function convertCurrency() {
  const amount = amountInput.value || 1;
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (!amount || amount < 0) return;

  exchangeRateDisplay.textContent = "Loading...";
  exchangeRateDisplay.classList.add("loading");

  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`,
    );
    const data = await response.json();
    const rate = data.rates[to];
    const converted = (amount * rate).toFixed(2);

    convertedAmount.value = converted;
    exchangeRateDisplay.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    exchangeRateDisplay.classList.remove("loading");
  } catch (error) {
    exchangeRateDisplay.textContent = "Error fetching exchange rate";
    console.error("Error:", error);
  }
}

function swapCurrencies() {
  [fromCurrency.value, toCurrency.value] = [
    toCurrency.value,
    fromCurrency.value,
  ];
  convertCurrency();
}

// Event listeners
amountInput.addEventListener("input", convertCurrency);
fromCurrency.addEventListener("change", convertCurrency);
toCurrency.addEventListener("change", convertCurrency);

// Initial conversion
convertCurrency();

// =========================================================
// 3.  FINANCIAL NEWS
// =========================================================

async function loadNews() {
  const track = document.getElementById("newsTrack");

  try {
    const url = `https://newsdata.io/api/1/latest?apikey=pub_89b873b526ff4db383add5b9ebf47556&country=ng&category=business&language=en`;

    const res = await fetch(url);
    const data = await res.json();

    console.log("NewsData response:", data);

    if (!data.results || data.results.length === 0) {
      track.innerHTML = `
        <p style="color:#94a3b8;font-size:13px;padding:20px;">
          No news available right now.
        </p>
      `;
      return;
    }

    const tags = [
      "Markets",
      "Macro",
      "Tech",
      "Forex",
      "Crypto",
      "Commodities",
      "Global",
    ];

    function detectTag(title) {
      const text = title.toLowerCase();

      if (text.includes("bitcoin") || text.includes("crypto")) {
        return "Crypto";
      }

      if (text.includes("forex") || text.includes("usd")) {
        return "Forex";
      }

      if (
        text.includes("ai") ||
        text.includes("technology") ||
        text.includes("artificial intelligence")
      ) {
        return "Tech";
      }

      if (text.includes("oil") || text.includes("gold")) {
        return "Commodities";
      }

      if (
        text.includes("stocks") ||
        text.includes("market") ||
        text.includes("market") ||
        text.includes("bank")
      ) {
        return "Markets";
      }

      return "Global";
    }

    const colors = ["#0b57d0", "#067a58", "#7c3aed", "#d97706", "#c21f2f"];

    const cards = data.results.map((a, i) => ({
      title: a.title,
      source: a.source_name,
      time: timeAgo(parseNewsDate(a.pubDate)),
      // tag: tags[i % tags.length],
      tag: a.category.join(" / "),
      url: a.link,
      img: a.image_url,
      color: colors[i % colors.length],
    }));

    renderNewsCards(track, [...cards, ...cards]);

    track.innerHTML += track.innerHTML;

    track.addEventListener("scroll", () => {
      if (track.scrollLeft >= track.scrollWidth / 2) {
        track.scrollLeft = 0;
      }
    });
  } catch (err) {
    console.error("News API error:", err);

    track.innerHTML = `
      <p style="color:#94a3b8;font-size:13px;padding:20px;">
        Failed to load news.
      </p>
    `;
  }
}

function parseNewsDate(dateString) {
  if (!dateString) return new Date();

  // handle "YYYY-MM-DD HH:mm:ss"
  const isoLike = dateString.replace(" ", "T");

  return new Date(isoLike);
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diff < 1) return "just now";
  if (diff < 60) return diff + "m ago";
  if (diff < 1440) return Math.floor(diff / 60) + "h ago";
  return Math.floor(diff / 1440) + "d ago";
}

function renderNewsCards(track, articles) {
  track.innerHTML = articles
    .map(
      (a) => `
    <a class="news-card" href="${a.url}" target="_blank" rel="noopener">

      <span class="news-tag" style="background:${a.color}15;color:${a.color}">
        ${a.tag}  
      </span>
      <img style="  
        width: 100%;
        height: 160px;
        object-fit: cover;
        border-radius: 12px; " 
        src="${a.img}" 
        alt="News Image" 
        onerror="this.src='https://placehold.co/600x400?text=No+Image'">

      <p class="news-title">
        ${a.title}
      </p>

      <div class="news-meta">
        <span class="news-source">
          ${a.source}
        </span>

        <span class="news-time">
          ${a.time}
        </span>

      </div>
    </a>
  `,
    )
    .join("");

  // document.querySelectorAll(".news-card").forEach(enableTilt);
}

console.log(document.querySelectorAll(".news-card"));

// COOL 3D TILTING SHI

const heroCard = document.querySelector(".hero-card");

if (heroCard) {
  let bounds;

  function updateBounds() {
    bounds = heroCard.getBoundingClientRect();
  }

  window.addEventListener("resize", updateBounds);
  updateBounds();

  heroCard.addEventListener("mousemove", (e) => {
    const x = (e.clientX - bounds.left) / bounds.width - 0.5;
    const y = (e.clientY - bounds.top) / bounds.height - 0.5;

    const rotateX = -y * 12;
    const rotateY = x * 12;

    heroCard.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.02)
    `;
  });

  heroCard.addEventListener("mouseleave", () => {
    heroCard.style.transform = `
      perspective(1000px)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `;
  });
}

// AWESOME GLARE SHI

const glare = document.querySelector(".glare");

heroCard.addEventListener("mousemove", (e) => {
  const rect = heroCard.getBoundingClientRect();

  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  glare.style.opacity = "1";

  glare.style.background = `
    radial-gradient(
      circle at ${x}% ${y}%,
      rgba(12, 12, 12, 0.34),
      transparent 90%
    )
  `;
});

heroCard.addEventListener("mouseleave", () => {
  glare.style.opacity = "0";
});

// VISIBLE ANIMATION

const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal--visible");

        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2,
  },
);

reveals.forEach((reveal) => {
  observer.observe(reveal);
});

// ─── INIT ─────────────────────────────────────────────────
// fetchStockData(currentSymbol);
// convertCurrency();
loadNews();
