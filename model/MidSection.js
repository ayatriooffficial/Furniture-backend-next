const mongoose = require('mongoose');

const imagechangerSchema = new mongoose.Schema({
  staticContent: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
  },
  sections: [
    {
      heading: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      imageUrl: [
        {
          type: String,
          required: true,
        },
      ],
    },
  ],
});

const ImagechangerModel = mongoose.model('Imagechanger', imagechangerSchema);

module.exports = ImagechangerModel;