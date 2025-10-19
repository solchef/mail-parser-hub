import CryptoJS from "crypto-js";


export const encryptPassword = (password) => {
    const encryptedPassword = CryptoJS.AES.encrypt(
        password,
        process.env.SECRET_KEY || 'securexdrty'
    ).toString();

    return encryptedPassword;
}

export const decryptPassword = (password) => {
    const decryptedPassword = CryptoJS.AES.decrypt(
        password,
        process.env.SECRET_KEY || 'securexdrty'
    ).toString();

    return decryptedPassword;
}