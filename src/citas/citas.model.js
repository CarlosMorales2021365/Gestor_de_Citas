import { Schema, model } from "mongoose";

const citasSchema = new Schema({
    lugar:{
        type: String
    },
    fecha: {
        type: String
    },
    hora:{
        type: String
    },
    minuto:{
        type: String
    },
    usuario:{
        type: Schema.ObjectId,
        ref: "User"
    },
    candidato:{
        type: Schema.ObjectId,
        ref: "User"
    },
    status:{
        type: Boolean,
        default: true
    },
},{
    versionKey: false,
    timestamps: true
})

export default model('Citas', citasSchema)