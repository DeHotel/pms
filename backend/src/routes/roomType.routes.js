const { Router } = require("express");

const { auth } = require("../middleware/Auth");
const { list, create } = require("../controllers/roomType.controller");

const router = Router();

router.use(auth);
router.get("/", list);
router.post("/", create);

module.exports = router;
