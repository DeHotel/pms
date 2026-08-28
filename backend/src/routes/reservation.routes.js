const { Router } = require("express");

const { auth } = require("../middleware/Auth");
const {
  list,
  create,
  update,
  updateStatus,
} = require("../controllers/reservation.controller");

const router = Router();

router.use(auth);
router.get("/", list);
router.post("/", create);
router.patch("/:id/status", updateStatus);
router.patch("/:id", update);

module.exports = router;
