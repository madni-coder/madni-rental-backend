const cookieName = "razvi_token";

const adminUser = {
    email: process.env.ADMIN_EMAIL || "admin@razvi",
    id: "admin",
    name: "Razvi Admin",
    role: "Administrator",
};

const adminPassword = process.env.ADMIN_PASSWORD || "123";

module.exports = {
    adminPassword,
    adminUser,
    cookieName,
};