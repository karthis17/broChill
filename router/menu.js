const router = require('express').Router();
const adminRole = require('../middelware/checkRole');
const auth = require('../middelware/auth');
const Menu = require('../model/menu.model');

router.get('/get-all', async (req, res) => {

    let lang = req.query.lang;

    try {
        const menu = await Menu.find();

        if (lang) {

            const result = await menu.map(function (item) {

                const title = item.titleDifLang.find(title => title.lang.toLowerCase() === lang.toLowerCase());

                item['title'] = title ? title.text : item.title;

                return item;
            })
            res.send(result);
        }

        else {
            res.send(menu);
        }

    } catch (error) {
        res.status(500).send({ error: error.message });
    }

});

router.get('/get/:id', async (req, res) => {

    let lang = req.query.lang;

    try {
        const menu = await Menu.findById(req.params.id);

        if (lang) {

            const title = menu.titleDifLang.find(title => title.lang.toLowerCase() === lang.toLowerCase());

            menu['title'] = title ? title.text : menu.title;
        }


        res.send(menu)


    } catch (error) {
        res.status(500).send({ error: error.message });
    }

});




module.exports = router;