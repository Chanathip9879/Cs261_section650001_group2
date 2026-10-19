const phone = document.getElementById("phone");
const screens = {
    login: document.getElementById("screen-login"),
    home: document.getElementById("screen-home"),
    all: document.getElementById("screen-all"),
    detail: document.getElementById("screen-detail"),
    menu: document.getElementById("screen-menu"),
    map: document.getElementById("screen-map"),
    owner: document.getElementById("screen-owner")
};

const TOKEN_KEY = "ownerToken";
const OWNER_KEY = "ownerSession";
let currentScreen = "home";
let currentRestaurantId = 2;
let historyStack = [];

function isLoggedIn() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
}

function showScreen(name, { push = true } = {}) {
    if (!screens[name]) return;
    if (push && currentScreen && currentScreen !== name) {
        historyStack.push(currentScreen);
    }
    currentScreen = name;
    Object.entries(screens).forEach(([key, el]) => {
        el.hidden = key !== name;
    });
    phone.classList.toggle("hide-nav", name === "login");
    document.querySelectorAll(".nav-item").forEach((item) => {
        const target = item.dataset.go;
        const active =
            (target === "home" && name === "home") ||
            (target === "all" && (name === "all" || name === "detail" || name === "menu")) ||
            (target === "map" && name === "map") ||
            (target === "account" && (name === "login" || name === "owner"));
        item.classList.toggle("active", active);
    });
}

window.showScreen = showScreen;

function goBack() {
    const prev = historyStack.pop() || "home";
    showScreen(prev, { push: false });
}

function getRestaurant(id) {
    return restaurants.find((item) => item.id === Number(id)) || restaurants[0];
}

function menuRows(restaurant) {
    return restaurant.menu.map((item) => `
        <article class="menu-row">
            <img src="${item.image}" alt="${item.name}">
            <div>
                <h4>${item.name}</h4>
                <p class="muted">เมนูแนะนำ</p>
            </div>
            <span class="price">${item.price} ฿</span>
        </article>
    `).join("");
}

function renderDetail(restaurant) {
    currentRestaurantId = restaurant.id;
    const state = getStatusState(restaurant);
    const view = STATUS_VIEW[state] ?? STATUS_VIEW.unknown;
    document.getElementById("detailHero").style.backgroundImage = `url("${restaurant.image}")`;
    document.getElementById("detailName").textContent = restaurant.name;
    document.getElementById("detailMeta").textContent = `${restaurant.location} · ${restaurant.hours} น.`;
    const badge = document.getElementById("detailStatus");
    badge.className = `badge ${view.cssClass}`;
    badge.dataset.statusId = String(restaurant.id);
    badge.textContent = view.text;
    document.getElementById("tab-menu").innerHTML = menuRows(restaurant);
}

window.openRestaurant = function openRestaurant(id) {
    const restaurant = getRestaurant(id);
    renderDetail(restaurant);
    showScreen("detail");
};

function renderMenuGrid(restaurant) {
    document.getElementById("menuGrid").innerHTML = restaurant.menu.map((item) => `
        <article class="menu-item">
            <img src="${item.image}" alt="${item.name}">
            <div>
                <h4>${item.name}</h4>
                <p class="price">${item.price} ฿</p>
            </div>
        </article>
    `).join("");
}

