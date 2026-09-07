import express from 'express'
import cors from 'cors'
import "dotenv/config"


const app = express();
app.use(cors())

app.get('/api/health',(req,res)=>{
    res.json({
        success: true,
        message: 'LMS backend is running'
    })
})
const PORT = process.env.PORT

app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})