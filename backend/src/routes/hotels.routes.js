const { Router } = require("express");

const { auth, requireSuperAdmin } = require("../middleware/Auth");
const { listAll, createHotel } = require("../controllers/hotel.controller");

const router = Router();

router.use(auth);
router.use(requireSuperAdmin);
router.get("/", listAll);
router.post("/", createHotel);

module.exports = router;
