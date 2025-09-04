import { Router } from "express";
import { createCita, listarCitas, getCitasByFecha } from "../citas/citas.controller.js";
import { createCitasValidator, listarCitasValidator, getCitasByFechaValidator } from "../middelwares/citas-validator.js";

const router = Router();

router.post("/crearCitas", createCitasValidator, createCita);

router.get("/listarCitas", listarCitasValidator, listarCitas);

router.post("/getCitasByFecha", getCitasByFechaValidator, getCitasByFecha);

export default router;