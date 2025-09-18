import { config } from "dotenv";
import { initServer } from "./configs/server.js";
import "./src/jobs/citaReminderJob.js";


config();
initServer();