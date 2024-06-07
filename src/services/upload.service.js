"user strict"

const cloudinary = require("../dbs/init.cloudinary");
const CONSTANT = require('../helpers/constants');
const User = require("../models/user.model");

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
}

module.exports = new UploadService();