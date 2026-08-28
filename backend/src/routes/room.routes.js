const { Router } = require("express");

const { auth } = require("../middleware/Auth");
const { list, create, updateStatus } = require("../controllers/room.controller");

const router = Router();

router.use(auth);
router.get("/", list);
router.post("/", create);
router.patch("/:id/status", updateStatus);

module.exports = router;
