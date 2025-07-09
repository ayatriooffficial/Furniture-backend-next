const { getIndexing } = require("../controller/indexing");

const router = require("express").Router();

router.post("/", getIndexing);

module.exports = router;
