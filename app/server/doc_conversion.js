/**
 * Created by qzhang8 on 6/17/16.
 * to convert the uploaded doc file into HTML5 pages
 */

const PdfImage = require('pdf-image');


/**
 * TODO support other encodings:
 * http://stackoverflow.com/questions/7329128/how-to-write-binary-data-to-a-file-using-node-js
 */
Meteor.methods({
    saveFile: function(blob, name, path, encoding) {
        var path = cleanPath(path), fs = Npm.require('fs'),
            name = cleanName(name || 'file'), encoding = encoding || 'binary',
            chroot = Meteor.chroot || (process.env['PWD'] +'/public') ;
        // Clean up the path. Remove any initial and final '/' -we prefix them-,
        // any sort of attempt to go to the parent directory '..' and any empty directories in
        // between '/////' - which may happen after removing '..'
        path = chroot + (path ? '/' + path + '/' : '/');

        // TODO Add file existance checks, etc...
        fs.writeFile(path + name, blob, encoding, function(err) {
            if (err) {
                throw (new Meteor.Error(500, 'Failed to save file.', err));
            } else {
                Meteor.log.info('The file ' + name + ' (' + encoding + ') was saved to ' + path);
                var PDFImage = PdfImage.PDFImage;
                var pdfImage = new PDFImage(path + name);
                function convert(page, notify) {
                    if (page >= 0) {
                        Meteor.log.info("converting " + page);
                        pdfImage.convertPage(page).then(function(imagePath) {
                            convert(--page);
                        });
                    } else return;
                }
                pdfImage.numberOfPages().then(function (numberOfPages) {
                    Meteor.log.info(numberOfPages);
                    convert(numberOfPages-1);
                });

                let reply;
                reply = {
                    "payload": {
                        "meeting_id": "meeting001",
                        presentation: {
                            id: "presentation001",
                            name: name,
                            current: true,
                            pages: [
                                {
                                    height_ratio: 100,
                                    y_offset: 0,
                                    num: 0,
                                    x_offset: 0,
                                    current: true,
                                    png_uri: 'http://localhost:3000/'+ 'smarx_fec' + '-0.png',
                                    id: 'presentation001/0',
                                    width_ratio: 100,
                                }
                            ]

                        },
                        pointer: {
                            x: 0.0,
                            y: 0.0
                        },
                    },
                    "header": {
                        "timestamp": new Date().getTime(),
                        "name": "presentation_shared_message"
                    }
                };

                publish(Meteor.config.redis.channels.fromBBBApps, reply);

            }
        });

        function cleanPath(str) {
            if (str) {
                return str.replace(/\.\./g,'').replace(/\/+/g,'').
                replace(/^\/+/,'').replace(/\/+$/,'');
            }
        }
        function cleanName(str) {
            return str.replace(/\.\./g,'').replace(/\//g,'');
        }
    }
});