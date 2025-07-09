const mongoose = require('mongoose');

const ImgSchema = new mongoose.Schema({
 img:{type:String},
 text:{type:String}
});

const ImgSchemaDB = mongoose.model('MidImages', ImgSchema);

module.exports = ImgSchemaDB;
