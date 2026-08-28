const { Router } = require("express");

const { auth, requireRole } = require("../middleware/Auth");
const { list, create, update, remove } = require("../controllers/user.controller");

const router = Router();

router.use(auth);
router.use(requireRole("ADMIN", "SUPER_ADMIN"));
router.get("/", list);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

module.exports = router;
