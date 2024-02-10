const sharp = require('sharp');

sharp('base.jpg')
    .overlayWith('overlay.png', { gravity: 'southeast' })
    .toFile('output.jpg', (err, info) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Image processed successfully:', info);
        }
    });
