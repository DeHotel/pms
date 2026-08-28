const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const roomTypeRoutes = require("./routes/roomType.routes");
const roomRoutes = require("./routes/room.routes");
const guestRoutes = require("./routes/guest.routes");
const companyRoutes = require("./routes/company.routes");
const hotelRoutes = require("./routes/hotel.routes");
const reservationRoutes = require("./routes/reservation.routes");
const userRoutes = require("./routes/user.routes");
const hotelsRoutes = require("./routes/hotels.routes");

const app = express();

app.use(cors());
// Límite subido de 100kb (default de Express) a 5mb: las fotos de huéspedes y
// usuarios viajan como data URL base64 dentro del JSON (ver guest.controller.js
// / user.controller.js), no como archivos multipart.
app.use(express.json({ limit: "5mb" }));

app.get("/", (req, res) => {
  res.json({
    message: "PMS HOTEL API",
  });
});

app.use("/auth", authRoutes);
app.use("/room-types", roomTypeRoutes);
app.use("/rooms", roomRoutes);
app.use("/guests", guestRoutes);
app.use("/companies", companyRoutes);
app.use("/hotel", hotelRoutes);
app.use("/reservations", reservationRoutes);
app.use("/users", userRoutes);
app.use("/hotels", hotelsRoutes);

module.exports = app;
