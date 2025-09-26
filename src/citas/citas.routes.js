import { Router } from "express";
import { createCita, listarCitas, getCitasByFecha, moverCita, getReclutadoresEmpresa } from "../citas/citas.controller.js";
import { createCitasValidator, listarCitasValidator, getCitasByFechaValidator, moverCitaValidator, getReclutadoresEmpresaValidator } from "../middelwares/citas-validator.js";

const router = Router();

router.post("/crearCitas", createCitasValidator, createCita);

router.get("/listarCitas", listarCitasValidator, listarCitas);

router.post("/getCitasByFecha", getCitasByFechaValidator, getCitasByFecha);

router.post("/moverCita", moverCitaValidator, moverCita);

router.get("/reclutadoresEmpresa", getReclutadoresEmpresaValidator, getReclutadoresEmpresa);

export default router;