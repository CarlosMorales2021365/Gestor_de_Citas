"use strict"; 

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { dbConnection } from "./mongo.js";
import authRoutes from "../src/auth/auth.routes.js"
import citasRoutes from "../src/citas/citas.routes.js";

const middlewares = (app) => {
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());
    app.use(cors());
    app.use(helmet());
    app.use(morgan("dev"));
};

const routes = (app) => {
 app.use("/gestorDeCitas/v1/auth", authRoutes)
 app.use("/gestorDeCitas/v1/citas", citasRoutes)
};

const conectarDB = async () => {
    try {
        await dbConnection();
    } catch (err) {
        console.log(`Database connection failed: ${err}`);
        process.exit(1);
    }
};

export const initServer = () => {
    const app = express();
    try {
        middlewares(app);
        conectarDB();
        routes(app);
        const port = process.env.PORT || 3001; 
        app.listen(port, () => {
            console.log(`Server running on port ${port} `);
        });
    } catch (err) {
        console.log(`Server init failed: ${err}`);
    }
};