function renderMap(restaurant) {
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${restaurant.lng - 0.01}%2C${restaurant.lat - 0.01}%2C${restaurant.lng + 0.01}%2C${restaurant.lat + 0.01}&layer=mapnik&marker=${restaurant.lat}%2C${restaurant.lng}`;
    document.getElementById("mapCanvas").innerHTML = `<iframe title="แผนที่ร้าน" src="${src}"></iframe>`;
    document.getElementById("mapCard").innerHTML = `
        <img src="${restaurant.image}" alt="${restaurant.name}">
        <div>
            <span class="badge open">เปิดอยู่</span>
            <h3>${restaurant.name}</h3>
            <p class="muted">${restaurant.location}</p>
        </div>
    `;
    document.getElementById("mapCard").onclick = () => window.openRestaurant(restaurant.id);
}

function renderOwner() {
    const session = JSON.parse(localStorage.getItem(OWNER_KEY) || "{}");
    const restaurant = getRestaurant(session.restaurantId || 1);
    currentRestaurantId = restaurant.id;
    const state = getStatusState(restaurant);
    document.getElementById("ownerHero").innerHTML = `
        <img src="${restaurant.image}" alt="${restaurant.name}">
        <div>
            <h2>${restaurant.name}</h2>
            <p class="muted">${restaurant.location}</p>
        </div>
    `;
    document.getElementById("btnOpen").classList.toggle("is-on", state === "open");
    document.getElementById("btnClose").classList.toggle("is-on", state !== "open");
    document.getElementById("ownerMenu").innerHTML = menuRows(restaurant);
}

document.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
        const target = el.dataset.go;
        if (target === "account") {
            showScreen(isLoggedIn() ? "owner" : "login");
            if (isLoggedIn()) renderOwner();
            return;
        }
        if (target === "map") {
            renderMap(getRestaurant(currentRestaurantId));
        }
        if (target === "owner" && !isLoggedIn()) {
            showScreen("login");
            return;
        }
        showScreen(target);
        if (target === "owner") renderOwner();
    });
});

document.querySelectorAll("[data-back]").forEach((el) => {
    el.addEventListener("click", goBack);
});

document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
        const selected = tab.dataset.tab;
        document.getElementById("tab-menu").hidden = selected !== "menu";
        document.getElementById("tab-review").hidden = selected !== "review";
        document.getElementById("tab-map").hidden = selected !== "map";
        document.getElementById("openFullMenu").hidden = selected !== "menu";
        if (selected === "map") {
            renderMap(getRestaurant(currentRestaurantId));
            showScreen("map");
        }
        if (selected === "menu") {
            renderMenuGrid(getRestaurant(currentRestaurantId));
        }
    });
});

document.getElementById("openMapFromDetail").addEventListener("click", () => {
    renderMap(getRestaurant(currentRestaurantId));
    showScreen("map");
});

document.getElementById("openFullMenu").addEventListener("click", () => {
    renderMenuGrid(getRestaurant(currentRestaurantId));
    showScreen("menu");
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const phoneValue = document.getElementById("phoneInput").value.trim();
    const pinValue = document.getElementById("pinInput").value.trim();
    const errorEl = document.getElementById("loginError");
    const pinInput = document.getElementById("pinInput");
    const submit = document.getElementById("loginSubmit");
    errorEl.hidden = true;
    pinInput.classList.remove("is-invalid");
    submit.disabled = true;
    submit.textContent = "กำลังเข้าสู่ระบบ...";

    try {
        const response = await fetch("/api/auth/owner/login", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ phone: phoneValue, pin: pinValue })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            pinInput.classList.add("is-invalid");
            errorEl.hidden = false;
            errorEl.textContent = data.message || "เบอร์โทรศัพท์หรือ PIN ไม่ถูกต้อง";
            return;
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(OWNER_KEY, JSON.stringify({
            ownerId: data.ownerId,
            restaurantId: data.restaurantId
        }));
        renderOwner();
        showScreen("owner");
    } catch (error) {
        pinInput.classList.add("is-invalid");
        errorEl.hidden = false;
        errorEl.textContent = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่";
    } finally {
        submit.disabled = false;
        submit.textContent = "เข้าสู่ระบบ";
    }
});

document.getElementById("forgotPin").addEventListener("click", () => {
    const errorEl = document.getElementById("loginError");
    errorEl.hidden = false;
    errorEl.textContent = "กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ต PIN";
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (error) {
        // ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OWNER_KEY);
    showScreen("login");
});

document.getElementById("btnOpen").addEventListener("click", () => {
    statusById[currentRestaurantId] = { state: "open" };
    const restaurant = getRestaurant(currentRestaurantId);
    restaurant.status = "open";
    renderOwner();
    updateResults();
});

document.getElementById("btnClose").addEventListener("click", () => {
    statusById[currentRestaurantId] = { state: "closed" };
    const restaurant = getRestaurant(currentRestaurantId);
    restaurant.status = "closed";
    renderOwner();
    updateResults();
});

const addMenuModal = document.getElementById("addMenuModal");
document.getElementById("addMenuBtn").addEventListener("click", () => {
    addMenuModal.hidden = false;
});
document.getElementById("cancelMenu").addEventListener("click", () => {
    addMenuModal.hidden = true;
});
document.getElementById("addMenuForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.name.value.trim();
    const price = Number(form.price.value);
    const restaurant = getRestaurant(currentRestaurantId);
    restaurant.menu.push({
        name,
        price,
        image: restaurant.image
    });
    form.reset();
    addMenuModal.hidden = true;
    renderOwner();
});

if (document.querySelector(".tab[data-tab='menu']")) {
    document.querySelector(".tab[data-tab='menu']").addEventListener("dblclick", () => {
        renderMenuGrid(getRestaurant(currentRestaurantId));
        showScreen("menu");
    });
}

showScreen(isLoggedIn() ? "home" : "home", { push: false });
