import express from 'express'
import cors from 'cors'
import "dotenv/config"
import authRoutes from './routes/authRoutes'
import courseRoutes from './routes/courseRouts'



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

const PORT = process.env.PORT

app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})