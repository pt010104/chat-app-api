"user strict"

const cloudinary = require("../dbs/init.cloudinary");
const CONSTANT = require('../helpers/constants');
const User = require("../models/user.model");
const { Readable } = require('stream'); 

class UploadService {
    uploadImageFromLocal = async ({
        path,
        user_id,
        type = "avatar",
    }) => {
        try {
            let folderName = type + "/" + user_id;

            const uploadImage = await cloudinary.uploader.upload(path, {
                public_id: `${user_id}_${Date.now()}`, 
                folder: folderName,
            })
            let url = {};

            if (type == "avatar") {
                const avt_url = await cloudinary.url(uploadImage.public_id, {
                    width: CONSTANT.WIDTH_AVATAR,
                    height: CONSTANT.HEIGHT_AVATAR,
                    crop: "fill",
                    format: 'jpg'
                })
                const avt_thumb_url = await cloudinary.url(uploadImage.public_id, {
                    width: CONSTANT.WIDTH_THUMB_AVATAR,
                    height: CONSTANT.HEIGHT_THUMB_AVATAR,
                    crop: "fill",
                    format: 'jpg'
                })
                url['avt_url'] = avt_url;
                url['avt_thumb_url'] = avt_thumb_url;

                const uploadAvt = await User.updateOne(
                    { _id: user_id }, 
                    {
                        '$set': {
                            avatar: avt_url,
                            thumb_avatar: avt_thumb_url
                        }
                    }, 
                    {
                        upsert: true,
                        runValidators: true,
                    }
                );                
            }
           
            return {
                code: 200,
                metadata: {
                    url,
                    user_id: user_id,
                    type: type,
                }
            }
        }
        catch (error) {
            throw new Error(error)
        }
       
    }

    uploadImageFromBuffer = async ({
        buffer,
        user_id,
        type = "avatar",
    }) => {
        try {
            let folderName = type + "/" + user_id;
    
            // delete all images 
            await cloudinary.api.delete_resources_by_prefix(folderName, {
                invalidate: true,
                resource_type: 'image'
            });
    
            const uploadImage = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: `${user_id}_${Date.now()}`,
                        folder: folderName,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
    
                const readableStream = new Readable();
                readableStream.push(buffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            });
    
            let url = {};
    
            if (type == "avatar") {
                const avt_url = cloudinary.url(uploadImage.public_id, {
                    width: CONSTANT.WIDTH_AVATAR,
                    height: CONSTANT.HEIGHT_AVATAR,
                    crop: "fill",
                    format: 'jpg'
                });
                const avt_thumb_url = cloudinary.url(uploadImage.public_id, {
                    width: CONSTANT.WIDTH_THUMB_AVATAR,
                    height: CONSTANT.HEIGHT_THUMB_AVATAR,
                    crop: "fill",
                    format: 'jpg'
                });
                url['avt_url'] = avt_url;
                url['avt_thumb_url'] = avt_thumb_url;
    
                const uploadAvt = await User.updateOne(
                    { _id: user_id }, 
                    {
                        '$set': {
                            avatar: avt_url,
                            thumb_avatar: avt_thumb_url
                        }
                    }, 
                    {
                        upsert: true,
                        runValidators: true,
                    }
                );                
            }
           
            return {
                url,
                user_id: user_id,
                type: type,
            }
        }
        catch (error) {
            throw new Error(error)
        }
    }
}

module.exports = new UploadService();