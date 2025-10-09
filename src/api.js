import "dotenv/config";

/**
 * Récupère la liste des slugs des objets du marché Warframe.
 * @returns {Promise<string[]>} La liste des slugs des objets du marché Warframe
 * @throws {Error} Si une erreur survient lors de la récupération des données
 */
export async function getItems() {
  try {
    const response = await fetch("https://api.warframe.market/v2/items");
    const items = await response.json();
    return items.data.map((item) => item.slug);
  } catch (error) {
    console.error(error);
  }
}

/**
 * Récupère le token JWT après avoir envoyé une requête d'authentification
 * à l'API Warframe Market.
 * @returns {Promise<string>} Le token JWT obtenu ou null si une erreur survient
 * @throws {Error} Si l'authentification échoue
 */
export async function getJWT() {
  try {
    const response = await fetch("https://api.warframe.market/v1/auth/signin", {
      method: "POST",
      headers: {
        Authorization: "Bearer TOKEN",
        "Content-Type": "application/json",
        "User-Agent": "insomnia/11.2.0",
      },
      body: `{"auth_type":"header","email":"${process.env.EMAIL}","password":"${process.env.PASSWORD}","device_id":"DEV"}`,
    });
    if (!response.ok) {
      throw new Error("Network error: " + response.status);
    }
    const JWT = response.headers.get("Authorization").split(" ")[1];
    return JWT;
  } catch (err) {
    console.error("Échec de l'authentification: " + err.message);
  }
}

/**
 * Crée une commande sur le marché Warframe en utilisant le token JWT obtenu précédemment.
 * @param {string} JWT - Le token JWT obtenu précédemment
 * @param {Object} orderData - Les informations de la commande à créer
 * @param {number} orderData.itemId - L'ID de l'objet à acheter
 * @param {string} orderData.type - Le type d'objet (par exemple, "set" pour un set de pièces)
 * @param {boolean} orderData.visible - Si la commande est visible ou non
 * @param {number} orderData.platinum - Le prix de l'objet en platine
 * @param {number} orderData.quantity - La quantité de l'objet à acheter
 * @param {number} orderData.rank - Le rang de l'objet (par exemple, 1 pour un objet de rang 1) (facultatif)
 * @returns {Promise<void>} La promise qui sera résolue une fois la commande créée
 */
export async function setOrder(JWT, orderData) {
  try {
    const response = await fetch("https://api.warframe.market/v2/order", {
      method: "POST",
      headers: {
        "User-Agent": "insomnia/11.2.0",
        Authorization: `Bearer ${JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getItemId(itemName) {
  try {
    const response = await fetch(
      `https://api.warframe.market/v2/item/${itemName}`,
    );
    const item = await response.json();
    return item.data.id;
  } catch (error) {
    console.error(error);
  }
}

export async function updateOrder(
  JWT,
  orderData,
  orderId,
  callBack = () => {},
) {
  try {
    const response = await fetch(
      `https://api.warframe.market/v2/order/${orderId}`,
      {
        method: "PATCH",
        headers: {
          "User-Agent": "insomnia/11.2.0",
          Authorization: `Bearer ${JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      },
    );
    const data = await response.json();
    callBack(data);
    return data;
  } catch (error) {
    console.error(error);
  }
}

export async function getUserOrders(userName) {
  try {
    const response = await fetch(
      `https://api.warframe.market/v2/orders/user/${userName.toLowerCase()}?limit=100`,
    );
    const orders = await response.json();
    return orders.data.sort((a, b) => b.platinum - a.platinum);
  } catch (error) {
    console.error(error);
  }
}

export async function getMyOrders(JWT, callBack = () => {}) {
  try {
    const response = await fetch("https://api.warframe.market/v2/orders/my", {
      headers: {
        "User-Agent": "insomnia/11.2.0",
        Authorization: `Bearer ${JWT}`,
      },
    });
    const orders = await response.json();
    callBack(orders);
    return orders.data.sort((a, b) => b.platinum - a.platinum);
  } catch (error) {
    console.log("No orders found");
    console.error(error);
    return [];
  }
}

export async function getItemOrders(itemId) {
  try {
    const response = await fetch(
      `https://api.warframe.market/v2/orders/item/${itemId}?limit=100`,
    );
    const orders = await response.json();
    return orders.data.sort((a, b) => b.platinum - a.platinum);
  } catch (error) {
    console.error(error);
  }
}

export async function getItemNameById(itemId) {
  try {
    const response = await fetch("https://api.warframe.market/v2/items");
    const items = await response.json();
    const item = items.data.find((item) => item.id === itemId);
    return item ? item.slug : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
