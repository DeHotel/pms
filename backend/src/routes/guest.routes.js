const { Router } = require("express");

const { auth } = require("../middleware/Auth");
const { list, create, update, remove } = require("../controllers/guest.controller");

const router = Router();

router.use(auth);
router.get("/", list);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

module.exports = router;
