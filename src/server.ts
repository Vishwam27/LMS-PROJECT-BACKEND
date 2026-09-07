import express from 'express'
import cors from 'cors'
import "dotenv/config"
import authRoutes from './routes/authRoutes'
import courseRoutes from './routes/courseRouts'
import enrollmentRoutes from "./routes/enrollmentRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import instructorRoutes from "./routes/instructorRoutes";
import categoryRoutes from "./routes/categroyController";

const app = express();
app.use(cors())
app.use(express.json())
app.get('/api/health',(req,res)=>{
    res.json({
        success: true,
        message: 'LMS backend is running'
    })
})
app.use('/api/courses', courseRoutes)
app.use('/api/auth', authRoutes)
app.use("/api/enrollment", enrollmentRoutes);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
app.use(
  "/api/instructor",
  instructorRoutes
  "/api/categories",
  categoryRoutes
);

const PORT = process.env.PORT

app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})