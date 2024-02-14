const { default: mongoose } = require("mongoose");


const nameMeaning = mongoose.model("nameMeaning", {
    letter: { type: String, required: true },
    meaning: { type: String, required: true },
});


const nameFact = mongoose.model("nameFact", {
    name: { type: String, required: true },
    fact: { type: String, required: true },
});


module.exports = { nameMeaning, nameFact }