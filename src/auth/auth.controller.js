import { hash, verify } from "argon2"
import User from "../user/user.model.js"
import { generateJWT } from "../helpers/generate-jwt.js"

export const register = async (req, res) => {
    try{
        const data = req.body;
        const encryptedPassword = await hash(data.password)
        data.password = encryptedPassword
        const user = await User.create(data);

        return res.status(201).json({
            message: "User has been created",
            name: user.name,
           }) 
    }catch(err){
        return res.status(500).json({
            message: "User registration failed",
            error: err.message
        });
    }
}

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Credenciales inválidas",
        error: "No existe el usuario con ese correo",
      });
    }

    const validPassword = await verify(user.password, password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Credenciales inválidas",
        error: "Contraseña incorrecta",
      })
    }

    const token = await generateJWT(user.id);

    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        name: user.name, 
        role: user.role, 
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Login failed, server error",
      error: err.message,
    });
  }
};