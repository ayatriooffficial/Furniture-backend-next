const mongoose = require("mongoose");

const imgchangerSchema = new mongoose.Schema({
  content: [
    {
      desc: {
        type: String,
        required: true,
      },
      img: [
        {
          type: String,
          required: true,
        },
      ],
      title: {
        type: String,
        required: true,
      },
    },
  ],
});
const Imgchanger = mongoose.model("Imgchanger", imgchangerSchema);
module.exports = Imgchanger;
