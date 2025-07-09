const Store = require("../model/Store");

//at the time of store id is not saved but in finding id is used

// POST: '/api/store'
exports.createStore = async (req, res) => {
  try {
    const { name, address, phone } = req.body;

    const store = new Store({
      name,
      address,
      phone,
    });

    await store.save();
    res.status(201).json({ message: "Store added successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/store'
exports.getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/store/:id'
exports.getStoreById = async (req, res) => {
  const { id } = req.params;

  try {
    const store = await Store.findById(id);
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH: '/api/store/:id'
exports.updateStore = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone } = req.body;

  try {
    await Store.findByIdAndUpdate(id, { name, address, phone });
    res.status(200).json({ message: "Store updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE: '/api/store/:id'
exports.deleteStore = async (req, res) => {
  const { id } = req.params;

  try {
    await Store.findByIdAndDelete(id);
    res.status(200).json({ message: "Store deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.searchStore = async (req, res) => {
  try {
    const { search } = req.query;
    let query = Store.find({});
    if (search) {
      query = query.find({
        $or: [
          { name: { $regex: new RegExp(search, "i") } },
          { "address.streetAddress": { $regex: new RegExp(search, "i") } },
        ],
      });
    }
    const stores = await query;
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
