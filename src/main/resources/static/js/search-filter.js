
const API_URL = "/api/products";

const searchInput = document.getElementById("searchInput");
const restaurantList = document.getElementById("restaurantList");
const resultMessage = document.getElementById("resultMessage");

let allProducts = [];

async function loadProducts() {
  resultMessage.textContent = "กำลังโหลดรายการเมนู...";

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("ไม่สามารถโหลดรายการเมนูได้");
    }

    allProducts = await response.json();
    renderProducts(allProducts);
  } catch (error) {
    console.error("โหลดเมนูล้มเหลว:", error);
    resultMessage.textContent =
      "โหลดเมนูไม่สำเร็จ กรุณาตรวจสอบว่า Spring Boot ทำงานอยู่";
    restaurantList.replaceChildren();
  }
}

function renderProducts(products) {
  restaurantList.replaceChildren();

  if (products.length === 0) {
    resultMessage.textContent = "ไม่พบเมนูที่ค้นหา";
    return;
  }

  resultMessage.textContent = `พบ ${products.length} เมนู`;

  products.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const name = document.createElement("h3");
    name.textContent = product.name ?? "ไม่ระบุชื่อเมนู";

    const price = document.createElement("p");
    price.textContent =
      Number.isFinite(Number(product.price))
        ? `${Number(product.price).toLocaleString("th-TH")} บาท`
        : "ไม่ระบุราคา";

    card.append(name, price);
    restaurantList.appendChild(card);
  });
}

function filterProducts() {
  const keyword = searchInput.value.trim().toLocaleLowerCase("th");

  const filteredProducts = allProducts.filter((product) => {
    const name = String(product.name ?? "").toLocaleLowerCase("th");
    return name.includes(keyword);
  });

  renderProducts(filteredProducts);
}

searchInput.addEventListener("input", filterProducts);

loadProducts();
