require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AuthModel = require("../../models/AuthModel");
const AuthenticationError = require("../../errorhandlers/AuthenticationError");
const JoiValidatorError = require("../../errorhandlers/JoiValidationError");

const {
  registerSchema,
  loginSchema
} = require("../../validators/authValidator");

class AuthenticationManager {

  static async register(payload) {
    // ✅ Joi validation here
    const { error, value } = registerSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      throw new JoiValidatorError(error);
    }

    const userModel = new AuthModel();

    value.password_hash = await bcrypt.hash(value.password, 10);
    delete value.password;

    const user = await userModel.createUser({
      email: value.email,
      password_hash: value.password_hash,
      name: value.name,
      phone: value.phone,
      gender: value.gender,
      profile_picture_url: value.profile_picture_url,
      role_id: value.role_id,
      address: value.address,
      location: value.location,
      date_of_birth: value.date_of_birth,
      postal_code: value.postal_code
    });

    delete user.password_hash;
    return user;
  }

  static async login(email, password) {
    // ✅ Joi validation here
    const { error } = loginSchema.validate(
      { email, password },
      { abortEarly: false }
    );

    if (error) {
      throw new JoiValidatorError(error);
    }

    const userModel = new AuthModel();

    const user = await userModel.getUserForLogin(email);
    if (!user) throw new AuthenticationError("Invalid email or password");

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new AuthenticationError("Invalid email or password");

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role_name
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    return {
      jwt_token: token,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role_name
      }
    };
  }
}

module.exports = AuthenticationManager;
