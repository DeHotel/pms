const { Router } = require("express");

const { auth } = require("../middleware/Auth");
const { getCurrent, updateCurrent } = require("../controllers/hotel.controller");

const router = Router();

router.use(auth);
router.get("/", getCurrent);
router.patch("/", updateCurrent);

module.exports = router;
