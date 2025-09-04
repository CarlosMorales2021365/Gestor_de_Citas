import { Schema, model} from 'mongoose';

const userSchema = new Schema({
    nombre: {
        type: String
    },
    apellido:{
        type: String
    },
    email:{
        type: String
    },
    password:{
        type: String
    },
    empresa:{
        type: String
    },
    telefono:{
        type: String
    },
    role: {
        type: String,
        enum: ['CANDIDATO_ROLE', 'RECLUTADOR_ROLE'],
    },
},
{
    versionKey: false,
    timestamps: true
})

userSchema.methods.toJSON = function(){
    const {password, _id, ...usuario} = this.toObject()
    usuario.uid = _id
    return usuario
}

export default model("User", userSchema)
