const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Image = require('../model/image.model');
const Category = require('../model/category.model');
const auth = require('../middelware/auth');

const storage = multer.diskStorage({
    destination: './uploads/', // Specify the upload directory
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(req.file)

        let { description, category, title, type, titleDifLang, descriptionDifLang } = req.body;

        titleDifLang = JSON.parse(titleDifLang);
        descriptionDifLang = JSON.parse(descriptionDifLang);


        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
        const image = await Image.create({ category, imageUrl, description, user: req.user.id, title, type, titleDifLang, descriptionDifLang });
        console.log(image);

        res.status(201).json(image);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }

});


router.post('/add-funfilter', auth, upload.single('image'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log(req.file)

    const { description, title, type } = req.body;



    if (!description) {
        return res.status(400).json({ message: 'Description is required' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    const image = await Image.create({ imageUrl, description, user: req.user.id, title, type });
    console.log(image);

});


router.get('/post-category/:category', async (req, res) => {

    let { category } = req.params;
    let lang = req.query.lang;

    try {
        const Post = await Image.find({ category: category });

        if (lang) {
            let result = await Post.map(post => {
                const title = post.titleDifLang.find(tit => tit.lang === lang);
                const description = post.descriptionDifLang.find(dis => dis.lang === lang);

                // If title or description is found in the specified language, use its text, otherwise fallback to default
                post.title = title ? title.text : post.title;
                post.description = description ? description.text : post.title;

                return post;
            });

            res.json(result);
        } else {

            res.json(Post);
        }



    } catch (error) {
        console.log(category)
        const post = await Image.find();
        res.status(200).json(post)
        // res.status(500).json({ message: 'Internal server error', err: error.message });
    }

});

router.post('/likes', auth, async (req, res) => {
    try {
        const postId = req.body.postId;
        const userId = req.user.id;

        // Check if the user has already liked the post
        const post = await Image.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.likes.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this post' });
        }

        // Add user's ID to the likes array and save the post
        post.likes.push(userId);
        await post.save();

        res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/share', async (req, res) => {
    try {
        const response = await Image.findByIdAndUpdate(req.body.postId, { $inc: { shares: 1 } })

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/add-comment', auth, async (req, res) => {
    if (!req.body.postId) res.status(404).json({ message: 'Poll id is required' });

    if (!req.body.comment) res.status(404).json({ message: 'Comment is required' });

    try {
        const response = await Image.findByIdAndUpdate(req.body.postId, { $push: { comments: { text: req.body.comment, user: req.user.id } } });
        res.status(200).json({
            message: "comment added successfully",
            data: response
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/add-category', async (req, res) => {

    let { title, category } = req.body;

    if (!category) {
        res.status(404).json({ message: "title is required" });
    }

    if (!title) {
        title = [];
    }


    try {
        const cate = await Category.create({ default: category, title });

        res.status(200).json({ category: cate });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});


router.get('/categories', async (req, res) => {
    try {
        let lang = req.query.lang;

        const results = await Category.find();
        if (lang && lang !== "english") {
            console.log(results)

            if (results.length > 0) {
                const texts = results.map(result => {
                    const titleObj = result.title.find(t => t.lang === lang);


                    return {
                        _id: result._id,
                        text: titleObj ? titleObj.text : result.default || ''
                    };


                });
                console.log(texts);
                res.status(200).json(texts);
            } else {
                res.status(404).json({ message: 'No categories found for the specified language' });
            }
        } else {
            res.status(200).json(results);
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

router.delete("/delete/:id", auth, async function (req, res) {

    try {
        await Image.deleteOne({ _id: req.params.id })
        res.status(200).json({ message: "Deleted successfully", success: true });
    } catch (error) {
        res.status(200).json({ message: error.message, success: false });

    }

});


module.exports = router;